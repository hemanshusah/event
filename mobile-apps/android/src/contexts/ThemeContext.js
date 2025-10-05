import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, colors } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const currentTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      ...(isDarkMode ? {
        primary: colors.primaryLight,
        surface: colors.gray900,
        background: colors.gray900,
        onSurface: colors.gray100,
        onBackground: colors.gray100,
        textPrimary: colors.gray100,
        textSecondary: colors.gray300,
        textTertiary: colors.gray400,
        border: colors.gray700,
        borderLight: colors.gray800,
        borderDark: colors.gray600,
      } : {
        primary: colors.primary,
        surface: colors.white,
        background: colors.white,
        onSurface: colors.gray900,
        onBackground: colors.gray900,
        textPrimary: colors.gray900,
        textSecondary: colors.gray600,
        textTertiary: colors.gray500,
        border: colors.gray200,
        borderLight: colors.gray100,
        borderDark: colors.gray300,
      }),
    },
  };

  const value = {
    isDarkMode,
    theme: currentTheme,
    colors: currentTheme.colors,
    toggleTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
