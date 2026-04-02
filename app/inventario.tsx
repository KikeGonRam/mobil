import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, type InventoryMovementRecord, type InventoryProductRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProductRecord[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.roles?.some((role) => role === 'administrador' || role === 'recepcionista');

  const loadInventory = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        api.inventoryProducts(token),
        api.inventoryMovements(token),
      ]);

      setProducts(productsResponse.data);
      setMovements(movementsResponse.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const lowStockCount = useMemo(() => products.filter((product) => product.low_stock).length, [products]);

  if (!isStaff) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.restricted}>
          <ThemedText type="title" style={styles.restrictedTitle}>Acceso restringido</ThemedText>
          <ThemedText style={styles.restrictedCopy}>
            Inventario es un modulo administrativo y de recepcion.
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
          <ThemedText type="title" style={styles.title}>Inventario</ThemedText>
          <ThemedText style={styles.subtitle}>
            Catalogo de productos y movimientos de stock, alineado al panel web.
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Productos" value={String(products.length)} />
          <SummaryCard label="Bajo stock" value={String(lowStockCount)} accent />
          <SummaryCard label="Movimientos" value={String(movements.length)} />
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={styles.loaderText}>Cargando inventario...</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Productos</ThemedText>
                <Pressable onPress={loadInventory}>
                  <ThemedText style={styles.refresh}>Actualizar</ThemedText>
                </Pressable>
              </View>

              {products.length ? products.map((product) => (
                <View key={String(product.id)} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productNameWrap}>
                      <ThemedText type="defaultSemiBold" style={styles.productName}>{product.nombre}</ThemedText>
                      <ThemedText style={styles.productMeta}>
                        {product.categoria ?? 'General'} · {product.tipo ?? 'N/A'}
                      </ThemedText>
                    </View>
                    <View style={[styles.stockBadge, product.low_stock ? styles.stockBadgeLow : null]}>
                      <ThemedText style={[styles.stockBadgeText, product.low_stock ? styles.stockBadgeTextLow : null]}>
                        {product.stock_actual ?? 0} / {product.stock_minimo ?? 0}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.productPrice}>
                    Venta: ${Number(product.precio_venta ?? 0).toFixed(2)} MXN
                  </ThemedText>
                  {product.descripcion ? <ThemedText style={styles.productCopy}>{product.descripcion}</ThemedText> : null}
                </View>
              )) : <ThemedText style={styles.empty}>No hay productos disponibles.</ThemedText>}
            </View>

            <View style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Movimientos recientes</ThemedText>
              {movements.length ? movements.map((movement) => (
                <View key={String(movement.id)} style={styles.movementCard}>
                  <View style={styles.movementHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.movementTitle}>
                      {movement.product?.nombre ?? 'Producto'}
                    </ThemedText>
                    <ThemedText style={styles.movementType}>{movement.tipo ?? 'movimiento'}</ThemedText>
                  </View>
                  <ThemedText style={styles.movementMeta}>
                    Cantidad: {movement.cantidad ?? 0} · {movement.fecha ? new Date(movement.fecha).toLocaleString('es-ES') : ''}
                  </ThemedText>
                  {movement.motivo ? <ThemedText style={styles.movementCopy}>{movement.motivo}</ThemedText> : null}
                </View>
              )) : <ThemedText style={styles.empty}>No hay movimientos registrados.</ThemedText>}
            </View>
          </>
        )}
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
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 6,
  },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  productNameWrap: { flex: 1 },
  productName: { color: '#fff' },
  productMeta: { color: Brand.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  productPrice: { color: Brand.gold, fontWeight: '800' },
  productCopy: { color: '#e8e8e8', lineHeight: 20 },
  stockBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stockBadgeLow: {
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  stockBadgeText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  stockBadgeTextLow: { color: '#fca5a5' },
  movementCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 14,
    gap: 4,
  },
  movementHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  movementTitle: { color: '#fff' },
  movementType: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  movementMeta: { color: Brand.muted, fontSize: 11 },
  movementCopy: { color: '#e9e9e9' },
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
  backButtonText: { color: '#fff', textTransform: 'uppercase', fontWeight: '800', fontSize: 11 },
});
