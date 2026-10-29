export interface ObstacleDef {
  label: string; width: number; height: number; signature?: boolean;
}

export interface LevelConfig {
  tag: string; title: string; minScore: number; speed: number; penalty: number;
  bgColor: number; groundColor: number; pool: ObstacleDef[];
}

export const LEVELS: LevelConfig[] = [
  {
    tag: '100L', title: 'Freshers', minScore: 0, speed: 340, penalty: 400,
    bgColor: 0x0E3B2E, groundColor: 0x061F18,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'MEE101', width: 32, height: 56, signature: true }
    ]
  },
  {
    tag: '200L', title: 'Senior Freshers', minScore: 500, speed: 420, penalty: 500,
    bgColor: 0x1A2A40, groundColor: 0x0D1420,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'MEE101', width: 32, height: 56, signature: true },
      { label: 'CSP210', width: 36, height: 48, signature: true }
    ]
  },
  {
    tag: '300L', title: 'Staylites', minScore: 1500, speed: 520, penalty: 600,
    bgColor: 0x2D1B36, groundColor: 0x140C19,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'ENT', width: 60, height: 60, signature: true },
      { label: 'CARRYOVER', width: 70, height: 30, signature: true }
    ]
  },
  {
    tag: '400L', title: 'IT Brethren', minScore: 3000, speed: 780, penalty: 700, // BUFFED SPEED
    bgColor: 0x3D1C1C, groundColor: 0x1F0E0E,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'IT', width: 140, height: 60, signature: true },
      { label: 'CARRYOVER', width: 70, height: 30, signature: true }
    ]
  },
  {
    tag: '500L', title: 'FYB', minScore: 5000, speed: 1000, penalty: 800, // BUFFED SPEED
    bgColor: 0x0A0A0A, groundColor: 0x000000,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'PROJECT', width: 40, height: 56, signature: true },
      { label: 'CORRECTION', width: 70, height: 60, signature: true }
    ]
  },
  {
    tag: 'ALUMNI', title: 'Endless', minScore: 9999999, speed: 1400, penalty: 1000, // BUFFED ENDLESS
    bgColor: 0x000000, groundColor: 0x000000,
    pool: [
      { label: 'EXAM', width: 28, height: 36 },
      { label: 'PROJECT', width: 40, height: 56, signature: true },
      { label: 'CORRECTION', width: 70, height: 60, signature: true }
    ]
  }
];
