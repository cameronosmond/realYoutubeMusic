import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Song {
  title: string;
  playlistTitle: string;
  channelName: string;
}

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const getSongs = async (formData: FormData) => {
    setLoading(true);

    const artistName = formData.get("artistName") as string;
    const artistNameLower = artistName.toLowerCase();

    try {
      // calling getSongsByArtist lambda function
      const res = await fetch(`${apiUrl}/getSongsByArtist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          artistName: artistNameLower,
          userId: userId,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // sort songs in alphabetical order by their titles
        const songs: Song[] = data.result;
        songs.sort((a, b) => a.title.localeCompare(b.title));
        navigate(`/songs/${artistName}`, { state: { songs } });
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
        <form action={getSongs}>
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
