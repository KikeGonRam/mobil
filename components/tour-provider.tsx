import { useMemo, type PropsWithChildren } from 'react';
import { CopilotProvider } from 'react-native-copilot';
import { Platform } from 'react-native';
import { useThemeMode } from '@/contexts/theme-context';
import { getBrand } from '@/constants/theme';

/**
 * TourProvider envuelve la aplicación y configura react-native-copilot
 * con tema gold (#d4af37) y animaciones compatibles con reanimated 4.x
 */
export function TourProvider({ children }: PropsWithChildren) {
  const { resolvedMode } = useThemeMode();
  const brand = getBrand(resolvedMode);

  const copilotConfig = useMemo(
    () => ({
      overlay: 'svg' as const,
      androidStatusBarVisible: Platform.OS === 'android',
      stopOnOutsideClick: false,
      verticalOffset: 0,
      labels: {
        previous: '← Anterior',
        next: 'Siguiente →',
        skip: 'Omitir',
        finish: '¡Comenzar!',
      },
      arrowColor: brand.gold,
      backgroundColor: resolvedMode === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(250, 250, 250, 0.8)',
      shadowColor: brand.gold,
      borderRadius: 12,
      maskColor: resolvedMode === 'dark' ? 'rgba(10, 10, 10, 0.4)' : 'rgba(250, 250, 250, 0.4)',
    }),
    [brand, resolvedMode]
  );

  return (
    <CopilotProvider {...copilotConfig} tooltipMarginOffset={16}>
      {children}
    </CopilotProvider>
  );
}
