import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { api, type BarberRecord } from '@/lib/api';
import { useThemeMode } from '@/contexts/theme-context';

export default function BarbersScreen() {
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
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
          <SummaryCard styles={styles} label="Barberos" value={String(barbers.length)} />
          <SummaryCard styles={styles} label="Perfiles" value={String(barbers.filter((barber) => Boolean(barber.descripcion)).length)} accent />
          <SummaryCard styles={styles} label="Especialidades" value={String(barbers.filter((barber) => Boolean(barber.especialidades)).length)} />
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
              <ActivityIndicator color={palette.tint} />
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

function SummaryCard({ label, value, accent = false, styles }: { label: string; value: string; accent?: boolean; styles: ReturnType<typeof createStyles> }) {
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
    borderColor: palette.goldSoftBorder,
    backgroundColor: palette.goldSoftBackground,
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
  barberCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.accent,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: palette.background, fontWeight: '900' },
  barberBody: { flex: 1, gap: 4 },
  barberName: { color: palette.text },
  barberMeta: { color: palette.tint, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  barberCopy: { color: palette.text, lineHeight: 20 },
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
  });
}
