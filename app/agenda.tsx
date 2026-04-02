import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, ApiError, type AppointmentRecord } from '@/lib/api';

type AgendaPeriod = 'day' | 'week';

type AppointmentStatus = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'no_asistio';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No asistio' },
];

export default function AgendaScreen() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState<AgendaPeriod>('day');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isBarber = user?.roles?.includes('barbero');

  const loadAgenda = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.appointments(token);
      setAppointments(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    return appointments
      .filter((appointment) => {
        if (isBarber && user?.barber_id && appointment.barber?.id !== user.barber_id) {
          return false;
        }

        if (!appointment.fecha) {
          return false;
        }

        const date = new Date(`${appointment.fecha}T00:00:00`);
        if (Number.isNaN(date.getTime())) {
          return false;
        }

        if (period === 'day') {
          return date.getTime() === today.getTime();
        }

        return date >= today && date < weekEnd;
      })
      .sort((a, b) => {
        const left = `${a.fecha ?? ''} ${a.hora_inicio ?? ''}`;
        const right = `${b.fecha ?? ''} ${b.hora_inicio ?? ''}`;
        return left.localeCompare(right);
      });
  }, [appointments, isBarber, period, user?.barber_id]);

  async function handleQuickStart(appointmentId: number) {
    if (!token) {
      return;
    }

    setUpdatingId(appointmentId);
    try {
      const response = await api.updateAppointmentStatus(token, appointmentId, { estado: 'en_proceso' });
      setAppointments((current) =>
        current.map((appointment) => (appointment.id === appointmentId ? response.data : appointment))
      );
    } catch (exception) {
      const message = exception instanceof ApiError ? exception.message : 'No se pudo iniciar el servicio.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStatusChange(appointmentId: number, currentStatus?: string) {
    if (!token) {
      return;
    }

    const currentIndex = STATUS_OPTIONS.findIndex((item) => item.value === currentStatus);
    const nextStatus = STATUS_OPTIONS[(currentIndex + 1 + STATUS_OPTIONS.length) % STATUS_OPTIONS.length].value;

    setUpdatingId(appointmentId);
    try {
      const response = await api.updateAppointmentStatus(token, appointmentId, { estado: nextStatus });
      setAppointments((current) =>
        current.map((appointment) => (appointment.id === appointmentId ? response.data : appointment))
      );
    } catch (exception) {
      const message = exception instanceof ApiError ? exception.message : 'No se pudo actualizar el estado.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Mi agenda maestra
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Vista diaria y semanal para gestionar servicios como en la web.
          </ThemedText>
        </View>

        <View style={styles.periodSwitch}>
          <Pressable
            onPress={() => setPeriod('day')}
            style={[styles.periodButton, period === 'day' ? styles.periodButtonActive : null]}>
            <ThemedText style={[styles.periodText, period === 'day' ? styles.periodTextActive : null]}>Hoy</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setPeriod('week')}
            style={[styles.periodButton, period === 'week' ? styles.periodButtonActive : null]}>
            <ThemedText style={[styles.periodText, period === 'week' ? styles.periodTextActive : null]}>Semana</ThemedText>
          </Pressable>
        </View>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={styles.loaderText}>Cargando agenda...</ThemedText>
          </View>
        ) : filteredAppointments.length ? (
          filteredAppointments.map((appointment) => {
            const isUpdating = updatingId === appointment.id;
            return (
              <View key={String(appointment.id)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <ThemedText type="defaultSemiBold" style={styles.clientName}>
                      {appointment.client?.name ?? 'Cliente'}
                    </ThemedText>
                    <ThemedText style={styles.serviceName}>{appointment.service?.nombre ?? 'Servicio'}</ThemedText>
                  </View>
                  <View style={styles.statusPill}>
                    <ThemedText style={styles.statusText}>{appointment.estado ?? 'pendiente'}</ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.meta}>
                  {appointment.fecha ?? ''} · {appointment.hora_inicio ?? ''} - {appointment.hora_fin ?? ''}
                </ThemedText>

                <View style={styles.actions}>
                  <Pressable
                    disabled={isUpdating}
                    onPress={() => handleQuickStart(appointment.id)}
                    style={[styles.actionButton, styles.primaryAction, isUpdating ? styles.actionDisabled : null]}>
                    {isUpdating ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <ThemedText style={styles.primaryActionText}>Iniciar servicio</ThemedText>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={isUpdating}
                    onPress={() => handleStatusChange(appointment.id, appointment.estado)}
                    style={[styles.actionButton, styles.secondaryAction, isUpdating ? styles.actionDisabled : null]}>
                    <ThemedText style={styles.secondaryActionText}>Cambiar estado</ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>No hay servicios programados para este periodo.</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bgMain,
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
    marginTop: 8,
    color: Brand.muted,
    lineHeight: 22,
  },
  periodSwitch: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 6,
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Brand.gold,
  },
  periodText: {
    color: Brand.muted,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
  },
  periodTextActive: {
    color: '#000',
  },
  error: {
    color: '#f87171',
  },
  loader: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: Brand.muted,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    color: '#fff',
  },
  serviceName: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 1,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 10,
  },
  meta: {
    color: Brand.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: Brand.gold,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
  },
  primaryActionText: {
    color: '#000',
    textTransform: 'uppercase',
    fontWeight: '900',
    fontSize: 11,
  },
  secondaryActionText: {
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    borderStyle: 'dashed',
    backgroundColor: Brand.bgCard,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Brand.muted,
  },
});
