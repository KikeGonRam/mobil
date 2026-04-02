import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';

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

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.hero}>
            <ThemedText type="title" style={styles.title}>
              Catálogo
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Los servicios y barberos se consumen directo del backend de Laravel.
            </ThemedText>

            <View style={styles.topRow}>
              <StatPill label="Servicios" value={services.length} />
              <StatPill label="Barberos" value={barbers.length} />
              <StatPill label="Token" value={token ? 'Activo' : 'Off'} accent={!!token} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
              <ThemedText style={styles.loaderText}>Cargando catálogo...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.empty}>No hay servicios publicados.</ThemedText>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {item.nombre}
              </ThemedText>
              <ThemedText style={styles.price}>${Number(item.precio ?? 0).toFixed(2)}</ThemedText>
            </View>
            <ThemedText style={styles.cardMeta}>
              {item.categoria ?? 'general'} · {item.duracion_min ?? 0} min
            </ThemedText>
            {item.descripcion ? <ThemedText style={styles.cardCopy}>{item.descripcion}</ThemedText> : null}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.barberSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Barberos
            </ThemedText>
            {barbers.map((barber) => (
              <View key={String(barber.id)} style={styles.card}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  {barber.name}
                </ThemedText>
                <ThemedText style={styles.cardMeta}>{barber.especialidades ?? 'Sin especialidades'}</ThemedText>
                {barber.descripcion ? <ThemedText style={styles.cardCopy}>{barber.descripcion}</ThemedText> : null}
              </View>
            ))}
            <Pressable onPress={loadCatalog} style={styles.refreshButton}>
              <ThemedText style={styles.refreshText}>Actualizar catálogo</ThemedText>
            </Pressable>
          </View>
        }
        refreshing={loading}
        onRefresh={loadCatalog}
      />
    </ThemedView>
  );
}

function StatPill({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <View style={[styles.pill, accent ? styles.pillAccent : null]}>
      <ThemedText style={styles.pillLabel}>{label}</ThemedText>
      <ThemedText style={[styles.pillValue, accent ? styles.pillValueAccent : null]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: Brand.muted,
    lineHeight: 22,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
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
    fontSize: 10,
  },
  pillValue: {
    color: '#fff',
    marginTop: 4,
    fontWeight: '900',
    fontSize: 18,
  },
  pillValueAccent: {
    color: Brand.gold,
  },
  loader: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    color: Brand.muted,
  },
  empty: {
    color: Brand.muted,
    fontStyle: 'italic',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    color: '#fff',
    flex: 1,
  },
  price: {
    color: Brand.gold,
    fontWeight: '900',
  },
  cardMeta: {
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  cardCopy: {
    color: '#d7d7d7',
    lineHeight: 20,
  },
  barberSection: {
    gap: 12,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
