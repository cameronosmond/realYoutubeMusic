import { useLocation, useParams } from "react-router-dom";

interface Song {
  title: string;
  playlistTitle: string;
  channelName: string;
}

function Songs() {
  const location = useLocation();
  const songs = (location.state as { songs: Song[] })?.songs;
  const { artist } = useParams<{ artist: string }>();

  return (
    <div>
      <h1>Songs by {artist}</h1>
      <ul>
        {songs.map((song, index) => (
          <li key={index}>
            {song.title} by {song.channelName} in playlist: {song.playlistTitle}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Songs;
