export interface Rect { x: number; y: number; w: number; h: number }

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function playerRect(x: number, groundY: number, sliding: boolean, yOffset: number): Rect {
  const w = sliding ? 40 : 32;
  const h = sliding ? 24 : 48;
  return { x, y: groundY - yOffset - h, w, h };
}
