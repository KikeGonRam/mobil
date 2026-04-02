import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { api, type UserRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function UsersScreen() {
  const { token, user } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('administrador');

  const loadUsers = useCallback(async () => {
    if (!token || !isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.users(token, {
        q: query,
        role: selectedRole,
        page,
      });

      setUsers(response.data);
      setRoles(response.roles);
      setMeta(response.meta);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, query, selectedRole, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const verifiedCount = useMemo(
    () => users.filter((record) => Boolean(record.email_verified_at)).length,
    [users]
  );

  if (!isAdmin) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
        <View style={styles.restricted}>
          <ThemedText type="title" style={[styles.restrictedTitle, { color: palette.text }]}>Acceso restringido</ThemedText>
          <ThemedText style={[styles.restrictedCopy, { color: palette.muted }]}>
            Usuarios es un modulo exclusivo para administradores.
          </ThemedText>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText style={[styles.backButtonText, { color: palette.text }]}>Volver</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText type="title" style={[styles.title, { color: palette.text }]}>Usuarios</ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
            Vista movil del catalogo de accesos, roles y estados de verificacion.
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard palette={palette} label="Usuarios" value={String(meta.total)} />
          <SummaryCard palette={palette} label="Verificados" value={String(verifiedCount)} accent />
          <SummaryCard palette={palette} label="Roles" value={String(roles.length)} />
        </View>

        <View style={[styles.filterCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText style={[styles.filterLabel, { color: palette.muted }]}>Buscar usuario</ThemedText>
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
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.accent, color: palette.text }]}
            />
            <Pressable
              onPress={() => {
                setPage(1);
                setQuery(queryInput.trim());
              }}
              style={[styles.searchButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <ThemedText style={[styles.searchButtonText, { color: palette.text }]}>Filtrar</ThemedText>
            </Pressable>
          </View>

          <View style={styles.roleChips}>
            <FilterChip
              palette={palette}
              label="Todos"
              active={selectedRole === ''}
              onPress={() => {
                setPage(1);
                setSelectedRole('');
              }}
            />
            {roles.map((role) => (
              <FilterChip
                palette={palette}
                key={role}
                label={role}
                active={selectedRole === role}
                onPress={() => {
                  setPage(1);
                  setSelectedRole(role);
                }}
              />
            ))}
          </View>
        </View>

        {loading ? (
          <View style={[styles.loader, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ActivityIndicator color={palette.tint} />
            <ThemedText style={[styles.loaderText, { color: palette.muted }]}>Cargando usuarios...</ThemedText>
          </View>
        ) : error ? (
          <View style={[styles.noticeCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText style={[styles.noticeText, { color: palette.muted }]}>{error}</ThemedText>
          </View>
        ) : users.length ? (
          <View style={styles.list}>
            {users.map((record) => {
              const verified = Boolean(record.email_verified_at);

              return (
                <View key={String(record.id)} style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: palette.goldSoftBackground, borderColor: palette.goldSoftBorder }]}>
                      <ThemedText style={[styles.avatarText, { color: palette.tint }]}>{getInitials(record.name)}</ThemedText>
                    </View>
                    <View style={styles.cardHeading}>
                      <ThemedText type="defaultSemiBold" style={[styles.name, { color: palette.text }]}>{record.name}</ThemedText>
                      <ThemedText style={[styles.meta, { color: palette.muted }]}>{record.email}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.badgeGroup}>
                      {record.roles.map((role) => (
                        <View key={role} style={[styles.roleBadge, { borderColor: palette.border, backgroundColor: palette.accent }]}>
                          <ThemedText style={[styles.roleBadgeText, { color: palette.text }]}>{role}</ThemedText>
                        </View>
                      ))}
                    </View>

                    <View style={styles.detailsRow}>
                      <DetailBlock palette={palette} label="Estado" value={verified ? 'Verificado' : 'Pendiente'} accent={verified} />
                      <DetailBlock
                        palette={palette}
                        label="Registro"
                        value={record.created_at ? formatDate(record.created_at) : 'N/A'}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.noticeCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText style={[styles.noticeText, { color: palette.muted }]}>No se encontraron usuarios con los filtros actuales.</ThemedText>
          </View>
        )}

        <View style={styles.paginationRow}>
          <Pressable
            onPress={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || meta.current_page <= 1}
            style={[styles.pageButton, { borderColor: palette.border, backgroundColor: palette.card }, meta.current_page <= 1 ? styles.pageButtonDisabled : null]}>
            <ThemedText style={[styles.pageButtonText, { color: palette.text }]}>Anterior</ThemedText>
          </Pressable>
          <ThemedText style={[styles.pageInfo, { color: palette.muted }]}>
            Página {meta.current_page} de {meta.last_page}
          </ThemedText>
          <Pressable
            onPress={() => setPage((current) => Math.min(meta.last_page, current + 1))}
            disabled={loading || meta.current_page >= meta.last_page}
            style={[styles.pageButton, { borderColor: palette.border, backgroundColor: palette.card }, meta.current_page >= meta.last_page ? styles.pageButtonDisabled : null]}>
            <ThemedText style={[styles.pageButtonText, { color: palette.text }]}>Siguiente</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryCard({ label, value, accent = false, palette }: { label: string; value: string; accent?: boolean; palette: typeof Colors.light }) {
  return (
    <View style={[styles.summaryCard, { borderColor: palette.border, backgroundColor: palette.card }, accent ? { borderColor: palette.goldSoftBorder, backgroundColor: palette.goldSoftBackground } : null]}>
      <ThemedText style={[styles.summaryLabel, { color: palette.muted }]}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, { color: palette.text }, accent ? styles.summaryValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

function DetailBlock({ label, value, accent = false, palette }: { label: string; value: string; accent?: boolean; palette: typeof Colors.light }) {
  return (
    <View style={[styles.detailBlock, { borderColor: palette.border, backgroundColor: palette.accent }]}>
      <ThemedText style={[styles.detailLabel, { color: palette.muted }]}>{label}</ThemedText>
      <ThemedText style={[styles.detailValue, { color: palette.text }, accent ? styles.detailValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

function FilterChip({ label, active, onPress, palette }: { label: string; active: boolean; onPress: () => void; palette: typeof Colors.light }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.accent }, active ? { borderColor: palette.goldSoftBorder, backgroundColor: palette.goldSoftBackground } : null]}>
      <ThemedText style={[styles.chipText, { color: palette.muted }, active ? { color: palette.tint } : null]}>{label}</ThemedText>
    </Pressable>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'US';
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: 'rgba(212,175,55,0.4)',
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  chipText: { color: Brand.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  chipTextActive: { color: Brand.gold },
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