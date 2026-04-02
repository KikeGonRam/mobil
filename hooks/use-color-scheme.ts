import { useThemeMode } from '@/contexts/theme-context';

/**
 * Custom hook to access the current theme (resolved between system and user preference).
 * This overrides the default React Native useColorScheme to listen to our ThemeContext.
 */
export function useColorScheme() {
  const { resolvedMode } = useThemeMode();
  return resolvedMode;
}
