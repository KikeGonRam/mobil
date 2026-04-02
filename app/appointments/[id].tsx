import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, ApiError, type AppointmentRecord } from '@/lib/api';

type AppointmentStatus = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'no_asistio';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: '#fbbf24' },
  { value: 'confirmada', label: 'Confirmada', color: '#60a5fa' },
  { value: 'en_proceso', label: 'En proceso', color: '#a78bfa' },
  { value: 'completada', label: 'Completada', color: '#34d399' },
  { value: 'cancelada', label: 'Cancelada', color: '#f87171' },
  { value: 'no_asistio', label: 'No asistió', color: '#9ca3af' },
];

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadAppointment = useCallback(async () => {
    if (!token || !id) return;

    setLoading(true);
    try {
      const response = await api.appointments(token);
      const found = response.data.find((apt) => String(apt.id) === id);
      setAppointment(found ?? null);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la cita.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const handleUpdateStatus = useCallback(
    async (newStatus: AppointmentStatus) => {
      if (!token || !appointment) return;

      Alert.alert(
        'Actualizar estado',
        `¿Cambiar estado a "${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Confirmar',
            onPress: async () => {
              setUpdating(true);
              try {
                const response = await api.updateAppointmentStatus(token, appointment.id, {
                  estado: newStatus,
                });
                setAppointment(response.data);
                Alert.alert('Éxito', 'Estado actualizado correctamente.');
              } catch (exception) {
                const message =
                  exception instanceof ApiError ? exception.message : 'No se pudo actualizar el estado.';
                Alert.alert('Error', message);
              } finally {
                setUpdating(false);
              }
            },
          },
        ]
      );
    },
    [token, appointment]
  );

  const isBarber = user?.roles?.includes('barbero');
  const canUpdateStatus = isBarber && appointment?.barber?.id === user?.barber_id;

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.loader}>
          <ActivityIndicator color={Brand.gold} size="large" />
          <ThemedText style={styles.loaderText}>Cargando cita...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!appointment) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.notFound}>
          <ThemedText type="title" style={styles.notFoundTitle}>
            Cita no encontrada
          </ThemedText>
          <ThemedText style={styles.notFoundCopy}>
            La cita que buscas no existe o fue eliminada.
          </ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === appointment.estado);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Detalle de cita
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Información completa de la cita agendada
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Estado actual:</ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${currentStatus?.color}20`, borderColor: currentStatus?.color },
              ]}>
              <ThemedText style={[styles.statusText, { color: currentStatus?.color }]}>
                {currentStatus?.label}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Servicio
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Nombre:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.service?.nombre ?? 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Precio:</ThemedText>
            <ThemedText style={styles.infoValue}>
              ${Number(appointment.service?.precio ?? 0).toFixed(2)} MXN
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Duración:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.service?.duracion_min ?? 0} min</ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Fecha y hora
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Fecha:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.fecha ?? 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Hora inicio:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.hora_inicio ?? 'N/A'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Hora fin:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.hora_fin ?? 'N/A'}</ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Barbero
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Nombre:</ThemedText>
            <ThemedText style={styles.infoValue}>{appointment.barber?.name ?? 'N/A'}</ThemedText>
          </View>
        </View>

        {appointment.client && (
          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Cliente
            </ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Nombre:</ThemedText>
              <ThemedText style={styles.infoValue}>{appointment.client.name ?? 'N/A'}</ThemedText>
            </View>
          </View>
        )}

        {appointment.notas && (
          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Notas
            </ThemedText>
            <ThemedText style={styles.notes}>{appointment.notas}</ThemedText>
          </View>
        )}

        {canUpdateStatus && (
          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Gestionar estado
            </ThemedText>
            <ThemedText style={styles.helper}>
              Como barbero asignado, puedes actualizar el estado de esta cita.
            </ThemedText>

            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((status) => {
                const isActive = appointment.estado === status.value;
                const isDisabled = updating || isActive;

                return (
                  <Pressable
                    key={status.value}
                    onPress={() => handleUpdateStatus(status.value)}
                    disabled={isDisabled}
                    style={[
                      styles.statusButton,
                      { borderColor: status.color },
                      isActive && { backgroundColor: `${status.color}20` },
                      isDisabled && styles.statusButtonDisabled,
                    ]}>
                    <ThemedText
                      style={[
                        styles.statusButtonText,
                        { color: isActive ? status.color : '#fff' },
                      ]}>
                      {status.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>Volver</ThemedText>
        </Pressable>
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
    gap: 16,
  },
  header: {
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
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: Brand.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  notes: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  helper: {
    color: Brand.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusButtonDisabled: {
    opacity: 0.4,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingVertical: 14,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: Brand.muted,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  notFoundTitle: {
    color: '#fff',
  },
  notFoundCopy: {
    color: Brand.muted,
    textAlign: 'center',
  },
});
