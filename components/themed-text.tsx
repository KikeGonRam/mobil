import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

/**
 * Standard Text component that automatically responds to theme changes.
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  // Always fetch text color from our theme constants
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#d4af37', // Gold for links
  },
});
