import { useEffect } from "react";
import FadeContent from "../components/FadeContent";

function Login() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function handleCredentialResponse(response: { credential: string }) {
    console.log("Google ID token:", response.credential);
    // Send to backend here
  }

  useEffect(() => {
    console.log(clientId);
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button")!,
        {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          width: 300,
        }
      );
    }
  }, []);
  return (
    <FadeContent
      blur={true}
      duration={1000}
      easing="ease-out"
      initialOpacity={0}>
      <h1>Welcome to Youtube Music Playlist Manager</h1>
      <div
        id="google-login-button"
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      />
    </FadeContent>
  );
}

export default Login;
