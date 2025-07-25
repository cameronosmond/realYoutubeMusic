import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FadeContent from "../components/FadeContent";
import { FourSquare } from "react-loading-indicators";

function Login() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const client = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: "openid https://www.googleapis.com/auth/youtube.readonly", // openid to get unique id_token for storing per user in db
    ux_mode: "popup",
    callback: (res: { code: string }) => {
      setLoading(true);

      // calling googleSignIn lambda function via api gateway endpoint
      fetch(`${apiUrl}/googleSignIn`, {
        method: "POST",
        body: JSON.stringify({ code: res.code }),
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then(async (res) => {
          const data = await res.json();
          setLoading(false);

          if (res.ok) {
            const { encoded } = data;
            navigate(`/dashboard/${encoded}`);
          } else {
            console.error("Error:", data.error || data);
          }
        })
        .catch((err) => {
          setLoading(false);
          console.error("Fetch error:", err);
        });
    },
  });

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
          <h1>Welcome to Youtube Music Search</h1>
          <button id="loginButton" type="button" onClick={() => client.requestCode()}>
            Login with Google
          </button>
        </>
      )}
    </FadeContent>
  );
}

export default Login;
