import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

export interface ResponsiveConfig {
  isSmallPhone: boolean;
  isPhone: boolean;
  isPhoneLarge: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  wp: (percent: number) => number;
  hp: (percent: number) => number;
  fontScale: (baseSize: number) => number;
  spacing: (baseSpacing: number) => number;
}

/**
 * Hook de responsividad para detectar tamaño de pantalla y proporcionar
 * valores escalados para ancho, alto, fuente y espaciado
 *
 * Breakpoints:
 * - phone_small: < 375px
 * - phone: < 414px
 * - phone_large: < 428px
 * - tablet: >= 600px
 */
export function useResponsive(): ResponsiveConfig {
  const { width, height, fontScale: systemFontScale } = useWindowDimensions();
  const [systemFontScaleAccess, setSystemFontScaleAccess] = useState<number>(1);

  useEffect(() => {
    // Intentar obtener el nivel de accesibilidad del sistema
    AccessibilityInfo.boldText?.()
      .then((isBold) => {
        if (isBold) {
          setSystemFontScaleAccess(1.3);
        }
      })
      .catch(() => {
        // Fallback a 1 si no se puede acceder
        setSystemFontScaleAccess(1);
      });
  }, []);

  const isSmallPhone = width < 375;
  const isPhone = width < 414;
  const isPhoneLarge = width < 428;
  const isTablet = width >= 600;

  // Porcentaje del ancho de pantalla
  const wp = (percent: number): number => {
    return (width * percent) / 100;
  };

  // Porcentaje del alto de pantalla
  const hp = (percent: number): number => {
    return (height * percent) / 100;
  };

  // Escalado de fuente respetando accesibilidad del sistema
  const fontScale = (baseSize: number): number => {
    const scaleMultiplier = systemFontScale * systemFontScaleAccess;
    // Aplicar variaciones según tamaño de pantalla
    const screenMultiplier = (() => {
      if (isSmallPhone) return 0.9;
      if (isTablet) return 1.05;
      return 1;
    })();

    return baseSize * scaleMultiplier * screenMultiplier;
  };

  // Espaciado escalado (reducir 15% en pantallas pequeñas)
  const spacing = (baseSpacing: number): number => {
    if (isSmallPhone) {
      return baseSpacing * 0.85;
    }
    return baseSpacing;
  };

  return {
    isSmallPhone,
    isPhone,
    isPhoneLarge,
    isTablet,
    screenWidth: width,
    screenHeight: height,
    wp,
    hp,
    fontScale,
    spacing,
  };
}
