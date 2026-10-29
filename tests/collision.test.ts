import { describe, it, expect } from 'vitest';
import { overlaps, playerRect } from '../src/systems/collision';

describe('overlaps', () => {
  it('identical rects overlap', () =>
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(true));
  it('edge-touching do not', () =>
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false));
  it('far apart do not', () =>
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 100, y: 100, w: 10, h: 10 })).toBe(false));
});

describe('playerRect', () => {
  it('standing 32x48', () => {
    const r = playerRect(180, 480, false, 0);
    expect([r.w, r.h, r.y + r.h]).toEqual([32, 48, 480]);
  });
  it('sliding 40x24', () => {
    const r = playerRect(180, 480, true, 0);
    expect([r.w, r.h, r.y + r.h]).toEqual([40, 24, 480]);
  });
  it('jump offset shifts up', () => {
    const r = playerRect(180, 480, false, 100);
    expect(r.y + r.h).toBe(380);
  });
  it('sliding clears hanging obstacle that standing hits', () => {
    const h = { x: 500, y: 380, w: 60, h: 60 };
    expect(overlaps(playerRect(500, 480, false, 0), h)).toBe(true);
    expect(overlaps(playerRect(500, 480, true, 0), h)).toBe(false);
  });
});
