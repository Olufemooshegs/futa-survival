import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

const ddb = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME!;
const GAME = 'futa';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.floor(Number(n) || 0)));
const json = (statusCode: number, body: any) => ({
  statusCode,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function getTop() {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'gameId = :g',
    ExpressionAttributeValues: marshall({ ':g': GAME }),
    ScanIndexForward: true,
    Limit: 20,
  }));
  return (res.Items ?? []).map(i => {
    const r = unmarshall(i);
    return { name: r.name, department: r.department, matricNo: r.matricNo, level: r.level, score: r.score, runs: r.runs, ts: r.ts };
  });
}

export const handler = async (event: any) => {
  try {
    const method = event.requestContext?.http?.method ?? 'POST';
    const path = event.rawPath ?? '/score';

    if (method === 'OPTIONS') return json(204, {});
    if (method === 'GET' && path.includes('leaderboard')) return json(200, { top: await getTop() });

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body ?? {});
    
    // In the new system, body.score is the score of the SINGLE RUN, not the total
    const runScore = clamp(body.score, 0, 9999999); 
    const level = clamp(body.level, 1, 6);
    const name = String(body.name || 'STUDENT').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 12) || 'STUDENT';
    const department = String(body.dept || 'FUTA').toUpperCase().replace(/[^A-Z]/g, '').trim().slice(0, 4) || 'FUTA';
    const matricNo = String(body.matricNo || '0000').toUpperCase().replace(/[^A-Z0-9]/g, '').trim().slice(0, 4) || '0000';

    // 1. Find if this matric number already has a record
    const scan = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const existing = scan.Items?.find((i: any) => i.matricNo?.S === matricNo);

    let totalScore = runScore;
    let runs = 1;

    if (existing) {
      totalScore += (Number(existing.totalScore?.N) || 0);
      runs += (Number(existing.runs?.N) || 0);

      // Delete the old record so we can update the sort key with the new average
      await ddb.send(new DeleteItemCommand({
        TableName: TABLE,
        Key: { gameId: existing.gameId, scoreKey: existing.scoreKey }
      }));
    }

    // 2. Calculate the average
    const averageScore = Math.floor(totalScore / runs);
    const scoreKey = `${String(9999999 - averageScore).padStart(7, '0')}#${randomUUID()}`;

    // 3. Insert the new updated record
    await ddb.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall({ 
        gameId: GAME, 
        scoreKey, 
        name, 
        department, 
        matricNo, 
        level, 
        score: averageScore, // The leaderboard sorts by this
        totalScore,          // For reference
        runs,                // For reference
        ts: Date.now() 
      }),
    }));

    const top = await getTop();

    if (process.env.EVENTS_HTTP_ENDPOINT && process.env.EVENTS_API_KEY) {
      try {
        await fetch(`${process.env.EVENTS_HTTP_ENDPOINT}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EVENTS_API_KEY },
          body: JSON.stringify({
            channel: process.env.EVENTS_CHANNEL,
            events: [JSON.stringify({ type: 'LEADERBOARD_UPDATE', top })],
          }),
        });
      } catch (e) { console.warn('event publish failed', e); }
    }

    return json(200, { ok: true, top });
  } catch (e: any) {
    return json(500, { ok: false, error: String(e?.message ?? e) });
  }
};
