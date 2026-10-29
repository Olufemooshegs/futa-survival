import { describe, it, expect } from 'vitest';
import { computeScore, levelBonus } from '../src/systems/score';

describe('levelBonus', () => {
  it('is 150 per level', () => {
    expect([levelBonus(0), levelBonus(1), levelBonus(3), levelBonus(5)]).toEqual([0, 150, 450, 750]);
  });
});

describe('computeScore', () => {
  it('monotonic in distance', () =>
    expect(computeScore(2000, 0)).toBeGreaterThan(computeScore(1000, 0)));
  it('applies level bonus', () =>
    expect(computeScore(1000, 2)).toBe(100 + 300));
  it('never negative', () =>
    expect(computeScore(-500, 0)).toBe(0));
});
