import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { api, type ClientRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function ClientsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista');

  const loadClients = useCallback(async () => {
    if (!token || !isStaff) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.clients(token, { q: query, page });

      setClients(response.data);
      setMeta(response.meta);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [isStaff, page, query, token]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const notificationEnabledCount = useMemo(
    () => clients.filter((record) => Boolean(record.preferencias_notificacion?.in_app)).length,
    [clients]
  );

  if (!isStaff) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.restricted}>
          <ThemedText type="title" style={styles.restrictedTitle}>Acceso restringido</ThemedText>
          <ThemedText style={styles.restrictedCopy}>
            Clientes es un modulo para administradores y recepcion.
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
          <ThemedText type="title" style={styles.title}>Clientes</ThemedText>
          <ThemedText style={styles.subtitle}>
            Base de clientes sincronizada con el panel web y lista para soporte rapido.
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Clientes" value={String(meta.total)} />
          <SummaryCard label="Con cita" value={String(clients.reduce((sum, client) => sum + (client.appointments_count ?? 0), 0))} accent />
          <SummaryCard label="Notificaciones" value={String(notificationEnabledCount)} />
        </View>

        <View style={styles.filterCard}>
          <ThemedText style={styles.filterLabel}>Buscar cliente</ThemedText>
          <View style={styles.searchRow}>
            <TextInput
              value={queryInput}
              onChangeText={setQueryInput}
              placeholder="Nombre o email"
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
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={styles.loaderText}>Cargando clientes...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.noticeCard}>
            <ThemedText style={styles.noticeText}>{error}</ThemedText>
          </View>
        ) : clients.length ? (
          <View style={styles.list}>
            {clients.map((record) => {
              const enabledPrefs = Object.entries(record.preferencias_notificacion ?? {})
                .filter(([, enabled]) => enabled)
                .map(([key]) => key);

              return (
                <View key={String(record.id)} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <ThemedText style={styles.avatarText}>{getInitials(record.user?.name ?? 'Cliente')}</ThemedText>
                    </View>
                    <View style={styles.cardHeading}>
                      <ThemedText type="defaultSemiBold" style={styles.name}>{record.user?.name ?? 'Sin usuario'}</ThemedText>
                      <ThemedText style={styles.meta}>{record.user?.email ?? '-'}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.detailsRow}>
                      <DetailBlock label="Telefono" value={record.telefono ?? 'No registrado'} />
                      <DetailBlock
                        label="Nacimiento"
                        value={record.fecha_nacimiento ? formatDate(record.fecha_nacimiento) : 'N/A'}
                      />
                    </View>

                    <View style={styles.detailsRow}>
                      <DetailBlock label="Citas" value={String(record.appointments_count ?? 0)} accent />
                      <DetailBlock label="Registro" value={record.created_at ? formatDate(record.created_at) : 'N/A'} />
                    </View>

                    <View style={styles.badgeGroup}>
                      {enabledPrefs.length ? (
                        enabledPrefs.map((pref) => (
                          <View key={pref} style={styles.roleBadge}>
                            <ThemedText style={styles.roleBadgeText}>{pref}</ThemedText>
                          </View>
                        ))
                      ) : (
                        <ThemedText style={styles.meta}>Sin preferencias activas</ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noticeCard}>
            <ThemedText style={styles.noticeText}>No se encontraron clientes con los filtros actuales.</ThemedText>
          </View>
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

function DetailBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.detailBlock}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={[styles.detailValue, accent ? styles.detailValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CL';
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
  filterLabel: { color: Brand.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
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
  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 18,
  },
  noticeText: { color: Brand.muted, lineHeight: 22 },
  list: { gap: 10 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Brand.gold, fontWeight: '900', letterSpacing: 0.5 },
  cardHeading: { flex: 1, gap: 2 },
  name: { color: '#fff', fontSize: 16 },
  meta: { color: Brand.muted, fontSize: 12 },
  cardBody: { gap: 10 },
  detailsRow: { flexDirection: 'row', gap: 10 },
  detailBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 12,
    gap: 4,
  },
  detailLabel: { color: Brand.muted, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  detailValue: { color: '#fff', fontWeight: '800' },
  detailValueAccent: { color: Brand.gold },
  badgeGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pageButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageButtonText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  pageInfo: { color: Brand.muted, fontSize: 11 },
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