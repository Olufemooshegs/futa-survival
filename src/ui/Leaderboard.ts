export interface LeaderboardRow { 
  name: string; 
  department: string; 
  matricNo: string; 
  level: number; 
  score: number; 
  ts: number 
}

export function renderRows(
  container: HTMLElement,
  rows: LeaderboardRow[],
  you?: { name: string; score: number }
) {
  container.innerHTML = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'row';
    li.innerHTML = '<span></span><span>No runs yet</span><span></span><span></span>';
    container.appendChild(li);
    return;
  }
  rows.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'row row--enter';
    if (you && r.name === you.name && r.score === you.score) li.classList.add('row--you');
    
    li.innerHTML = `
      <span class="row__rank">${i + 1}</span>
      <span class="row__name">${r.name} <span style="color:var(--muted);font-size:0.8em">(${r.department || 'FUTA'} #${r.matricNo || '0000'})</span></span>
      <span class="row__level">${r.level}00L</span>
      <span class="row__score">${r.score}</span>
    `;
    container.appendChild(li);
  });
}
