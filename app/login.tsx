import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { Brand } from '@/constants/theme';

export default function LoginScreen() {
  const { token, signIn, isLoading, error } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      router.replace('/(tabs)');
    }
  }, [token]);

  if (token) {
    return null;
  }

  async function handleLogin() {
    setLoginError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      setLoginError(error || 'No se pudo iniciar sesión.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}>
      <ThemedView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: Brand.gold }]}>
              <MaterialCommunityIcons name="content-cut" size={32} color="#000" />
            </View>
          </View>
          
          <ThemedText type="title" style={[styles.title, { color: palette.text }]}>
            BIENVENIDO <ThemedText type="title" style={styles.goldText}>DE NUEVO</ThemedText>
          </ThemedText>
          
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
            Premium Grooming Studio
          </ThemedText>
        </View>

        <View style={[styles.formCard, { borderColor: palette.border, backgroundColor: palette.card, shadowColor: resolvedMode === 'dark' ? '#000' : palette.border }]}>
          <ThemedText style={[styles.sectionDescription, { color: palette.muted }]}>
            Introduce tus credenciales para continuar
          </ThemedText>

          {/* Email */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="email-outline" size={14} color="rgba(212,175,55,0.5)" />
              <ThemedText style={[styles.label, { color: palette.muted }]}>Correo electrónico</ThemedText>
            </View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="tu@email.com"
              placeholderTextColor="#7f7f7f"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="lock-outline" size={14} color="rgba(212,175,55,0.5)" />
              <ThemedText style={[styles.label, { color: palette.muted }]}>Contraseña</ThemedText>
            </View>
            <TextInput
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor="#7f7f7f"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
            />
          </View>

          {loginError ? <ThemedText style={styles.error}>{loginError}</ThemedText> : null}

          <Pressable style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#000" /> : <ThemedText style={styles.buttonText}>Iniciar Sesión <ThemedText style={{ opacity: 0.5 }}>→</ThemedText></ThemedText>}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
            <ThemedText style={[styles.dividerText, { color: palette.muted }]}>o</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
          </View>

          {/* Register Link */}
          <Pressable onPress={() => router.push('/registro')} style={styles.registerLink}>
            <ThemedText style={[styles.registerLinkText, { color: palette.muted }]}>
              ¿Aún no tienes cuenta? <ThemedText style={styles.registerLinkHighlight}>Regístrate ahora</ThemedText>
            </ThemedText>
          </Pressable>

          {/* Volver al inicio */}
          <Pressable onPress={() => router.replace('/landing')} style={styles.backLink}>
            <ThemedText style={[styles.backLinkText, { color: palette.muted }]}>← Volver al inicio</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glowOne: {
    position: 'absolute',
    top: 80,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.12)',
    shadowColor: Brand.gold,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  } as never,
  glowTwo: {
    position: 'absolute',
    right: -50,
    bottom: 120,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.08)',
    shadowColor: Brand.gold,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  } as never,
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  goldText: {
    color: Brand.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    textTransform: 'lowercase',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  formCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  sectionDescription: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
  },
  error: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Brand.gold,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Brand.gold,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  registerLinkText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  registerLinkHighlight: {
    color: Brand.gold,
    fontWeight: '900',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});