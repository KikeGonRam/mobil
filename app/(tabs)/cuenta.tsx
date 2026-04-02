import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { Brand, Colors } from '@/constants/theme';
import { api, ApiError, type AppointmentRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

export default function AccountScreen() {
  const { token, user, signOut, refreshSession } = useAuth();
  const { mode, cycleMode } = useThemeMode();
  const palette = Colors[mode === 'system' ? 'dark' : mode];
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadUnreadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.getNotifications(token);
      const unread = response.data.filter((n) => !n.read_at).length;
      setUnreadNotifications(unread);
    } catch {
      // Ignorar errores silenciosamente
    }
  }, [token]);

  const loadAppointments = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.appointments(token);
      setAppointments(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAppointments();
    void loadUnreadNotifications();
  }, [loadAppointments, loadUnreadNotifications]);

  const handleCancelAppointment = useCallback(
    async (appointmentId: number) => {
      if (!token) return;

      Alert.alert(
        'Cancelar cita',
        '¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.',
        [
          {
            text: 'No, mantener',
            style: 'cancel',
          },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              setCancellingId(appointmentId);
              try {
                await api.cancelAppointment(token, appointmentId);
                setAppointments((prev) =>
                  prev.map((apt) =>
                    apt.id === appointmentId ? { ...apt, estado: 'cancelada' } : apt
                  )
                );
                Alert.alert('Cita cancelada', 'La cita ha sido cancelada correctamente.');
              } catch (exception) {
                const message =
                  exception instanceof ApiError ? exception.message : 'No se pudo cancelar la cita.';
                Alert.alert('Error', message);
              } finally {
                setCancellingId(null);
              }
            },
          },
        ]
      );
    },
    [token]
  );

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText type="title" style={[styles.title, { color: palette.text }]}>
            Mi cuenta
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
            La sesión móvil usa el token emitido por Laravel y se sincroniza con el backend.
          </ThemedText>
        </View>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText type="defaultSemiBold" style={[styles.name, { color: palette.text }]}>
            {user?.name ?? 'Usuario'}
          </ThemedText>
          <ThemedText style={[styles.meta, { color: palette.muted }]}>{user?.email ?? ''}</ThemedText>
          <ThemedText style={[styles.meta, { color: palette.muted }]}>{user?.roles?.join(' · ') ?? 'Sin rol'}</ThemedText>

          <View style={styles.actions}>
            <Pressable onPress={cycleMode} style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <ThemedText style={styles.secondaryButtonText}>Tema: {mode}</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/perfil')} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Editar perfil</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notificaciones')}
              style={styles.secondaryButton}>
              <View style={styles.notificationButtonContent}>
                <ThemedText style={styles.secondaryButtonText}>Notificaciones</ThemedText>
                {unreadNotifications > 0 && (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{unreadNotifications}</ThemedText>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/chat')} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Chat</ThemedText>
            </Pressable>
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/agenda')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Agenda</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/horario')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Horario</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/portafolio')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Portafolio</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/reportes')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Reportes</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/configuracion')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Configuracion</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/usuarios')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Usuarios</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/clientes')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Clientes</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/inventario')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Inventario</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/pagos')} style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Pagos</ThemedText>
              </Pressable>
            )}
            <Pressable onPress={refreshSession} style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <ThemedText style={styles.secondaryButtonText}>Sincronizar</ThemedText>
            </Pressable>
            <Pressable onPress={signOut} style={styles.logoutButton}>
              <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text }]}>
              Mis citas
            </ThemedText>
            <Pressable onPress={loadAppointments}>
              <ThemedText style={styles.reload}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={[styles.loader, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <ActivityIndicator color={Brand.gold} />
            </View>
          ) : appointments.length ? (
            appointments.map((appointment) => {
              const isCancelling = cancellingId === appointment.id;
              const canCancel =
                appointment.estado !== 'cancelada' &&
                appointment.estado !== 'completada' &&
                appointment.estado !== 'no_asistio';

              return (
                <Pressable
                  key={String(appointment.id)}
                  onPress={() => router.push({ pathname: '/appointments/[id]', params: { id: String(appointment.id) } })}
                  style={[styles.listItem, { borderColor: palette.border, backgroundColor: palette.accent }]}>
                  <View style={styles.listItemHeader}>
                    <ThemedText type="defaultSemiBold" style={[styles.listTitle, { color: palette.text }]}>
                      {String(appointment.service?.nombre ?? 'Servicio')}
                    </ThemedText>
                    <ThemedText style={[styles.status, getStatusStyle(appointment.estado)]}>
                      {String(appointment.estado ?? '')}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.listMeta, { color: palette.muted }]}>
                    {String(appointment.fecha ?? '')} · {String(appointment.hora_inicio ?? '')}
                  </ThemedText>
                  {canCancel && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancelAppointment(appointment.id);
                      }}
                      disabled={isCancelling}
                      style={[
                        styles.cancelButton,
                        isCancelling ? styles.cancelButtonDisabled : null,
                      ]}>
                      {isCancelling ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <ThemedText style={styles.cancelButtonText}>Cancelar cita</ThemedText>
                      )}
                    </Pressable>
                  )}
                </Pressable>
              );
            })
          ) : (
            <ThemedText style={[styles.empty, { color: palette.muted }]}>Aún no tienes citas registradas.</ThemedText>
          )}
        </View>
      </ScrollView>
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
    gap: 14,
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
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: 18,
  },
  meta: {
    color: Brand.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 12,
  },
  notificationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 10,
  },
  logoutButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  reload: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '800',
  },
  loader: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 8,
  },
  listTitle: {
    color: '#fff',
  },
  listMeta: {
    color: Brand.muted,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  status: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
  },
  statusPending: {
    color: '#fbbf24',
  },
  statusConfirmada: {
    color: '#60a5fa',
  },
  statusEnProceso: {
    color: '#a78bfa',
  },
  statusCompletada: {
    color: '#34d399',
  },
  statusCancelada: {
    color: '#f87171',
  },
  statusNoAsistio: {
    color: '#9ca3af',
  },
  cancelButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  empty: {
    color: Brand.muted,
    fontStyle: 'italic',
  },
});

function getStatusStyle(estado?: string) {
  switch (estado) {
    case 'pendiente':
      return styles.statusPending;
    case 'confirmada':
      return styles.statusConfirmada;
    case 'en_proceso':
      return styles.statusEnProceso;
    case 'completada':
      return styles.statusCompletada;
    case 'cancelada':
      return styles.statusCancelada;
    case 'no_asistio':
      return styles.statusNoAsistio;
    default:
      return styles.status;
  }
}