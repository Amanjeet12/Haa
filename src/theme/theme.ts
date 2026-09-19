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
  border2: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export const screenGradientLocations = [0, 0.16, 0.32, 0.5, 0.68, 0.84, 1];

export function screenGradientColors(
  theme: AppTheme,
): [string, string, string, string, string, string, string] {
  if (theme.isDark) {
    return [
      theme.colors.background,
      theme.colors.background,
      theme.colors.background,
      theme.colors.background,
      theme.colors.background,
      theme.colors.background,
      theme.colors.background,
    ];
  }
  return [
    theme.colors.gradientStart,
    '#FDF1F2',
    '#FDF3F3',
    '#FBF8F6',
    '#F5F5F4',
    '#F1F3F3',
    theme.colors.gradientEnd,
  ];
}

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
    border2: palette.slate300,
  },
  spacing,
  radius,
  typography,
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  isDark: true,
  colors: {
    background: '#0E111A',
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
    gradientStart: '#281A20',
    gradientEnd: '#0E111A',
    border2: '#1C1F2A',
  },
};
