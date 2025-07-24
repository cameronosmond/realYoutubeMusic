import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Song {
  title: string;
  playlistTitle: string;
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
    const songsSeen: Map<string, string> = new Map();
    // create map with key value pairings of (song title, playlists song is in)
    for (const song of songs) {
      if (!songsSeen.has(song.title)) {
        songsSeen.set(song.title, song.playlistTitle);
      } else {
        const playlists = songsSeen.get(song.title);
        songsSeen.set(song.title, `${playlists}, ${song.playlistTitle}`);
      }
      numberSongs += 1;
    }
    setTotalSongs(numberSongs);

    let unique: number = 0;
    const songsFiltered: Song[] = [];
    // iterate through map and add Song objects to songsFiltered
    for (const [key, value] of songsSeen) {
      songsFiltered.push({ title: key, playlistTitle: value });
      unique += 1;
    }
    setUniqueSongs(unique);

    // sort songs in alphabetical order by their titles
    songsFiltered.sort((a, b) => a.title.localeCompare(b.title));

    setSongsArray(songsFiltered);
    setLoading(false);
  }, [songs]);

  return (
    <>
      <Link to={`/dashboard/${encoded}`}>
        <h2 id="dashboardText">⬅️ Back to Dashboard</h2>
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
                  <strong>{song.title}</strong> - Playlist(s):{" "}
                  <strong>{song.playlistTitle}</strong>
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
