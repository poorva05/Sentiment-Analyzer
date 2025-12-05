import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const SENTIMENT_COLORS = {
  positive: { text: "limegreen", bg: "rgba(34,197,94,0.08)" },
  negative: { text: "red", bg: "rgba(239,68,68,0.08)" },
  neutral: { text: "orange", bg: "rgba(234,179,8,0.08)" },
};

export default function Page2({ API_BASE, handleLogout }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(body || `Status ${res.status}`);
      }
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("[HISTORY]", err);
      setError("Unable to load history from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // intentionally no deps to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pieData = useMemo(() => {
    const positive = history.filter((h) => h.sentiment === "positive").length;
    const negative = history.filter((h) => h.sentiment === "negative").length;
    const neutral = history.filter((h) => h.sentiment === "neutral").length;
    return [
      { name: "Positive", value: positive },
      { name: "Negative", value: negative },
      { name: "Neutral", value: neutral },
    ];
  }, [history]);

  const totalAnalyses = history.length;

  const mostCommonSentiment = useMemo(() => {
    if (!totalAnalyses) return "-";
    const counts = {
      positive: pieData[0].value,
      negative: pieData[1].value,
      neutral: pieData[2].value,
    };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [pieData, totalAnalyses]);

  const getSentimentColors = (value) =>
    SENTIMENT_COLORS[value] || { text: "yellow", bg: "rgba(250,204,21,0.08)" };

  return (
    <div className="page">
      <div className="card">
        <div className="header-row">
          <h1 className="title">Sentiment Results</h1>
          <div>
            <button
              className="analyze-btn"
              onClick={() => navigate("/")}
              style={{ marginRight: 8 }}
            >
              New Analysis
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <h2 className="subtitle">Sentiment Distribution</h2>
        <div className="stats-row">
          <span>Total analyses: {totalAnalyses}</span>
          <span>Most common: {mostCommonSentiment}</span>
        </div>

        {totalAnalyses === 0 ? (
          <p className="muted-text">No analyses yet. Try entering some text.</p>
        ) : (
          <div className="chart-wrapper">
            <PieChart width={350} height={320}>
              <Pie
                dataKey="value"
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#4ade80" />
                <Cell fill="#f87171" />
                <Cell fill="#facc15" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        )}

        <h2 className="subtitle">Previous Analyses</h2>

        {loading ? (
          <p className="muted-text">Loading history...</p>
        ) : totalAnalyses === 0 ? (
          <p className="muted-text">No history to display yet.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Text</th>
                <th>Sentiment</th>
                <th>Score</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 50).map((item) => {
                const colors = getSentimentColors(item.sentiment);
                return (
                  <tr key={item.id} style={{ backgroundColor: colors.bg }}>
                    <td>{item.id}</td>
                    <td title={item.text}>
                      {item.text && item.text.length > 60
                        ? item.text.slice(0, 60) + "..."
                        : item.text}
                    </td>
                    <td style={{ fontWeight: "bold", color: colors.text }}>
                      {item.sentiment}
                    </td>
                    <td>{item.score}</td>
                    <td>{item.created_at}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
