import { useLocation, useParams } from "react-router-dom";

interface Song {
  title: string;
  playlistTitle: string;
}

function Songs() {
  const location = useLocation();
  const songs = (location.state as { songs: Song[] })?.songs;
  const { artist } = useParams<{ artist: string }>();

  return (
    <div>
      <h1>Songs by {artist} in your playlists</h1>
      <ul>
        {songs.map((song, index) => (
          <li key={index}>
            <strong>{song.title}</strong> - Playlist:{" "}
            <strong>{song.playlistTitle}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Songs;
