import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Page1(props) {
  const {
    API_BASE,
    isAuthenticated,
    handleAuthSubmit,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authError,
    setAuthError,
    handleLogout,
  } = props;

  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputError, setInputError] = useState("");
  const [serverError, setServerError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const analyze = async () => {
    setInputError("");
    setServerError("");

    if (!text.trim()) {
      setInputError("Please enter some text to analyze.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await fetch(`${API_BASE}/api/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        setServerError(data?.message || `Server returned ${res.status}`);
        return;
      }

      // backend persists to DB; show returned sentiment/score on this page
      if (data) {
        setLastResult({ sentiment: data.sentiment, score: data.score, id: data.id });
      }
    } catch (err) {
      console.error("[ANALYZE] error:", err);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render auth UI when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="card auth-card">
          <h1 className="title">{authMode === "login" ? "Login" : "Sign Up"}</h1>

          <input
            type="text"
            className="auth-input"
            placeholder="Username"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
          />

          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
          />

          {authError && <p className="error-text">{authError}</p>}

          <button className="auth-btn" onClick={handleAuthSubmit}>
            {authMode === "login" ? "Login" : "Sign Up"}
          </button>

          <p className="switch-text">
            {authMode === "login" ? (
              <>
                Don&apos;t have an account? {" "}
                <span
                  className="switch-link"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError("");
                  }}
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account? {" "}
                <span
                  className="switch-link"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                >
                  Login
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Authenticated UI: input and analyze
  return (
    <div className="page">
      <div className="card">
        <div className="header-row">
          <h1 className="title">Sentiment Analyzer</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <textarea
          className="text-input"
          placeholder="Type a sentence or paragraph and click Analyze..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {inputError && <p className="error-text">{inputError}</p>}
        {serverError && <p className="error-text">{serverError}</p>}

        <button
          className="analyze-btn"
          onClick={analyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>

        {lastResult && (
          <div className="result-box" style={{ marginTop: 16 }}>
            <p>
              <strong>Sentiment:</strong>{" "}
              <span
                className="sentiment-badge"
                style={{
                  color:
                    lastResult.sentiment === "positive"
                      ? "limegreen"
                      : lastResult.sentiment === "negative"
                      ? "red"
                      : "orange",
                }}
              >
                {lastResult.sentiment}
              </span>
            </p>
            <p>
              <strong>Score:</strong> {typeof lastResult.score === "number" ? lastResult.score : "-"}
            </p>
            <div style={{ marginTop: 8 }}>
              <button className="analyze-btn" onClick={() => navigate("/results")}>View History</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
