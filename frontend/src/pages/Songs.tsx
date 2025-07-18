import { useLocation, useParams } from "react-router-dom";
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
  const { artist } = useParams<{ artist: string }>();

  useEffect(() => {
    setLoading(true);
    const songsSeen: Map<string, string> = new Map();
    // create map with key value pairings of (song title, playlists song is in)
    for (const song of songs) {
      if (!songsSeen.has(song.title)) {
        songsSeen.set(song.title, song.playlistTitle);
      } else {
        const playlists = songsSeen.get(song.title);
        songsSeen.set(song.title, `${playlists}, ${song.playlistTitle}`);
      }
    }

    const songsFiltered: Song[] = [];
    // iterate through map and add Song objects to songsFiltered
    for (const [key, value] of songsSeen) {
      songsFiltered.push({ title: key, playlistTitle: value });
    }

    // sort songs in alphabetical order by their titles
    songsFiltered.sort((a, b) => a.title.localeCompare(b.title));

    setSongsArray(songsFiltered);
    setLoading(false);
  }, [songs]);

  return (
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
        <ul>
          {songsArray.map((song) => (
            <li key={song.title}>
              <strong>{song.title}</strong> - Playlist(s):{" "}
              <strong>{song.playlistTitle}</strong>
            </li>
          ))}
        </ul>
      )}
    </FadeContent>
  );
}

export default Songs;
