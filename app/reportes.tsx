import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { api } from '@/lib/api';

type DashboardData = {
  data?: {
    kpis?: Record<string, number | string | null | undefined>;
  };
};

export default function ReportsScreen() {
  const { token } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Record<string, number | string | null | undefined>>({});

  const loadReportSummary = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = (await api.dashboard(token)) as DashboardData;
      setKpis(response.data?.kpis ?? {});
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReportSummary();
  }, [loadReportSummary]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>Reportes</ThemedText>
          <ThemedText style={styles.subtitle}>
            Vista movil equivalente al modulo web de reportes con resumen ejecutivo.
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={palette.tint} />
          </View>
        ) : (
          <View style={styles.grid}>
            <Kpi styles={styles} label="Citas hoy" value={String(kpis.appointments_today ?? 0)} />
            <Kpi styles={styles} label="Ingresos hoy" value={`$${Number(kpis.income_today ?? 0).toFixed(2)}`} />
            <Kpi styles={styles} label="Semana" value={`$${Number(kpis.income_week ?? 0).toFixed(2)}`} />
            <Kpi styles={styles} label="Clientes" value={String(kpis.new_clients ?? 0)} />
          </View>
        )}

        <View style={styles.notice}>
          <ThemedText style={styles.noticeTitle}>Exportaciones</ThemedText>
          <ThemedText style={styles.noticeCopy}>
            Para exportar PDF/Excel como en la web, falta exponer endpoints dedicados en la API movil.
          </ThemedText>
        </View>

        <Pressable onPress={loadReportSummary} style={styles.refreshButton}>
          <ThemedText style={styles.refreshText}>Actualizar resumen</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Kpi({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.kpiCard}>
      <ThemedText style={styles.kpiLabel}>{label}</ThemedText>
      <ThemedText style={styles.kpiValue}>{value}</ThemedText>
    </View>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 30, gap: 14 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 20,
  },
  title: { color: palette.text, fontWeight: '900', fontSize: 30 },
  subtitle: { marginTop: 8, color: palette.muted, lineHeight: 22 },
  loader: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 20,
    alignItems: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 12,
    gap: 4,
  },
  kpiLabel: { color: palette.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  kpiValue: { color: palette.text, fontWeight: '900', fontSize: 20 },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.goldSoftBorder,
    backgroundColor: palette.goldSoftBackground,
    padding: 14,
    gap: 4,
  },
  noticeTitle: { color: palette.tint, textTransform: 'uppercase', fontWeight: '900', fontSize: 11 },
  noticeCopy: { color: palette.text, lineHeight: 20 },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshText: { color: palette.text, textTransform: 'uppercase', fontWeight: '800', fontSize: 11 },
  });
}
