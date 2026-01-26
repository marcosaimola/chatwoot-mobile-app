import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, StatusBarStyle } from 'react-native';
import { useAppSelector } from '@/hooks';
import { selectTheme } from '@/store/settings/settingsSelectors';
import { Theme } from '@/types/common/Theme';

interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgInput: string;
  bgOverlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Borders
  borderPrimary: string;
  borderSecondary: string;

  // Status bar
  statusBarBg: string;
  statusBarStyle: StatusBarStyle;

  // Switch
  switchTrackOff: string;
  switchTrackOn: string;
  switchThumb: string;

  // Accent colors
  accentBlue: string;
  accentRed: string;
  accentGreen: string;
}

const lightColors: ThemeColors = {
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-gray-50',
  bgTertiary: 'bg-gray-100',
  bgCard: 'bg-white',
  bgInput: 'bg-gray-100',
  bgOverlay: 'bg-blackA-A3',
  textPrimary: 'text-gray-950',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-500',
  textInverse: 'text-white',
  borderPrimary: 'border-blackA-A3',
  borderSecondary: 'border-gray-200',
  statusBarBg: 'bg-white',
  statusBarStyle: 'dark-content',
  switchTrackOff: '#C9D7E3',
  switchTrackOn: '#1F93FF',
  switchThumb: '#FFFFFF',
  accentBlue: 'text-blue-800',
  accentRed: 'text-red-600',
  accentGreen: 'text-green-600',
};

const darkColors: ThemeColors = {
  bgPrimary: 'bg-grayDark-50',
  bgSecondary: 'bg-grayDark-100',
  bgTertiary: 'bg-grayDark-200',
  bgCard: 'bg-grayDark-100',
  bgInput: 'bg-grayDark-200',
  bgOverlay: 'bg-whiteA-A3',
  textPrimary: 'text-grayDark-900',
  textSecondary: 'text-grayDark-800',
  textTertiary: 'text-grayDark-700',
  textInverse: 'text-grayDark-50',
  borderPrimary: 'border-grayDark-300',
  borderSecondary: 'border-grayDark-400',
  statusBarBg: 'bg-grayDark-50',
  statusBarStyle: 'light-content',
  switchTrackOff: '#3A3A3C',
  switchTrackOn: '#1F93FF',
  switchThumb: '#FFFFFF',
  accentBlue: 'text-blueDark-700',
  accentRed: 'text-redDark-700',
  accentGreen: 'text-greenDark-700',
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

const defaultValue: ThemeContextValue = {
  colors: lightColors,
  isDark: false,
  theme: 'light',
  resolvedTheme: 'light',
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const themeSetting = useAppSelector(selectTheme) ?? 'light';

  const value = useMemo(() => {
    const resolvedTheme: 'light' | 'dark' =
      themeSetting === 'system'
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : themeSetting;

    const isDark = resolvedTheme === 'dark';
    const colors = isDark ? darkColors : lightColors;

    return {
      colors,
      isDark,
      theme: themeSetting,
      resolvedTheme,
    };
  }, [themeSetting, systemColorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);

export { lightColors, darkColors };
export type { ThemeColors, ThemeContextValue };
