import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { api, type InventoryMovementRecord } from '@/lib/api';

export default function MovementsScreen() {
  const { token, user } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = baseStyles;
  const router = useRouter();
  const [movements, setMovements] = useState<InventoryMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista');

  const loadMovements = useCallback(async () => {
    if (!token || !isStaff) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.inventoryMovements(token);
      setMovements(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  }, [isStaff, token]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  if (!isStaff) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
        <View style={styles.restricted}>
          <ThemedText type="title" style={[styles.restrictedTitle, { color: palette.text }]}>Acceso restringido</ThemedText>
          <ThemedText style={[styles.restrictedCopy, { color: palette.muted }]}>Movimientos es un modulo para administracion y recepcion.</ThemedText>
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
          <ThemedText type="title" style={[styles.title, { color: palette.text }]}>Movimientos</ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>Registro de entradas y salidas de inventario sincronizado con la web.</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard styles={styles} palette={palette} label="Movimientos" value={String(movements.length)} />
          <SummaryCard styles={styles} palette={palette} label="Entradas" value={String(movements.filter((movement) => (movement.tipo ?? '').includes('entrada')).length)} accent />
          <SummaryCard styles={styles} palette={palette} label="Salidas" value={String(movements.filter((movement) => (movement.tipo ?? '').includes('salida')).length)} />
        </View>

        <View style={[styles.sectionCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text }]}>Bitacora</ThemedText>
            <Pressable onPress={loadMovements}>
              <ThemedText style={styles.refresh}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={[styles.loader, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <ActivityIndicator color={palette.tint} />
              <ThemedText style={[styles.loaderText, { color: palette.muted }]}>Cargando movimientos...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={[styles.error, { color: palette.error }]}>{error}</ThemedText>
          ) : movements.length ? movements.map((movement) => (
            <View key={String(movement.id)} style={[styles.movementCard, { borderColor: palette.border, backgroundColor: palette.accent }]}>
              <View style={styles.movementHeader}>
                <View style={styles.movementTitleWrap}>
                  <ThemedText type="defaultSemiBold" style={[styles.movementTitle, { color: palette.text }]}>
                    {movement.product?.nombre ?? 'Producto'}
                  </ThemedText>
                  <ThemedText style={[styles.movementMeta, { color: palette.muted }]}>
                    Usuario: {movement.user?.name ?? 'Sistema'}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.movementType, { color: palette.tint }]}>{movement.tipo ?? 'movimiento'}</ThemedText>
              </View>

              <ThemedText style={[styles.movementMetaRow, { color: palette.tint }]}>
                Cantidad: {movement.cantidad ?? 0} · {movement.fecha ?? ''}
              </ThemedText>
              {movement.motivo ? <ThemedText style={[styles.movementCopy, { color: palette.text }]}>{movement.motivo}</ThemedText> : null}
              {movement.appointment?.id ? (
                <ThemedText style={[styles.movementLink, { color: palette.text }]}>
                  Ligado a cita #{movement.appointment.id} · {movement.appointment.client ?? 'Cliente'}
                </ThemedText>
              ) : null}
            </View>
          )) : (
            <ThemedText style={[styles.empty, { color: palette.muted }]}>No hay movimientos registrados.</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryCard({ label, value, accent = false, palette, styles }: { label: string; value: string; accent?: boolean; palette: typeof Colors.light; styles: typeof baseStyles }) {
  return (
    <View style={[styles.summaryCard, { borderColor: palette.border, backgroundColor: palette.card }, accent ? { borderColor: palette.goldSoftBorder, backgroundColor: palette.goldSoftBackground } : null]}>
      <ThemedText style={[styles.summaryLabel, { color: palette.muted }]}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, { color: palette.text }, accent ? styles.summaryValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

const baseStyles = StyleSheet.create({
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
  movementCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 6,
  },
  movementHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  movementTitleWrap: { flex: 1 },
  movementTitle: { color: '#fff' },
  movementType: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  movementMeta: { color: Brand.muted, fontSize: 11 },
  movementMetaRow: { color: Brand.gold, fontWeight: '700' },
  movementCopy: { color: '#e8e8e8', lineHeight: 20 },
  movementLink: { color: '#fff', fontSize: 11, opacity: 0.9 },
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
