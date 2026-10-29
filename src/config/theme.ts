export const VIEW = { w: 1024, h: 576 } as const;
export const GROUND_Y = 480;
export const PLAYER_X = 180;
export const PLAYER_STAND = { w: 32, h: 48 } as const;
export const PLAYER_SLIDE  = { w: 40, h: 24 } as const;
export const JUMP_VELOCITY = -700;
export const GRAVITY = 1800;
export const SLIDE_MIN_MS = 500;
export const HANGING_BOTTOM_Y = 440;
export const DESPAWN_X = -200;

export const COLORS = {
  bgDeep:  0x0E3B2E,
  bgGround:0x061F18,
  accent:  0xF2C14E,
  paper:   0xF5F1E8,
  danger:  0xC0392B,
} as const;
