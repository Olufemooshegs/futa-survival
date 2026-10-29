import { Client, apiKeyAuthorizer } from 'aws-appsync-events';
import { fetchTop, type ScoreRow } from '../systems/api';

export interface LeaderboardHandle { close(): void }

export function startLeaderboard(opts: {
  realtimeEndpoint?: string;
  apiKey?: string;
  channel?: string;
  onRows: (rows: ScoreRow[]) => void;
}): LeaderboardHandle {
  let rows: ScoreRow[] = [];
  let sub: any;
  let closed = false;

  const updateRows = (newRows: ScoreRow[]) => {
    rows = newRows;
    if (!closed) opts.onRows(rows);
  };

  (async () => {
    const seed = await fetchTop(20); // Fetch Top 20
    if (seed.length) updateRows(seed);
    if (closed) return;

    if (!opts.realtimeEndpoint || !opts.apiKey || !opts.channel) return;

    try {
      const client = new Client(opts.realtimeEndpoint, apiKeyAuthorizer(opts.apiKey));
      sub = client.subscribe(opts.channel, {
        established: () => console.log('Live leaderboard connected'),
        event: (e: any) => {
          const payload = typeof e === 'string' ? JSON.parse(e) : e;
          if (payload?.type === 'LEADERBOARD_UPDATE') {
            updateRows(payload.top);
          }
        },
        error: (err: any) => console.error('Leaderboard sub error', err)
      });
    } catch (err) {
      console.error('Failed to connect to AppSync Events', err);
    }
  })();

  return {
    close() {
      closed = true;
      try { sub?.unsubscribe(); } catch {}
    },
  };
}
