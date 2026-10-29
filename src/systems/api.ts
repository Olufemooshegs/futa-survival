export interface ScoreRow { name: string; department: string; level: number; score: number; ts: number }
export interface SubmitResult { ok: boolean; rank?: number; top: ScoreRow[] }

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export async function submitScore(p: {
  name: string; dept: string; level: number; score: number; graduated: boolean;
}): Promise<SubmitResult> {
  if (!API) return { ok: false, top: [] };
  try {
    const r = await fetch(`${API}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    if (!r.ok) return { ok: false, top: [] };
    const data = await r.json();
    return { ok: true, rank: data.rank, top: data.top ?? [] };
  } catch {
    return { ok: false, top: [] };
  }
}

export async function fetchTop(limit = 5): Promise<ScoreRow[]> {
  if (!API) return [];
  try {
    const r = await fetch(`${API}/leaderboard?limit=${limit}`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.top ?? [];
  } catch {
    return [];
  }
}
