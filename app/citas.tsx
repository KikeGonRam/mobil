import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { api, type AppointmentRecord } from '@/lib/api';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function AppointmentsScreen() {
  const { token, user } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista' || role === 'barbero');

  const loadAppointments = useCallback(async () => {
    if (!token || !isStaff) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.appointments(token);
      setAppointments(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar las citas.');
    } finally {
      setLoading(false);
    }
  }, [isStaff, token]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  if (!isStaff) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.restricted}>
          <ThemedText type="title" style={styles.restrictedTitle}>Acceso restringido</ThemedText>
          <ThemedText style={styles.restrictedCopy}>Citas es una vista operativa para administracion y recepcion.</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>Citas</ThemedText>
          <ThemedText style={styles.subtitle}>Listado operativo de citas, alineado al flujo del panel web.</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard styles={styles} label="Total" value={String(appointments.length)} />
          <SummaryCard styles={styles} label="Activas" value={String(appointments.filter((appointment) => appointment.estado !== 'cancelada').length)} accent />
          <SummaryCard styles={styles} label="Completadas" value={String(appointments.filter((appointment) => appointment.estado === 'completada').length)} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Agenda reciente</ThemedText>
            <Pressable onPress={loadAppointments}>
              <ThemedText style={styles.refresh}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={palette.tint} />
              <ThemedText style={styles.loaderText}>Cargando citas...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : appointments.length ? appointments.map((appointment) => (
            <Pressable
              key={String(appointment.id)}
              onPress={() => router.push(`/appointments/${appointment.id}`)}
              style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentTitleWrap}>
                  <ThemedText type="defaultSemiBold" style={styles.appointmentTitle}>
                    {appointment.client?.name ?? 'Cliente'}
                  </ThemedText>
                  <ThemedText style={styles.appointmentMeta}>
                    {appointment.service?.nombre ?? 'Servicio'} · {appointment.barber?.name ?? 'Barbero'}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, statusStyle(appointment.estado, styles)]}>
                  <ThemedText style={[styles.statusText, statusTextStyle(appointment.estado, styles)]}>
                    {appointment.estado ?? 'pendiente'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.appointmentMetaRow}>
                {formatDate(appointment.fecha ?? '')} · {appointment.hora_inicio ?? '--:--'}
                {appointment.hora_fin ? ` - ${appointment.hora_fin}` : ''}
              </ThemedText>
              {appointment.notas ? <ThemedText style={styles.appointmentCopy}>{appointment.notas}</ThemedText> : null}
            </Pressable>
          )) : (
            <ThemedText style={styles.empty}>No hay citas registradas.</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryCard({ label, value, accent = false, styles }: { label: string; value: string; accent?: boolean; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={[styles.summaryCard, accent ? styles.summaryCardAccent : null]}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, accent ? styles.summaryValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

function statusStyle(status: string | undefined, styles: ReturnType<typeof createStyles>) {
  switch (status) {
    case 'completada':
      return styles.statusDone;
    case 'cancelada':
      return styles.statusCancelled;
    case 'confirmada':
      return styles.statusConfirmed;
    default:
      return styles.statusPending;
  }
}

function statusTextStyle(status: string | undefined, styles: ReturnType<typeof createStyles>) {
  switch (status) {
    case 'completada':
    case 'cancelada':
    case 'confirmada':
      return styles.statusTextBright;
    default:
      return styles.statusTextSoft;
  }
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 20,
  },
  title: { color: palette.text, fontSize: 28, lineHeight: 32, fontWeight: '900' },
  subtitle: { marginTop: 8, color: palette.muted, lineHeight: 22 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '31%',
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 12,
    gap: 4,
  },
  summaryCardAccent: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  summaryLabel: { color: palette.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  summaryValue: { color: palette.text, fontSize: 20, fontWeight: '900' },
  summaryValueAccent: { color: palette.tint },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: palette.text, textTransform: 'uppercase', letterSpacing: 1.5 },
  refresh: { color: palette.tint, textTransform: 'uppercase', fontSize: 12, fontWeight: '800' },
  appointmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.accent,
    padding: 14,
    gap: 6,
  },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  appointmentTitleWrap: { flex: 1 },
  appointmentTitle: { color: palette.text },
  appointmentMeta: { color: palette.muted, fontSize: 11 },
  appointmentMetaRow: { color: palette.tint, fontWeight: '700' },
  appointmentCopy: { color: palette.text, lineHeight: 20 },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPending: { borderColor: palette.border, backgroundColor: palette.card },
  statusConfirmed: { borderColor: 'rgba(34,197,94,0.25)', backgroundColor: 'rgba(34,197,94,0.1)' },
  statusDone: { borderColor: 'rgba(59,130,246,0.25)', backgroundColor: 'rgba(59,130,246,0.1)' },
  statusCancelled: { borderColor: 'rgba(248,113,113,0.25)', backgroundColor: 'rgba(248,113,113,0.1)' },
  statusText: { textTransform: 'uppercase', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  statusTextSoft: { color: palette.muted },
  statusTextBright: { color: palette.text },
  loader: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: { color: palette.muted },
  error: { color: '#fca5a5', lineHeight: 22 },
  empty: { color: palette.muted, fontStyle: 'italic' },
  restricted: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  restrictedTitle: { color: palette.text, fontSize: 28 },
  restrictedCopy: { color: palette.muted, lineHeight: 22 },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: { color: palette.text, fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  });
}
