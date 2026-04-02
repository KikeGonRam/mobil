import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useThemeMode } from '@/contexts/theme-context';

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function RegisterScreen() {
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!form.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (form.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    if (form.password !== form.password_confirmation) {
      newErrors.password_confirmation = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await api.request<{ message?: string }>('auth/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          password_confirmation: form.password_confirmation,
          device_name: 'UrbanBlade Mobile',
        },
      });

      Alert.alert(
        '¡Cuenta creada!',
        'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Iniciar sesión',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (exception) {
      if (exception instanceof ApiError && exception.payload?.errors) {
        const apiErrors = exception.payload.errors as Record<string, string[]>;
        const firstError = Object.values(apiErrors)[0]?.[0];
        setErrors({
          general: firstError ?? exception.message,
        });
      } else {
        setErrors({
          general: exception instanceof Error ? exception.message : 'No se pudo crear la cuenta.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={[styles.wrapper, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.badge, { borderColor: 'rgba(212,175,55,0.3)', backgroundColor: resolvedMode === 'dark' ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.16)' }]}>
              <ThemedText style={styles.badgeText}>
                Únete a la élite
              </ThemedText>
            </View>
            
            <ThemedText type="title" style={[styles.title, { color: palette.text }]}>
              CREA TU <ThemedText type="title" style={styles.goldText}>CUENTA</ThemedText>
            </ThemedText>
            
            <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
              Gestiona tus citas premium y accede a beneficios exclusivos
            </ThemedText>
          </View>

          <View style={[styles.formCard, { borderColor: palette.border, backgroundColor: palette.card, shadowColor: resolvedMode === 'dark' ? '#000' : palette.border }]}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{errors.general}</ThemedText>
              </View>
            )}

            {/* Nombre */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons name="account-outline" size={14} color="rgba(212,175,55,0.5)" />
                <ThemedText style={[styles.label, { color: palette.muted }]}>Nombre completo</ThemedText>
              </View>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#7f7f7f"
                value={form.name}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, name: value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }, errors.name && styles.inputError]}
              />
              {errors.name && <ThemedText style={styles.fieldError}>{errors.name}</ThemedText>}
            </View>

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
                value={form.email}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, email: value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }, errors.email && styles.inputError]}
              />
              {errors.email && <ThemedText style={styles.fieldError}>{errors.email}</ThemedText>}
            </View>

            {/* Contraseña */}
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
                value={form.password}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, password: value }));
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }, errors.password && styles.inputError]}
              />
              {errors.password && <ThemedText style={styles.fieldError}>{errors.password}</ThemedText>}
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons name="lock-check-outline" size={14} color="rgba(212,175,55,0.5)" />
                <ThemedText style={[styles.label, { color: palette.muted }]}>Confirmar contraseña</ThemedText>
              </View>
              <TextInput
                autoCapitalize="none"
                placeholder="••••••••"
                placeholderTextColor="#7f7f7f"
                secureTextEntry
                value={form.password_confirmation}
                onChangeText={(value) => {
                  setForm((prev) => ({ ...prev, password_confirmation: value }));
                  if (errors.password_confirmation) setErrors((prev) => ({ ...prev, password_confirmation: '' }));
                }}
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }, errors.password_confirmation && styles.inputError]}
              />
              {errors.password_confirmation && <ThemedText style={styles.fieldError}>{errors.password_confirmation}</ThemedText>}
            </View>

            {/* Botón de registro */}
            <Pressable 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  Comenzar ahora <ThemedText style={{ opacity: 0.5 }}>→</ThemedText>
                </ThemedText>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
              <ThemedText style={[styles.dividerText, { color: palette.muted }]}>o</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
            </View>

            {/* Login Link */}
            <Pressable onPress={() => router.push('/login')} style={styles.loginLink}>
              <ThemedText style={[styles.loginLinkText, { color: palette.muted }]}>
                ¿Ya tienes cuenta? <ThemedText style={styles.loginLinkHighlight}>Inicia sesión aquí</ThemedText>
              </ThemedText>
            </Pressable>
          </View>

          {/* Beneficios */}
          <View style={[styles.benefits, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText type="subtitle" style={[styles.benefitsTitle, { color: palette.text }]}>
              Beneficios Exclusivos
            </ThemedText>

            {[
              { icon: 'calendar-clock', text: 'Agenda citas en segundos' },
              { icon: 'account-star', text: 'Elige tu barbero favorito' },
              { icon: 'history', text: 'Historial de tus servicios' },
              { icon: 'bell-ring', text: 'Notificaciones en tiempo real' },
            ].map((benefit, i) => (
              <View key={i} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <MaterialCommunityIcons name={benefit.icon as any} size={14} color={Brand.gold} />
                </View>
                <ThemedText style={[styles.benefitText, { color: palette.text }]}>{benefit.text}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    paddingTop: 10,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: Brand.gold,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  goldText: {
    color: Brand.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    textTransform: 'lowercase',
  },
  subtitle: {
    marginTop: 12,
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  errorBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 14,
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
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
    color: Brand.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
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
    backgroundColor: Brand.line,
  },
  dividerText: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    color: Brand.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginLinkHighlight: {
    color: Brand.gold,
    fontWeight: '900',
  },
  benefits: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 24,
    gap: 16,
  },
  benefitsTitle: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  benefitText: {
    color: Brand.muted,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
