export const appConfig = {
  name: 'Haa Health',
  oneSignalAppId: '0d7b5bcd-c378-4baa-8092-5a078c02347d',
  apiTimeoutMs: 15_000,
} as const;

export const storageKeys = {
  themePreference: '@haa-health/theme-preference',
  authSession: '@haa-health/auth-session',
  selectedZoneId: '@haa-health/selected-zone-id',
} as const;
