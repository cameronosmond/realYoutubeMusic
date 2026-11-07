import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Song {
  title: string;
  playlistTitle: string;
  youtubeId?: string;
  thumbnailUrl?: string;
}

function Songs() {
  const location = useLocation();
  const songs = (location.state as { songs: Song[] })?.songs;
  const [loading, setLoading] = useState(false);
  const [songsArray, setSongsArray] = useState<Song[]>([]);
  const [totalSongs, setTotalSongs] = useState(0);
  const [uniqueSongs, setUniqueSongs] = useState(0);
  const { encoded, artist } = useParams<{ encoded: string; artist: string }>();

  useEffect(() => {
    setLoading(true);
    let numberSongs: number = 0;

    // (song title, song object)
    const songsSeen: Map<string, Song> = new Map();

    for (const song of songs) {
      if (!songsSeen.has(song.title)) {
        songsSeen.set(song.title, { ...song });
      } else {
        const existingSong = songsSeen.get(song.title)!;
        songsSeen.set(song.title, {
          ...existingSong,
          playlistTitle: `${existingSong.playlistTitle}, ${song.playlistTitle}`,
        });
      }
      numberSongs += 1;
    }
    setTotalSongs(numberSongs);

    // convert map to array
    const songsFiltered: Song[] = Array.from(songsSeen.values());
    setUniqueSongs(songsFiltered.length);

    // sort songs in alphabetical order by their titles
    songsFiltered.sort((a, b) => a.title.localeCompare(b.title));

    setSongsArray(songsFiltered);
    setLoading(false);
  }, [songs]);

  return (
    <>
      <Link to={`/dashboard/${encoded}`}>
        <h2 className="backText">⬅️ Back to Dashboard</h2>
      </Link>
      <FadeContent
        blur={true}
        duration={1000}
        easing="ease-out"
        initialOpacity={0}>
        <h1>Songs by {artist} in your playlists</h1>
        {loading ? (
          <FourSquare
            color="rgba(255, 255, 255, 0.87)"
            size="large"
            text="Loading"
            textColor="rgba(255, 255, 255, 0.87)"
          />
        ) : !songsArray || songsArray.length === 0 ? (
          <p>No songs found</p>
        ) : (
          <>
            <h2>
              Total Song Count: {totalSongs}
              <br />
              Unique Song Count: {uniqueSongs}
            </h2>
            <ul>
              {songsArray.map((song) => (
                <li key={song.title}>
                  <strong>
                    {song.youtubeId ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "inherit",
                          textDecoration: "underline",
                        }}>
                        {song.title}
                      </a>
                    ) : (
                      song.title
                    )}
                  </strong>
                  <br />
                  Playlist(s): <strong>{song.playlistTitle}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </FadeContent>
    </>
  );
}

export default Songs;
