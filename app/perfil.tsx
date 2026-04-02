import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { api, ApiError } from '@/lib/api';
import { useRouter } from 'expo-router';

type ProfileForm = {
  name: string;
  email: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
};

export default function ProfileScreen() {
  const { token, user, refreshSession } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handleUpdateProfile = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
      };

      if (form.password || form.password_confirmation) {
        if (form.password !== form.password_confirmation) {
          Alert.alert('Error', 'Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }
        if (!form.current_password) {
          Alert.alert('Error', 'Debes ingresar tu contraseña actual para cambiar la contraseña.');
          setLoading(false);
          return;
        }
        payload.current_password = form.current_password || '';
        payload.password = form.password || '';
        payload.password_confirmation = form.password_confirmation || '';
      }

      const response = await api.request<{ message: string }>('/profile', {
        token,
        method: 'PATCH',
        body: payload,
      });

      Alert.alert('Éxito', response.message || 'Perfil actualizado correctamente.', [
        {
          text: 'OK',
          onPress: () => {
            setForm((prev) => ({
              ...prev,
              current_password: '',
              password: '',
              password_confirmation: '',
            }));
            void refreshSession();
          },
        },
      ]);
    } catch (exception) {
      if (exception instanceof ApiError && exception.payload?.errors) {
        const firstError = Object.values(exception.payload.errors)[0]?.[0];
        Alert.alert('Error', firstError ?? exception.message);
      } else {
        Alert.alert('Error', exception instanceof Error ? exception.message : 'No se pudo actualizar el perfil.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, form, refreshSession]);

  const handleDeleteAccount = useCallback(async () => {
    if (!token) return;

    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y se perderán todos tus datos.',
      [
        {
          text: 'No, mantener',
          style: 'cancel',
        },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.request('/profile', {
                token,
                method: 'DELETE',
              });
              Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.', [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/login');
                  },
                },
              ]);
            } catch (exception) {
              const message = exception instanceof ApiError ? exception.message : 'No se pudo eliminar la cuenta.';
              Alert.alert('Error', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [token, router]);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText type="title" style={[styles.title, { color: palette.text }]}>
              Mi perfil
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
              Actualiza tu información personal y contraseña.
            </ThemedText>
          </View>

          <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text }]}>
              Información básica
            </ThemedText>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Nombre</ThemedText>
              <TextInput
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Tu nombre"
                placeholderTextColor="#7f7f7f"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Correo electrónico</ThemedText>
              <TextInput
                value={form.email}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                placeholder="tu@email.com"
                placeholderTextColor="#7f7f7f"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text }]}>
              Cambiar contraseña
            </ThemedText>
            <ThemedText style={[styles.helper, { color: palette.muted }]}>
              Deja estos campos vacíos si no deseas cambiar tu contraseña.
            </ThemedText>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Contraseña actual</ThemedText>
              <TextInput
                value={form.current_password}
                onChangeText={(value) => setForm((prev) => ({ ...prev, current_password: value }))}
                placeholder="••••••••"
                placeholderTextColor="#7f7f7f"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Nueva contraseña</ThemedText>
              <TextInput
                value={form.password}
                onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
                placeholder="••••••••"
                placeholderTextColor="#7f7f7f"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Confirmar nueva contraseña</ThemedText>
              <TextInput
                value={form.password_confirmation}
                onChangeText={(value) => setForm((prev) => ({ ...prev, password_confirmation: value }))}
                placeholder="••••••••"
                placeholderTextColor="#7f7f7f"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable onPress={handleUpdateProfile} style={[styles.saveButton, { backgroundColor: palette.tint }]} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={palette.background} />
            ) : (
              <ThemedText style={[styles.saveButtonText, { color: palette.background }]}>Guardar cambios</ThemedText>
            )}
          </Pressable>

          <View style={[styles.dangerZone, { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)' }]}>
            <ThemedText type="subtitle" style={styles.dangerTitle}>
              Zona de peligro
            </ThemedText>
            <ThemedText style={[styles.dangerCopy, { color: palette.muted }]}>
              Eliminar tu cuenta es permanente y no se puede deshacer.
            </ThemedText>
            <Pressable onPress={handleDeleteAccount} style={styles.deleteButton} disabled={loading}>
              <ThemedText style={styles.deleteButtonText}>Eliminar cuenta permanentemente</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: Brand.muted,
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  helper: {
    color: Brand.muted,
    fontSize: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: Brand.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Brand.gold,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerZone: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.05)',
    padding: 18,
    gap: 10,
  },
  dangerTitle: {
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dangerCopy: {
    color: Brand.muted,
    fontSize: 13,
  },
  deleteButton: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
