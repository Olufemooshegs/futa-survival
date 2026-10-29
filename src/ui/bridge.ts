import type Phaser from 'phaser';
import { renderRows } from './Leaderboard';

let leaderboardHandle: { close(): void } | null = null;
let canRetry = false;
const $ = (id: string) => document.getElementById(id)!;
const show = (id: string, v: boolean) => $(id).setAttribute('data-visible', String(v));

export function setConnectionMode(mode: 'live' | 'polling' | 'connecting') {
  const label = $('conn-label');
  if (label) label.textContent = mode === 'live' ? 'Live leaderboard' : 'Connecting…';
}

function updateBoard(rows: any[], you?: { name: string; score: number }) {
  renderRows($('board-list'), rows, you);
}

export function mountUI(game: Phaser.Game) {
  const startGame = () => {
    const nameInput = $('player-name') as HTMLInputElement;
    const deptInput = $('player-dept') as HTMLInputElement;
    const name = (nameInput.value.toUpperCase().trim().slice(0, 12)) || 'STUDENT';
    const dept = (deptInput.value.toUpperCase().trim().slice(0, 4)) || 'FUTA';
    
    localStorage.setItem('futa.name', name);
    localStorage.setItem('futa.dept', dept);
    
    show('menu-screen', false);
    show('gameover-screen', false);
    show('pause-screen', false);
    (document.activeElement as HTMLElement)?.blur(); 

    game.scene.start('GameScene', { name, dept });
  };

  $('btn-start').addEventListener('click', startGame);

  $('btn-retry').addEventListener('click', () => {
    if (!canRetry) return;
    leaderboardHandle?.close(); leaderboardHandle = null;
    startGame();
  });

  $('btn-menu').addEventListener('click', () => {
    if (!canRetry) return;
    leaderboardHandle?.close(); leaderboardHandle = null;
    show('gameover-screen', false);
    show('menu-screen', true);
    game.scene.stop('GameScene');
  });

  $('btn-quit').addEventListener('click', () => {
    show('pause-screen', false);
    show('gameover-screen', false);
    show('menu-screen', true);
    game.scene.stop('GameScene');
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      if ($('menu-screen').getAttribute('data-visible') === 'true') {
        e.preventDefault(); startGame();
      } 
      else if ($('gameover-screen').getAttribute('data-visible') === 'true' && canRetry) {
        e.preventDefault(); $('btn-retry').click();
      }
    }

    // ESC Pause Logic
    if (e.code === 'Escape') {
      const isMenu = $('menu-screen').getAttribute('data-visible') === 'true';
      const isGameOver = $('gameover-screen').getAttribute('data-visible') === 'true';
      const isPaused = $('pause-screen').getAttribute('data-visible') === 'true';

      if (!isMenu && !isGameOver) {
        if (isPaused) {
          show('pause-screen', false);
          game.scene.resume('GameScene');
        } else {
          show('pause-screen', true);
          game.scene.pause('GameScene');
        }
      }
    }
  });

  window.addEventListener('futa:gameover', (e: any) => {
    if ($('menu-screen').getAttribute('data-visible') === 'true') return; 

    const d = e.detail as { graduated: boolean; level: number; levelTag: string; score: number; name: string; dept: string; };

    $('gameover-screen').setAttribute('data-win', String(d.graduated));
    $('result-eyebrow').textContent = d.graduated ? 'RUN COMPLETE' : 'RUN ENDED';
    $('result-title').textContent = d.graduated ? 'GRADUATED!' : 'EXAM FAILED';
    $('stat-level').textContent = d.levelTag;
    $('stat-score').textContent = String(d.score); 
    show('gameover-screen', true);

    canRetry = false;
    setTimeout(() => { canRetry = true; }, 1000);

    import('../systems/api').then(({ submitScore }) => {
      submitScore({ name: d.name, dept: d.dept, level: d.level, score: d.score, graduated: d.graduated })
        .then(res => { if (res.top?.length) updateBoard(res.top, { name: d.name, score: d.score }); })
        .catch(() => {});
    });

    import('../realtime/leaderboard').then(({ startLeaderboard }) => {
      leaderboardHandle = startLeaderboard({
        realtimeEndpoint: import.meta.env.VITE_EVENTS_ENDPOINT,
        apiKey: import.meta.env.VITE_EVENTS_API_KEY,
        channel: import.meta.env.VITE_EVENTS_CHANNEL,
        onRows: rows => updateBoard(rows, { name: d.name, score: d.score }),
      });
    });
  });
}