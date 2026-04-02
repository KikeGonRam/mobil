import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { api, type LogRecord } from '@/lib/api';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function LogsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [logNames, setLogNames] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedLogName, setSelectedLogName] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('administrador');

  const loadLogs = useCallback(async () => {
    if (!token || !isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.logs(token, { q: query, log_name: selectedLogName, page });
      setLogs(response.data);
      setLogNames(response.log_names);
      setMeta(response.meta);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los logs.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, query, selectedLogName, token]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const eventCounts = useMemo(() => {
    return logs.reduce<Record<string, number>>((accumulator, log) => {
      const event = log.event ?? 'desconocido';
      accumulator[event] = (accumulator[event] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [logs]);

  if (!isAdmin) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.restricted}>
          <ThemedText type="title" style={styles.restrictedTitle}>Acceso restringido</ThemedText>
          <ThemedText style={styles.restrictedCopy}>Logs solo está disponible para administradores.</ThemedText>
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
          <ThemedText type="title" style={styles.title}>Logs</ThemedText>
          <ThemedText style={styles.subtitle}>Actividad del sistema sincronizada desde el log de auditoría del backend.</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Eventos" value={String(logs.length)} />
          <SummaryCard label="Tipos" value={String(logNames.length)} accent />
          <SummaryCard label="Vista" value={selectedLogName || 'Todos'} />
        </View>

        <View style={styles.filterCard}>
          <ThemedText style={styles.filterLabel}>Buscar</ThemedText>
          <View style={styles.searchRow}>
            <TextInput
              value={queryInput}
              onChangeText={setQueryInput}
              placeholder="Descripción, evento o nombre"
              placeholderTextColor="#7f7f7f"
              returnKeyType="search"
              onSubmitEditing={() => {
                setPage(1);
                setQuery(queryInput.trim());
              }}
              style={styles.input}
            />
            <Pressable
              onPress={() => {
                setPage(1);
                setQuery(queryInput.trim());
              }}
              style={styles.searchButton}>
              <ThemedText style={styles.searchButtonText}>Filtrar</ThemedText>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <FilterChip label="Todos" active={!selectedLogName} onPress={() => { setPage(1); setSelectedLogName(''); }} />
            {logNames.map((name) => (
              <FilterChip key={name} label={name || 'default'} active={selectedLogName === name} onPress={() => { setPage(1); setSelectedLogName(name); }} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Creado" value={String(eventCounts.created ?? 0)} />
          <SummaryCard label="Actualizado" value={String(eventCounts.updated ?? 0)} accent />
          <SummaryCard label="Eliminado" value={String(eventCounts.deleted ?? 0)} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Bitácora</ThemedText>
            <Pressable onPress={loadLogs}>
              <ThemedText style={styles.refresh}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
              <ThemedText style={styles.loaderText}>Cargando logs...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : logs.length ? logs.map((log) => (
            <View key={String(log.id)} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logTitleWrap}>
                  <ThemedText type="defaultSemiBold" style={styles.logTitle}>{log.description ?? 'Registro de actividad'}</ThemedText>
                  <ThemedText style={styles.logMeta}>{log.log_name ?? 'default'} · {log.event ?? 'evento'}</ThemedText>
                </View>
                <View style={styles.eventBadge}>
                  <ThemedText style={styles.eventBadgeText}>{log.event ?? 'n/a'}</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.logMetaRow}>
                {log.created_at ? formatDate(log.created_at) : 'Fecha no disponible'}
              </ThemedText>

              <View style={styles.detailRow}>
                <DetailBlock label="Modelo" value={log.subject_type ?? 'N/A'} />
                <DetailBlock label="ID" value={String(log.subject_id ?? 'N/A')} accent />
              </View>

              <View style={styles.detailRow}>
                <DetailBlock label="Usuario" value={log.causer?.name ?? 'Sistema'} />
                <DetailBlock label="Email" value={log.causer?.email ?? '-'} />
              </View>
            </View>
          )) : (
            <ThemedText style={styles.empty}>No se encontraron logs con los filtros actuales.</ThemedText>
          )}

          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || meta.current_page <= 1}
              style={[styles.pageButton, meta.current_page <= 1 ? styles.pageButtonDisabled : null]}>
              <ThemedText style={styles.pageButtonText}>Anterior</ThemedText>
            </Pressable>
            <ThemedText style={styles.pageInfo}>
              Página {meta.current_page} de {meta.last_page}
            </ThemedText>
            <Pressable
              onPress={() => setPage((current) => Math.min(meta.last_page, current + 1))}
              disabled={loading || meta.current_page >= meta.last_page}
              style={[styles.pageButton, meta.current_page >= meta.last_page ? styles.pageButtonDisabled : null]}>
              <ThemedText style={styles.pageButtonText}>Siguiente</ThemedText>
            </Pressable>
          </View>
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      <ThemedText style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label || 'default'}</ThemedText>
    </Pressable>
  );
}

function DetailBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.detailBlock}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={[styles.detailValue, accent ? styles.detailValueAccent : null]}>{value}</ThemedText>
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
  filterCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 12,
  },
  filterLabel: { color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchButton: {
    borderRadius: 14,
    backgroundColor: Brand.gold,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: '#000', fontWeight: '900', textTransform: 'uppercase', fontSize: 11 },
  filterChips: { gap: 8, paddingTop: 4 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  filterChipText: { color: Brand.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  filterChipTextActive: { color: Brand.gold },
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
  logCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 8,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  logTitleWrap: { flex: 1 },
  logTitle: { color: '#fff' },
  logMeta: { color: Brand.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  eventBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eventBadgeText: { color: Brand.gold, textTransform: 'uppercase', fontWeight: '900', fontSize: 10 },
  logMetaRow: { color: Brand.gold, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 12,
    gap: 4,
  },
  detailLabel: { color: Brand.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  detailValue: { color: '#fff', fontWeight: '700' },
  detailValueAccent: { color: Brand.gold },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  pageButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageButtonDisabled: { opacity: 0.45 },
  pageButtonText: { color: '#fff', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  pageInfo: { color: Brand.muted, fontSize: 12 },
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
  backButtonText: { color: '#fff', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
});