import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { api, type ServiceRecord } from '@/lib/api';

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export default function ServicesScreen() {
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
          <SummaryCard label="Servicios" value={String(services.length)} />
          <SummaryCard label="Categorias" value={String(new Set(services.map((service) => service.categoria ?? 'General')).size)} accent />
          <SummaryCard label="Precio base" value={services[0]?.precio ? money.format(Number(services[0].precio)) : '$0.00'} />
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
              <ActivityIndicator color={Brand.gold} />
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
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 6,
  },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  serviceTitleWrap: { flex: 1 },
  serviceTitle: { color: '#fff' },
  serviceMeta: { color: Brand.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  servicePrice: { color: Brand.gold, fontWeight: '900' },
  serviceCopy: { color: '#e8e8e8', lineHeight: 20 },
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
