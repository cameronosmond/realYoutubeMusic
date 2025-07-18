import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Song {
  title: string;
  playlistTitle: string;
}

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { encoded } = useParams<{ encoded: string }>();

  const getSongs = async (formData: FormData) => {
    const artistName = formData.get("artistName") as string;
    const artistNameLower = artistName.toLowerCase();

    try {
      // calling getSongsByArtist lambda function via api gateway endpoint
      const res = await fetch(`${apiUrl}/getSongsByArtist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          artistName: artistNameLower,
          encoded,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        const songs: Song[] = data.result;
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

        navigate(`/songs/${artistName}`, { state: { songsFiltered } });
      } else {
        console.error("Error:", data.error || data);
      }
    } catch (error) {
      setLoading(false);
      console.trace(error);
    }
  };

  return (
    <FadeContent
      blur={true}
      duration={1000}
      easing="ease-out"
      initialOpacity={0}>
      {loading ? (
        <FourSquare
          color="rgba(255, 255, 255, 0.87)"
          size="large"
          text="Loading"
          textColor="rgba(255, 255, 255, 0.87)"
        />
      ) : (
        <form
          action={(formData: FormData) => {
            setLoading(true);
            getSongs(formData);
          }}>
          <label>
            Enter artist name: <input name="artistName" />
            <button type="submit">Search</button>
          </label>
        </form>
      )}
    </FadeContent>
  );
}

export default Dashboard;
