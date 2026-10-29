let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function beep(freq: number, durMs: number, type: OscillatorType = 'square') {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + durMs / 1000);
  } catch {}
}

export function playJump()  { beep(220, 60, 'square'); }
export function playHit()   { beep(110, 200, 'sawtooth'); }
export function playClear() {
  beep(440, 80, 'square');
  setTimeout(() => beep(660, 80, 'square'), 90);
}
export function playCoin() {
  beep(880, 40, 'sine');
  setTimeout(() => beep(1200, 60, 'sine'), 40);
}