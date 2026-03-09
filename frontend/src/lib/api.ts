const API_URL = 'http://localhost:3001';
export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch { return []; }
}
export async function submitScore(name: string, score: number, level: number) {
  try {
    const res = await fetch(`${API_URL}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, level }),
    });
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch { return null; }
}
