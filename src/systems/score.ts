export function levelBonus(levelNumber: number): number {
  return levelNumber * 150;
}

export function computeScore(distancePx: number, levelsCleared: number, endlessMultiplier = 1): number {
  const dist = Math.max(0, distancePx);
  return Math.floor((dist / 10) * endlessMultiplier) + levelsCleared * 150;
}

export function getTotalScore(): number {
  return parseInt(localStorage.getItem('futa.totalScore') || '0', 10);
}

export function saveTotalScore(score: number) {
  localStorage.setItem('futa.totalScore', String(Math.max(0, score)));
}
