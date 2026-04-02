import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppShell } from '@/components/app-shell';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeModeProvider, useThemeMode } from '@/contexts/theme-context';
import { Brand, Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: 'landing',
};

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <ThemedRoot />
      </AuthProvider>
    </ThemeModeProvider>
  );
}

function ThemedRoot() {
  const { resolvedMode } = useThemeMode();

  const barbershopTheme: Theme = {
    dark: resolvedMode === 'dark',
    colors: {
      primary: Brand.gold,
      background: Colors[resolvedMode].background,
      card: Colors[resolvedMode].card,
      text: Colors[resolvedMode].text,
      border: Colors[resolvedMode].border,
      notification: Brand.gold,
    },
    fonts: resolvedMode === 'dark' ? DarkTheme.fonts : DefaultTheme.fonts,
  };

  return (
    <ThemeProvider value={barbershopTheme}>
      <AppShell>
        <RootNavigator />
      </AppShell>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="agenda" />
      <Stack.Screen name="horario" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="notificaciones" />
      <Stack.Screen name="portafolio" />
      <Stack.Screen name="reportes" />
      <Stack.Screen name="configuracion" />
      <Stack.Screen name="usuarios" />
      <Stack.Screen name="clientes" />
      <Stack.Screen name="inventario" />
      <Stack.Screen name="pagos" />
      <Stack.Screen name="chat" options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }} />
      <Stack.Screen name="appointments/[id]" />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
    </Stack>
  );
}
