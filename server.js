// server.js
const express = require("express");
const cors = require("cors");
const db = require("./db"); // this is your db.js that uses data.db

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ---------------- SENTIMENT ANALYSIS (using 'sentiment' package) ----------------
// Use the `sentiment` library for a more complete scoring of words like "amazing".
const Sentiment = require("sentiment");
const sentimentAnalyzer = new Sentiment();

// Extra lexicon to improve detection of common words not covered or to adjust weights.
// This helps ensure words like "amazing" or "fantastic" are scored as positive.
const lexiconExtras = {
  amazing: 3,
  awesome: 3,
  fantastic: 2,
  wonderful: 2,
  great: 2,
  excellent: 2,
  love: 2,
  happy: 1,
  good: 1,
  bad: -1,
  terrible: -2,
  awful: -2,
  hate: -2,
  worst: -2,
  sad: -1,
  angry: -1,
};

function analyzeTextSentiment(text) {
  const result = sentimentAnalyzer.analyze(text || "", { extras: lexiconExtras });
  const score = result.score || 0;
  let sentiment = "neutral";
  if (score > 0) sentiment = "positive";
  else if (score < 0) sentiment = "negative";

  // Log the analysis details for debugging (shows matched words and score)
  console.log("[SENTIMENT_ANALYSIS]", { text, score, words: result.words, positive: result.positive, negative: result.negative });

  return { sentiment, score };
}

// ---------------- AUTH ROUTES (SQLite in data.db) ----------------

// SIGNUP: create user OR update password if username already exists
app.post("/api/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.run(insertSql, [username, password], function (err) {
    // First time signup: insert OK
    if (!err) {
      return res.json({ message: "Signup successful", userId: this.lastID });
    }

    // If username already exists, update password instead of failing
    if (err.message && err.message.includes("UNIQUE")) {
      const updateSql = "UPDATE users SET password = ? WHERE username = ?";
      db.run(updateSql, [password, username], function (updateErr) {
        if (updateErr) {
          console.error("Password update error:", updateErr);
          return res
            .status(500)
            .json({ message: "Could not update existing user" });
        }

        return res.json({
          message:
            "User already existed. Password updated successfully. You can now login.",
        });
      });
    } else {
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
});

// LOGIN: check username + password
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.get(sql, [username, password], (err, row) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!row) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // success
    return res.json({ message: "Login successful", username: row.username });
  });
});

// ---------------- SENTIMENT ROUTES ----------------

// Analyze and save one text
app.post("/api/sentiment", (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Text is required" });
  }

  const { sentiment, score } = analyzeTextSentiment(text);

  const sql =
    "INSERT INTO analysis (text, sentiment, score) VALUES (?, ?, ?)";
  db.run(sql, [text, sentiment, score], function (err) {
    if (err) {
      console.error("Insert analysis error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json({ id: this.lastID, sentiment, score });
  });
});

// Get history
app.get("/api/history", (req, res) => {
  const sql = `
    SELECT id, text, sentiment, score, created_at
    FROM analysis
    ORDER BY created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Fetch history error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(rows);
  });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
