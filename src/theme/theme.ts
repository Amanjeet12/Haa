import { palette, radius, spacing, typography } from './tokens';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  onPrimary: string;
  shadow: string;
  gradientStart: string;
  gradientEnd: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: palette.slate50,
    surface: palette.white,
    surfaceMuted: palette.slate100,
    primary: palette.brandRed,
    primaryPressed: palette.brandRedDark,
    primarySoft: palette.brandBlush,
    text: palette.brandNavy,
    textMuted: palette.slate500,
    border: palette.slate200,
    success: palette.emerald500,
    warning: palette.amber500,
    danger: palette.red500,
    onPrimary: palette.white,
    shadow: palette.slate900,
    gradientStart: palette.brandBlush,
    gradientEnd: palette.coolGray,
  },
  spacing,
  radius,
  typography,
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  isDark: true,
  colors: {
    background: palette.slate950,
    surface: palette.slate900,
    surfaceMuted: '#172033',
    primary: '#FF5261',
    primaryPressed: palette.brandRed,
    primarySoft: '#3C1720',
    text: palette.slate50,
    textMuted: palette.slate400,
    border: palette.slate700,
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    onPrimary: palette.slate950,
    shadow: '#000000',
    gradientStart: '#24141B',
    gradientEnd: palette.slate950,
  },
};
