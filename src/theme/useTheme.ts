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

  // Accent colors (same for both themes)
  accentBlue: string;
  accentRed: string;
  accentGreen: string;
}

const lightColors: ThemeColors = {
  // Backgrounds
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-gray-50',
  bgTertiary: 'bg-gray-100',
  bgCard: 'bg-white',
  bgInput: 'bg-gray-100',
  bgOverlay: 'bg-blackA-A3',

  // Text
  textPrimary: 'text-gray-950',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-500',
  textInverse: 'text-white',

  // Borders
  borderPrimary: 'border-blackA-A3',
  borderSecondary: 'border-gray-200',

  // Status bar
  statusBarBg: 'bg-white',
  statusBarStyle: 'dark-content',

  // Switch
  switchTrackOff: '#C9D7E3',
  switchTrackOn: '#1F93FF',
  switchThumb: '#FFFFFF',

  // Accent colors
  accentBlue: 'text-blue-800',
  accentRed: 'text-red-600',
  accentGreen: 'text-green-600',
};

const darkColors: ThemeColors = {
  // Backgrounds
  bgPrimary: 'bg-grayDark-50',
  bgSecondary: 'bg-grayDark-100',
  bgTertiary: 'bg-grayDark-200',
  bgCard: 'bg-grayDark-100',
  bgInput: 'bg-grayDark-200',
  bgOverlay: 'bg-whiteA-A3',

  // Text
  textPrimary: 'text-grayDark-950',
  textSecondary: 'text-grayDark-900',
  textTertiary: 'text-grayDark-800',
  textInverse: 'text-grayDark-50',

  // Borders
  borderPrimary: 'border-whiteA-A3',
  borderSecondary: 'border-grayDark-300',

  // Status bar
  statusBarBg: 'bg-grayDark-50',
  statusBarStyle: 'light-content',

  // Switch
  switchTrackOff: '#3A3A3C',
  switchTrackOn: '#1F93FF',
  switchThumb: '#FFFFFF',

  // Accent colors
  accentBlue: 'text-blueDark-700',
  accentRed: 'text-redDark-700',
  accentGreen: 'text-greenDark-700',
};

export interface UseThemeReturn {
  colors: ThemeColors;
  isDark: boolean;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

// Helper function to get theme colors without hooks (for use outside React components)
export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}

// Default light theme for fallback
export const defaultThemeReturn: UseThemeReturn = {
  colors: lightColors,
  isDark: false,
  theme: 'light',
  resolvedTheme: 'light',
};

export function useTheme(): UseThemeReturn {
  const systemColorScheme = useColorScheme();
  
  // Get theme from Redux with safe fallback
  let themeSetting: Theme = 'light';
  const themeFromStore = useAppSelector(selectTheme);
  if (themeFromStore && typeof themeFromStore === 'string') {
    themeSetting = themeFromStore;
  }

  // Resolve the actual theme based on setting
  const resolvedTheme: 'light' | 'dark' =
    themeSetting === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : (themeSetting === 'dark' ? 'dark' : 'light');

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    isDark,
    theme: themeSetting,
    resolvedTheme,
  };
}
