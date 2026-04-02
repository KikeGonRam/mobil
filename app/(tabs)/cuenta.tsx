import { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { Brand, Colors } from '@/constants/theme';
import { api, ApiError, type AppointmentRecord } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/use-responsive';
import { useTour } from '@/hooks/use-tour';

export default function AccountScreen() {
  const { token, user, signOut, refreshSession } = useAuth();
  const { mode, cycleMode } = useThemeMode();
  const { spacing, fontScale } = useResponsive();
  const { resetTour, markTourComplete } = useTour();
  const palette = Colors[mode === 'system' ? 'dark' : mode];
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const contentPadding = spacing(20);
  const cardPadding = spacing(18);

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

  const handleStartTour = () => {
    void resetTour();
    // El tour se iniciará automáticamente en index.tsx en la siguiente navegación o recarga
    Alert.alert('Tutorial', 'El tutorial se mostrará la próxima vez que accedas a la app.');
  };

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: contentPadding, gap: spacing(14) }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card, padding: contentPadding }]}>
          <ThemedText type="title" style={[styles.title, { color: palette.text, fontSize: fontScale(28) }]}>
            Mi cuenta
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted, fontSize: fontScale(14) }]}>
            La sesión móvil usa el token emitido por Laravel y se sincroniza con el backend.
          </ThemedText>
        </View>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, padding: cardPadding }]}>
          <ThemedText type="defaultSemiBold" style={[styles.name, { color: palette.text, fontSize: fontScale(18) }]}>
            {user?.name ?? 'Usuario'}
          </ThemedText>
          <ThemedText style={[styles.meta, { color: palette.muted, fontSize: fontScale(13) }]}>{user?.email ?? ''}</ThemedText>
          <ThemedText style={[styles.meta, { color: palette.muted, fontSize: fontScale(13) }]}>{user?.roles?.join(' · ') ?? 'Sin rol'}</ThemedText>

          <View style={[styles.actions, { gap: spacing(10), marginTop: spacing(10) }]}>
            <Pressable onPress={cycleMode} style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Tema: {mode}</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/perfil')} style={styles.secondaryButton}>
              <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Editar perfil</ThemedText>
            </Pressable>
            <Pressable onPress={handleStartTour} style={[styles.secondaryButton, { borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(212,175,55,0.08)' }]}>
              <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12), color: Brand.gold }]}>Ver tutorial</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notificaciones')}
              style={styles.secondaryButton}>
              <View style={styles.notificationButtonContent}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Notificaciones</ThemedText>
                {unreadNotifications > 0 && (
                  <View style={styles.badge}>
                    <ThemedText style={[styles.badgeText, { fontSize: fontScale(10) }]}>{unreadNotifications}</ThemedText>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/chat')} style={styles.secondaryButton}>
              <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Chat</ThemedText>
            </Pressable>
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/agenda')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Agenda</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/horario')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Horario</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('barbero') && (
              <Pressable onPress={() => router.push('/portafolio')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Portafolio</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/reportes')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Reportes</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/configuracion')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Configuracion</ThemedText>
              </Pressable>
            )}
            {user?.roles?.includes('administrador') && (
              <Pressable onPress={() => router.push('/usuarios')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Usuarios</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/clientes')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Clientes</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/inventario')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Inventario</ThemedText>
              </Pressable>
            )}
            {user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista') && (
              <Pressable onPress={() => router.push('/pagos')} style={styles.secondaryButton}>
                <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Pagos</ThemedText>
              </Pressable>
            )}
            <Pressable onPress={refreshSession} style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <ThemedText style={[styles.secondaryButtonText, { fontSize: fontScale(12) }]}>Sincronizar</ThemedText>
            </Pressable>
            <Pressable onPress={signOut} style={styles.logoutButton}>
              <ThemedText style={[styles.logoutText, { fontSize: fontScale(12) }]}>Cerrar sesión</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: palette.border, backgroundColor: palette.card, padding: spacing(16), gap: spacing(12) }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text, fontSize: fontScale(13) }]}>
              Mis citas
            </ThemedText>
            <Pressable onPress={loadAppointments}>
              <ThemedText style={[styles.reload, { fontSize: fontScale(12) }]}>Actualizar</ThemedText>
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
                  style={[styles.listItem, { borderColor: palette.border, backgroundColor: palette.accent, padding: spacing(14), gap: spacing(8) }]}>
                  <View style={styles.listItemHeader}>
                    <ThemedText type="defaultSemiBold" style={[styles.listTitle, { color: palette.text, fontSize: fontScale(14) }]}>
                      {String(appointment.service?.nombre ?? 'Servicio')}
                    </ThemedText>
                    <ThemedText style={[styles.status, getStatusStyle(appointment.estado), { fontSize: fontScale(11) }]}>
                      {String(appointment.estado ?? '')}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.listMeta, { color: palette.muted, fontSize: fontScale(12) }]}>
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
                        <ThemedText style={[styles.cancelButtonText, { fontSize: fontScale(11) }]}>Cancelar cita</ThemedText>
                      )}
                    </Pressable>
                  )}
                </Pressable>
              );
            })
          ) : (
            <ThemedText style={[styles.empty, { color: palette.muted, fontSize: fontScale(13) }]}>Aún no tienes citas registradas.</ThemedText>
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
    paddingBottom: 32,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
  },
  title: {
    color: '#fff',
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
    gap: 4,
  },
  name: {
    color: '#fff',
  },
  meta: {
    color: Brand.muted,
  },
  actions: {
    flexDirection: 'row',
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
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
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
    fontWeight: '900',
  },
  reload: {
    color: Brand.gold,
    textTransform: 'uppercase',
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