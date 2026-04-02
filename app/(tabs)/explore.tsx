import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { api } from '@/lib/api';
import { useResponsive } from '@/hooks/use-responsive';

type ServiceItem = {
  id: number;
  nombre: string;
  categoria?: string;
  precio?: number;
  duracion_min?: number;
  descripcion?: string;
};

type BarberItem = {
  id: number;
  name: string;
  especialidades?: string;
  descripcion?: string;
};

export default function ExploreScreen() {
  const { token } = useAuth();
  const { resolvedMode } = useThemeMode();
  const { spacing, fontScale } = useResponsive();
  const palette = Colors[resolvedMode];
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadCatalog();
  }, []);

  async function loadCatalog() {
    setLoading(true);

    try {
      const [servicesResponse, barbersResponse] = await Promise.all([
        api.services(),
        api.barbers(),
      ]);

      setServices(servicesResponse.data as ServiceItem[]);
      setBarbers(barbersResponse.data as BarberItem[]);
    } finally {
      setLoading(false);
    }
  }

  const contentPadding = spacing(20);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, { padding: contentPadding, gap: spacing(14) }]}
        ListHeaderComponent={
          <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card, padding: contentPadding }]}>
            <ThemedText type="title" style={[styles.title, { color: palette.text, fontSize: fontScale(28) }]}>
              Catálogo
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: palette.muted, fontSize: fontScale(14) }]}>
              Los servicios y barberos se consumen directo del backend de Laravel.
            </ThemedText>

            <View style={[styles.topRow, { gap: spacing(10) }]}>
              <StatPill label="Servicios" value={services.length} fontScale={fontScale} />
              <StatPill label="Barberos" value={barbers.length} fontScale={fontScale} />
              <StatPill label="Token" value={token ? 'Activo' : 'Off'} accent={!!token} fontScale={fontScale} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
              <ThemedText style={[styles.loaderText, { color: palette.muted, fontSize: fontScale(12) }]}>Cargando catálogo...</ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.empty, { color: palette.muted, fontSize: fontScale(13) }]}>No hay servicios publicados.</ThemedText>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, padding: spacing(16) }]}>
            <View style={styles.cardHeader}>
              <ThemedText type="defaultSemiBold" style={[styles.cardTitle, { color: palette.text, fontSize: fontScale(15) }]}>
                {item.nombre}
              </ThemedText>
              <ThemedText style={[styles.price, { fontSize: fontScale(14) }]}>${Number(item.precio ?? 0).toFixed(2)}</ThemedText>
            </View>
            <ThemedText style={[styles.cardMeta, { color: palette.muted, fontSize: fontScale(11) }]}>
              {item.categoria ?? 'general'} · {item.duracion_min ?? 0} min
            </ThemedText>
            {item.descripcion ? <ThemedText style={[styles.cardCopy, { color: palette.text, fontSize: fontScale(13) }]}>{item.descripcion}</ThemedText> : null}
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.barberSection, { gap: spacing(12), marginTop: spacing(6) }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text, fontSize: fontScale(14) }]}>
              Barberos
            </ThemedText>
            {barbers.map((barber) => (
              <View key={String(barber.id)} style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, padding: spacing(16) }]}>
                <ThemedText type="defaultSemiBold" style={[styles.cardTitle, { color: palette.text, fontSize: fontScale(15) }]}>
                  {barber.name}
                </ThemedText>
                <ThemedText style={[styles.cardMeta, { color: palette.muted, fontSize: fontScale(11) }]}>{barber.especialidades ?? 'Sin especialidades'}</ThemedText>
                {barber.descripcion ? <ThemedText style={[styles.cardCopy, { color: palette.text, fontSize: fontScale(13) }]}>{barber.descripcion}</ThemedText> : null}
              </View>
            ))}
            <Pressable onPress={loadCatalog} style={styles.refreshButton}>
              <ThemedText style={[styles.refreshText, { fontSize: fontScale(12) }]}>Actualizar catálogo</ThemedText>
            </Pressable>
          </View>
        }
        refreshing={loading}
        onRefresh={loadCatalog}
      />
    </ThemedView>
  );
}

function StatPill({ label, value, accent = false, fontScale }: { label: string; value: number | string; accent?: boolean; fontScale: (size: number) => number }) {
  return (
    <View style={[styles.pill, accent ? styles.pillAccent : null]}>
      <ThemedText style={[styles.pillLabel, { fontSize: fontScale(10) }]}>{label}</ThemedText>
      <ThemedText style={[styles.pillValue, accent ? styles.pillValueAccent : null, { fontSize: fontScale(18) }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    lineHeight: 22,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillAccent: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  pillLabel: {
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillValue: {
    color: '#fff',
    marginTop: 4,
    fontWeight: '900',
  },
  pillValueAccent: {
    color: Brand.gold,
  },
  loader: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {},
  empty: {
    fontStyle: 'italic',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
  },
  price: {
    color: Brand.gold,
    fontWeight: '900',
  },
  cardMeta: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardCopy: {
    lineHeight: 20,
  },
  barberSection: {
    marginTop: 6,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshText: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
});
