import { useNavigate } from "react-router-dom";
import FadeContent from "../components/FadeContent";
import Lanyard from "../components/Landyard";

function Login() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();

  const client = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    ux_mode: "popup",
    callback: (res: { code: string }) => {
      // Sending code to backend Lambda
      /*fetch("/api/exchange-code", {
        method: "POST",
        body: JSON.stringify({ code: res.code }),
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }).then(() => navigate("/dashboard"));*/
    },
  });

  return (
    <FadeContent
      blur={true}
      duration={1000}
      easing="ease-out"
      initialOpacity={0}>
      <h1>Welcome to Youtube Music Playlist Manager</h1>
      <Lanyard
        position={[0, 0, 20]}
        gravity={[0, -40, 0]}
        onClick={() => client.requestCode()}
      />
    </FadeContent>
  );
}

export default Login;
