import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, ApiError, type BarberRecord, type ServiceRecord, type SlotRecord } from '@/lib/api';

export default function ReservationsScreen() {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [barbers, setBarbers] = useState<BarberRecord[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [servicesResponse, barbersResponse] = await Promise.all([api.services(), api.barbers()]);
      setServices(servicesResponse.data);
      setBarbers(barbersResponse.data);

      setSelectedServiceId((current) => current ?? servicesResponse.data[0]?.id ?? null);
      setSelectedBarberId((current) => current ?? barbersResponse.data[0]?.id ?? null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async () => {
    if (!token || !selectedServiceId || !selectedBarberId) {
      return;
    }

    setSlotLoading(true);
    setError(null);

    try {
      const response = await api.availability(token, {
        barber_id: selectedBarberId,
        service_id: selectedServiceId,
        date: selectedDate,
      });

      setSlots(response.slots);
      setSelectedSlot((current) => (response.slots.some((slot) => slot.time === current) ? current : response.slots[0]?.time ?? null));
    } catch (exception) {
      setSlots([]);
      setSelectedSlot(null);
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar la disponibilidad.');
    } finally {
      setSlotLoading(false);
    }
  }, [selectedBarberId, selectedDate, selectedServiceId, token]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!selectedServiceId || !selectedBarberId) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    void loadSlots();
  }, [loadSlots, selectedBarberId, selectedDate, selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services]
  );

  async function handleBook() {
    if (!token || !selectedServiceId || !selectedBarberId || !selectedSlot) {
      setError('Completa servicio, barbero y horario.');
      return;
    }

    setBooking(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.createAppointment(token, {
        barber_id: selectedBarberId,
        service_id: selectedServiceId,
        fecha: selectedDate,
        hora_inicio: selectedSlot,
        notas: notes.trim() || undefined,
      });

      setMessage(response.message);
      setNotes('');
      await loadSlots();
    } catch (exception) {
      if (exception instanceof ApiError && exception.payload?.errors) {
        const firstError = Object.values(exception.payload.errors)[0]?.[0];
        setError(firstError ?? exception.message);
      } else {
        setError(exception instanceof Error ? exception.message : 'No se pudo crear la cita.');
      }
    } finally {
      setBooking(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Reservar cita
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Escoge servicio, barbero, fecha y horario. La disponibilidad viene directo del backend.
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={styles.loaderText}>Cargando servicios y barberos...</ThemedText>
          </View>
        ) : (
          <>
            <Section title="1. Servicio">
              <FlatList
                horizontal
                data={services}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerRow}
                renderItem={({ item }) => {
                  const active = selectedServiceId === item.id;
                  return (
                    <Pressable
                      onPress={() => setSelectedServiceId(item.id)}
                      style={[styles.pickerCard, active ? styles.pickerCardActive : null]}>
                      <ThemedText type="defaultSemiBold" style={styles.pickerTitle}>
                        {item.nombre}
                      </ThemedText>
                      <ThemedText style={styles.pickerMeta}>{Number(item.precio ?? 0).toFixed(2)} MXN</ThemedText>
                    </Pressable>
                  );
                }}
              />
            </Section>

            <Section title="2. Barbero">
              <FlatList
                horizontal
                data={barbers}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerRow}
                renderItem={({ item }) => {
                  const active = selectedBarberId === item.id;
                  return (
                    <Pressable
                      onPress={() => setSelectedBarberId(item.id)}
                      style={[styles.pickerCard, active ? styles.pickerCardActive : null]}>
                      <ThemedText type="defaultSemiBold" style={styles.pickerTitle}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={styles.pickerMeta}>{item.especialidades ?? 'General'}</ThemedText>
                    </Pressable>
                  );
                }}
              />
            </Section>

            <Section title="3. Fecha">
              <TextInput
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#7f7f7f"
                style={styles.input}
              />
              <ThemedText style={styles.helper}>Ejemplo: 2026-04-03</ThemedText>
            </Section>

            <Section title="4. Horarios disponibles">
              {slotLoading ? (
                <View style={styles.loaderInline}>
                  <ActivityIndicator color={Brand.gold} />
                </View>
              ) : slots.length ? (
                <View style={styles.slotGrid}>
                  {slots.map((slot) => {
                    const active = selectedSlot === slot.time;
                    return (
                      <Pressable
                        key={slot.time}
                        onPress={() => setSelectedSlot(slot.time)}
                        style={[styles.slotButton, active ? styles.slotButtonActive : null]}>
                        <ThemedText style={[styles.slotText, active ? styles.slotTextActive : null]}>
                          {slot.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText style={styles.empty}>Sin horarios disponibles para esta combinación.</ThemedText>
              )}
            </Section>

            <Section title="5. Notas opcionales">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ejemplo: Corte clásico con degradado bajo"
                placeholderTextColor="#7f7f7f"
                multiline
                style={[styles.input, styles.textArea]}
              />
            </Section>

            {selectedService ? (
              <View style={styles.summary}>
                <ThemedText type="subtitle" style={styles.summaryTitle}>
                  Resumen
                </ThemedText>
                <ThemedText style={styles.summaryText}>
                  {selectedService.nombre} con {barbers.find((barber) => barber.id === selectedBarberId)?.name ?? 'Barbero'}
                </ThemedText>
                <ThemedText style={styles.summaryText}>
                  Fecha: {selectedDate} · Hora: {selectedSlot ?? 'Pendiente'}
                </ThemedText>
                <ThemedText style={styles.summaryPrice}>
                  Total estimado: ${Number(selectedService.precio ?? 0).toFixed(2)} MXN
                </ThemedText>
              </View>
            ) : null}

            {message ? <ThemedText style={styles.success}>{message}</ThemedText> : null}
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

            <Pressable onPress={handleBook} style={styles.bookButton} disabled={booking}>
              {booking ? <ActivityIndicator color="#000" /> : <ThemedText style={styles.bookButtonText}>Confirmar cita</ThemedText>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

  function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
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
    lineHeight: 22,
    marginTop: 8,
  },
  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pickerRow: {
    gap: 10,
  },
  pickerCard: {
    width: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 4,
  },
  pickerCardActive: {
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  pickerTitle: {
    color: '#fff',
  },
  pickerMeta: {
    color: Brand.muted,
    fontSize: 12,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helper: {
    color: Brand.muted,
    fontSize: 12,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotButtonActive: {
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  slotText: {
    color: '#fff',
    fontWeight: '700',
  },
  slotTextActive: {
    color: Brand.gold,
  },
  loader: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderInline: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: Brand.muted,
  },
  empty: {
    color: Brand.muted,
    fontStyle: 'italic',
  },
  summary: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    backgroundColor: 'rgba(212,175,55,0.06)',
    padding: 16,
    gap: 6,
  },
  summaryTitle: {
    color: Brand.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  summaryText: {
    color: '#fff',
  },
  summaryPrice: {
    marginTop: 4,
    color: Brand.gold,
    fontWeight: '800',
  },
  success: {
    color: '#86efac',
  },
  error: {
    color: '#f87171',
  },
  bookButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Brand.gold,
    paddingVertical: 14,
  },
  bookButtonText: {
    color: '#000',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});