import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = join(__dirname, '../data/leaderboard.json');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(join(__dirname, '../data'), { recursive: true });

app.use(cors());
app.use(express.json());

// Load leaderboard from file
function loadLeaderboard() {
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// Save leaderboard to file
function saveLeaderboard(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /leaderboard - get top 10 scores
app.get('/leaderboard', (req, res) => {
  const board = loadLeaderboard();
  const top10 = board.sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(top10);
});

// POST /leaderboard - submit a score
app.post('/leaderboard', (req, res) => {
  const { name, score, level } = req.body;

  if (!name || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid score data' });
  }

  const sanitizedName = String(name).slice(0, 20).replace(/[<>]/g, '');
  const board = loadLeaderboard();

  const entry = {
    id: Date.now(),
    name: sanitizedName,
    score: Math.floor(score),
    level: level || 1,
    date: new Date().toISOString()
  };

  board.push(entry);
  board.sort((a, b) => b.score - a.score);

  // Keep only top 100
  const trimmed = board.slice(0, 100);
  saveLeaderboard(trimmed);

  const rank = trimmed.findIndex(e => e.id === entry.id) + 1;
  res.json({ ...entry, rank });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🐍 Snake backend running on http://localhost:${PORT}`);
});
