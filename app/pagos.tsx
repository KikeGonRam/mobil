import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, ApiError, type AppointmentRecord, type PaymentRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

const PAYMENT_METHODS: ('efectivo' | 'tarjeta' | 'transferencia' | 'qr')[] = ['efectivo', 'tarjeta', 'transferencia', 'qr'];

export default function PaymentsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [tip, setTip] = useState('0');
  const [method, setMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'qr'>('efectivo');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista');

  const loadPayments = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const [paymentsResponse, appointmentsResponse] = await Promise.all([
        api.payments(token),
        api.appointments(token),
      ]);

      setPayments(paymentsResponse.data);
      setAppointments(appointmentsResponse.data);

      if (!selectedAppointmentId && appointmentsResponse.data[0]) {
        setSelectedAppointmentId(appointmentsResponse.data[0].id);
        setAmount(String(Number(appointmentsResponse.data[0].service?.precio ?? 0).toFixed(2)));
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar los pagos.');
    } finally {
      setLoading(false);
    }
  }, [selectedAppointmentId, token]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId]
  );

  useEffect(() => {
    if (selectedAppointment) {
      setAmount(String(Number(selectedAppointment.service?.precio ?? 0).toFixed(2)));
    }
  }, [selectedAppointment]);

  async function handleSubmit() {
    if (!token || !selectedAppointmentId) {
      setError('Selecciona una cita para registrar el pago.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createPayment(token, {
        appointment_id: selectedAppointmentId,
        monto: Number(amount),
        metodo_pago: method,
        propina: Number(tip || 0),
      });

      await loadPayments();
    } catch (exception) {
      if (exception instanceof ApiError && exception.payload?.errors) {
        const firstError = Object.values(exception.payload.errors)[0]?.[0];
        setError(firstError ?? exception.message);
      } else {
        setError(exception instanceof Error ? exception.message : 'No se pudo registrar el pago.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isStaff) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.restricted}>
          <ThemedText type="title" style={styles.restrictedTitle}>Acceso restringido</ThemedText>
          <ThemedText style={styles.restrictedCopy}>
            Pagos es un modulo administrativo y de recepcion.
          </ThemedText>
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
          <ThemedText type="title" style={styles.title}>Pagos</ThemedText>
          <ThemedText style={styles.subtitle}>
            Lista de cobros y formulario rapido para registrar pagos como en la web.
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Pagos" value={String(payments.length)} />
          <SummaryCard label="Citas" value={String(appointments.length)} />
          <SummaryCard label="Metodo" value={method} accent />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Registrar pago</ThemedText>
            <Pressable onPress={loadPayments}>
              <ThemedText style={styles.refresh}>Refrescar</ThemedText>
            </Pressable>
          </View>

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <View style={styles.selectorList}>
            {appointments.slice(0, 8).map((appointment) => {
              const active = selectedAppointmentId === appointment.id;
              return (
                <Pressable
                  key={String(appointment.id)}
                  onPress={() => setSelectedAppointmentId(appointment.id)}
                  style={[styles.selectorCard, active ? styles.selectorCardActive : null]}>
                  <View style={styles.selectorHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.selectorTitle}>
                      {appointment.client?.name ?? 'Cliente'}
                    </ThemedText>
                    <ThemedText style={styles.selectorPrice}>
                      ${Number(appointment.service?.precio ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.selectorMeta}>
                    {appointment.service?.nombre ?? 'Servicio'} · {appointment.fecha ?? ''}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Monto</ThemedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#7f7f7f"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Propina</ThemedText>
            <TextInput
              value={tip}
              onChangeText={setTip}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#7f7f7f"
              style={styles.input}
            />
          </View>

          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((paymentMethod) => {
              const active = method === paymentMethod;
              return (
                <Pressable
                  key={paymentMethod}
                  onPress={() => setMethod(paymentMethod)}
                  style={[styles.methodButton, active ? styles.methodButtonActive : null]}>
                  <ThemedText style={[styles.methodText, active ? styles.methodTextActive : null]}>
                    {paymentMethod}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submitButton}>
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={styles.submitText}>Registrar pago</ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Pagos recientes</ThemedText>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
            </View>
          ) : payments.length ? payments.map((payment) => (
            <View key={String(payment.id)} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentTitleWrap}>
                  <ThemedText type="defaultSemiBold" style={styles.paymentTitle}>
                    {payment.appointment?.service ?? 'Servicio'}
                  </ThemedText>
                  <ThemedText style={styles.paymentMeta}>
                    {payment.appointment?.client ?? 'Cliente'} · {payment.appointment?.fecha ?? ''}
                  </ThemedText>
                </View>
                <ThemedText style={styles.paymentAmount}>${Number(payment.monto ?? 0).toFixed(2)}</ThemedText>
              </View>
              <ThemedText style={styles.paymentMetaRow}>
                Metodo: {payment.metodo_pago ?? 'N/A'} · Propina: ${Number(payment.propina ?? 0).toFixed(2)}
              </ThemedText>
              {payment.receipt_url ? (
                <ThemedText style={styles.receiptHint}>Recibo disponible desde el backend.</ThemedText>
              ) : null}
            </View>
          )) : <ThemedText style={styles.empty}>No hay pagos registrados.</ThemedText>}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.summaryCard, accent ? styles.summaryCardAccent : null]}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, accent ? styles.summaryValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgMain },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
  },
  title: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  subtitle: { marginTop: 8, color: Brand.muted, lineHeight: 22 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '31%',
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 12,
    gap: 4,
  },
  summaryCardAccent: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  summaryLabel: { color: Brand.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  summaryValueAccent: { color: Brand.gold },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 },
  refresh: { color: Brand.gold, textTransform: 'uppercase', fontSize: 12, fontWeight: '800' },
  error: { color: '#f87171' },
  selectorList: { gap: 10 },
  selectorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 12,
    gap: 4,
  },
  selectorCardActive: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  selectorTitle: { color: '#fff', flex: 1 },
  selectorPrice: { color: Brand.gold, fontWeight: '900' },
  selectorMeta: { color: Brand.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  field: { gap: 6 },
  label: { color: Brand.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  methodButtonActive: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  methodText: { color: Brand.muted, textTransform: 'uppercase', fontWeight: '800', fontSize: 10 },
  methodTextActive: { color: Brand.gold },
  submitButton: {
    borderRadius: 14,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    paddingVertical: 14,
  },
  submitText: { color: '#000', textTransform: 'uppercase', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  loader: { alignItems: 'center', paddingVertical: 18 },
  paymentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 4,
  },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  paymentTitleWrap: { flex: 1 },
  paymentTitle: { color: '#fff' },
  paymentMeta: { color: Brand.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  paymentAmount: { color: Brand.gold, fontWeight: '900', fontSize: 18 },
  paymentMetaRow: { color: Brand.muted, fontSize: 11 },
  receiptHint: { color: '#e5e5e5', fontSize: 12 },
  empty: { color: Brand.muted, fontStyle: 'italic' },
  restricted: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  restrictedTitle: { color: '#fff', fontSize: 28 },
  restrictedCopy: { color: Brand.muted, lineHeight: 22 },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: { color: '#fff', textTransform: 'uppercase', fontWeight: '800', fontSize: 11 },
});
