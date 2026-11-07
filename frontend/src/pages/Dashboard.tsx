import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Song {
  title: string;
  playlistTitle: string;
  youtubeId?: string;
  thumbnailUrl?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { encoded } = useParams<{ encoded: string }>();

  const pollSearch = async (
    artistNameLower: string,
    attempt = 1,
  ): Promise<Song[]> => {
    const maxRetries = 15;
    const baseDelay = 1500;

    const res = await fetch(`${apiUrl}/search`, {
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

    if (res.status === 202) {
      if (attempt > maxRetries) {
        throw new Error("Sync timeout: Background process took too long.");
      }
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 5000);
      console.log(
        `Library is syncing. Polling again in ${delay}ms... (Attempt ${attempt})`,
      );

      await sleep(delay);
      return pollSearch(artistNameLower, attempt + 1);
    }

    const data = await res.json();

    if (res.ok) {
      return data;
    } else {
      throw new Error(data.error || "Search failed");
    }
  };

  const getSongs = async (formData: FormData) => {
    const artistName = formData.get("artistName") as string;
    const artistNameLower = artistName.toLowerCase();

    try {
      const songs = await pollSearch(artistNameLower);
      setLoading(false);
      navigate(`/songs/${encoded}/${artistName}`, { state: { songs } });
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError(true);
    }
  };

  return (
    <>
      <Link to={`/`}>
        <h2 className="backText">⬅️ Back to Login</h2>
      </Link>
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
                setError(false);
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
            {error && <h2 color="red">Error, try logging in again</h2>}
          </>
        )}
      </FadeContent>
    </>
  );
}

export default Dashboard;
