import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";

const API_BASE = "http://localhost:5000";

export default function App() {
  // top-level auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // restore session if present
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setIsAuthenticated(true);
  }, []);

  // handlers (copied behavior from previous implementation)
  const handleAuthSubmit = async () => {
    setAuthError("");

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Username and password are required.");
      return;
    }

    const endpoint = authMode === "login" ? "/api/login" : "/api/signup";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        setAuthError(data?.message || `Authentication failed (${res.status})`);
        return;
      }

      localStorage.setItem("currentUser", authUsername);
      setIsAuthenticated(true);
      setAuthPassword("");
      setAuthError("");
    } catch (err) {
      console.error("[AUTH] network error:", err);
      setAuthError("Server error. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setAuthUsername("");
    setAuthPassword("");
    setAuthError("");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Page1
              API_BASE={API_BASE}
              isAuthenticated={isAuthenticated}
              handleAuthSubmit={handleAuthSubmit}
              authMode={authMode}
              setAuthMode={setAuthMode}
              authUsername={authUsername}
              setAuthUsername={setAuthUsername}
              authPassword={authPassword}
              setAuthPassword={setAuthPassword}
              authError={authError}
              setAuthError={setAuthError}
              handleLogout={handleLogout}
            />
          }
        />

        <Route
          path="/results"
          element={
            isAuthenticated ? (
              <Page2 API_BASE={API_BASE} handleLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
