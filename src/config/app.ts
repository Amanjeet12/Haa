export const appConfig = {
  name: 'Haa Health',
  apiTimeoutMs: 15_000,
} as const;

export const storageKeys = {
  themePreference: '@haa-health/theme-preference',
  authSession: '@haa-health/auth-session',
} as const;
