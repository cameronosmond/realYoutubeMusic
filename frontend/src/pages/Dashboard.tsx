import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

interface Props {
  userId: string;
}

function Dashboard({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const getSongs = async (formData: FormData) => {
    setLoading(true);

    const query = formData.get("artistName") as string;
    const artistName = query.toLowerCase();

    try {
      // calling getSongsByArtist lambda function
      const res = await fetch(`${apiUrl}/getSongsByArtist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: artistName,
          userId: userId,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        console.log("Songs: ", data.results);
      } else {
        console.error("Error:", data.error || data);
      }
    } catch (error) {
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
