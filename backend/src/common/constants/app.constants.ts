export const DEPT_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#38bdf8', // sky
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const UPLOAD_PATHS = {
  ROOT: 'uploads',
  AVATARS: 'uploads/avatars',
  LOGOS: 'uploads',
  ATTENDANCE: 'uploads/attendance',
} as const;

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
} as const;

export const DEFAULT_SETTINGS = {
  COMPANY_NAME: 'Eroxii Enterprise',
  LOGO_URL: '/logo.png',
  WORK_START: '08:00',
  WORK_END: '17:00',
  GRACE_PERIOD_MINUTES: 15,
  REQUIRE_GPS: true,
  REQUIRE_DUAL_PHOTO: true,
  PAGE_SIZE: DEFAULT_PAGE_SIZE,
} as const;
