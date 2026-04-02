import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * Standard View component that automatically responds to theme changes.
 */
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Always fetch background color from our theme constants
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
