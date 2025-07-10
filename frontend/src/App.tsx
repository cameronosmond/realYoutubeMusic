import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";
import Songs from "./pages/Songs";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dashboard:userId" element={<Dashboard />} />
        <Route path="/songs:artist" element={<Songs />} />
      </Routes>
    </Router>
  );
}

export default App;
