import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { api, type BarberRecord } from '@/lib/api';

export default function BarbersScreen() {
  const [barbers, setBarbers] = useState<BarberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.barbers();
      setBarbers(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los barberos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBarbers();
  }, [loadBarbers]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>Barberos</ThemedText>
          <ThemedText style={styles.subtitle}>Equipo visible desde el panel web y disponible para el flujo de reservas.</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Barberos" value={String(barbers.length)} />
          <SummaryCard label="Perfiles" value={String(barbers.filter((barber) => Boolean(barber.descripcion)).length)} accent />
          <SummaryCard label="Especialidades" value={String(barbers.filter((barber) => Boolean(barber.especialidades)).length)} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Equipo</ThemedText>
            <Pressable onPress={loadBarbers}>
              <ThemedText style={styles.refresh}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
              <ThemedText style={styles.loaderText}>Cargando barberos...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : barbers.length ? barbers.map((barber) => (
            <View key={String(barber.id)} style={styles.barberCard}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{initials(barber.name)}</ThemedText>
              </View>
              <View style={styles.barberBody}>
                <ThemedText type="defaultSemiBold" style={styles.barberName}>{barber.name}</ThemedText>
                <ThemedText style={styles.barberMeta}>{barber.especialidades ?? 'Sin especialidades registradas'}</ThemedText>
                {barber.descripcion ? <ThemedText style={styles.barberCopy}>{barber.descripcion}</ThemedText> : null}
              </View>
            </View>
          )) : (
            <ThemedText style={styles.empty}>No hay barberos registrados.</ThemedText>
          )}
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

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'BR';
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
  barberCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#000', fontWeight: '900' },
  barberBody: { flex: 1, gap: 4 },
  barberName: { color: '#fff' },
  barberMeta: { color: Brand.gold, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  barberCopy: { color: '#e8e8e8', lineHeight: 20 },
  loader: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: { color: Brand.muted },
  error: { color: '#fca5a5', lineHeight: 22 },
  empty: { color: Brand.muted, fontStyle: 'italic' },
});
