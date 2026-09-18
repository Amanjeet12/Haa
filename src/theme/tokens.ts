export const palette = {
  brandNavy: '#08233D',
  brandRed: '#DF1F2D',
  brandRedDark: '#C91624',
  brandBlush: '#FFE5E9',
  brandBlushStrong: '#FFE2E7',
  coolGray: '#EEF2F5',
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  slate950: '#020617',
  white: '#FFFFFF',
  amber500: '#F59E0B',
  red500: '#EF4444',
} as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    thin: 'Geist-Thin',
    extraLight: 'Geist-ExtraLight',
    light: 'Geist-Light',
    regular: 'Geist-Regular',
    medium: 'Geist-Medium',
    semibold: 'Geist-SemiBold',
    bold: 'Geist-Bold',
    extraBold: 'Geist-ExtraBold',
    black: 'Geist-Black',
  },
  size: {
    caption: 12,
    body: 16,
    subtitle: 18,
    title: 24,
    display: 32,
  },
  lineHeight: {
    caption: 16,
    body: 24,
    subtitle: 26,
    title: 32,
    display: 40,
  },
} as const;
