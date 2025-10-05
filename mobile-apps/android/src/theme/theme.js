import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563eb',
    primaryContainer: '#dbeafe',
    secondary: '#64748b',
    secondaryContainer: '#f1f5f9',
    tertiary: '#7c3aed',
    tertiaryContainer: '#ede9fe',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#ffffff',
    error: '#dc2626',
    errorContainer: '#fef2f2',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onSurface: '#0f172a',
    onSurfaceVariant: '#475569',
    onBackground: '#0f172a',
    onError: '#ffffff',
    outline: '#e2e8f0',
    outlineVariant: '#cbd5e1',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#1e293b',
    inverseOnSurface: '#f1f5f9',
    inversePrimary: '#93c5fd',
    elevation: {
      level0: 'transparent',
      level1: '#f8fafc',
      level2: '#f1f5f9',
      level3: '#e2e8f0',
      level4: '#cbd5e1',
      level5: '#94a3b8',
    },
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Inter-Light',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Inter-Thin',
      fontWeight: '100',
    },
  },
  roundness: 12,
};

export const colors = {
  // Primary Colors
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  
  // Secondary Colors
  secondary: '#64748b',
  secondaryLight: '#94a3b8',
  secondaryDark: '#475569',
  
  // Accent Colors
  accent: '#7c3aed',
  accentLight: '#8b5cf6',
  accentDark: '#6d28d9',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  
  // Background Colors
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  
  // Text Colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textInverse: '#ffffff',
  
  // Border Colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
};
