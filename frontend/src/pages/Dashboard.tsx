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
        navigate(`/songs/${encoded}/${artistName}`, { state: { songs } });
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
        <>
          <h1>Dashboard</h1>
          <form
            id="form"
            action={(formData: FormData) => {
              setLoading(true);
              getSongs(formData);
            }}>
            <input
              id="textInput"
              name="artistName"
              placeholder="Enter artist name..."
            />
            <button id="searchButton" type="submit">
              Search
            </button>
          </form>
        </>
      )}
    </FadeContent>
  );
}

export default Dashboard;
