import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { api, type ServiceRecord } from '@/lib/api';

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export default function ServicesScreen() {
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.services();
      setServices(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los servicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>Servicios</ThemedText>
          <ThemedText style={styles.subtitle}>Catalogo publico y administrativo de servicios disponibles.</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard styles={styles} label="Servicios" value={String(services.length)} />
          <SummaryCard styles={styles} label="Categorias" value={String(new Set(services.map((service) => service.categoria ?? 'General')).size)} accent />
          <SummaryCard styles={styles} label="Precio base" value={services[0]?.precio ? money.format(Number(services[0].precio)) : '$0.00'} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Catalogo</ThemedText>
            <Pressable onPress={loadServices}>
              <ThemedText style={styles.refresh}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={palette.tint} />
              <ThemedText style={styles.loaderText}>Cargando servicios...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : services.length ? services.map((service) => (
            <View key={String(service.id)} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceTitleWrap}>
                  <ThemedText type="defaultSemiBold" style={styles.serviceTitle}>{service.nombre}</ThemedText>
                  <ThemedText style={styles.serviceMeta}>{service.categoria ?? 'General'} · {service.duracion_min ?? 0} min</ThemedText>
                </View>
                <ThemedText style={styles.servicePrice}>{money.format(Number(service.precio ?? 0))}</ThemedText>
              </View>
              {service.descripcion ? <ThemedText style={styles.serviceCopy}>{service.descripcion}</ThemedText> : null}
            </View>
          )) : (
            <ThemedText style={styles.empty}>No hay servicios disponibles.</ThemedText>
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
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.accent,
    padding: 14,
    gap: 6,
  },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  serviceTitleWrap: { flex: 1 },
  serviceTitle: { color: palette.text },
  serviceMeta: { color: palette.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  servicePrice: { color: palette.tint, fontWeight: '900' },
  serviceCopy: { color: palette.text, lineHeight: 20 },
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
