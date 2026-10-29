import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/config/levels';

describe('LEVELS', () => {
  it('has exactly 5 levels', () => expect(LEVELS.length).toBe(5));

  it('each level has obstacles sorted by atMs', () => {
    for (const lvl of LEVELS) {
      const times = lvl.obstacles.map(o => o.atMs);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('fits within duration + 2s', () => {
    for (const lvl of LEVELS) {
      const last = Math.max(...lvl.obstacles.map(o => o.atMs));
      expect(last + 2000).toBeLessThanOrEqual(lvl.durationMs);
    }
  });

  it('consecutive gaps >= 900ms', () => {
    for (const lvl of LEVELS) {
      for (let i = 1; i < lvl.obstacles.length; i++) {
        expect(lvl.obstacles[i].atMs - lvl.obstacles[i - 1].atMs).toBeGreaterThanOrEqual(900);
      }
    }
  });

  it('each level has a signature obstacle', () => {
    for (const lvl of LEVELS) {
      expect(lvl.obstacles.filter(o => o.signature).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('labels are 1-14 chars', () => {
    for (const lvl of LEVELS) for (const o of lvl.obstacles) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.label.length).toBeLessThanOrEqual(14);
    }
  });
});
