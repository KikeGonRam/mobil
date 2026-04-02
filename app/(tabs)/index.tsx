import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, type AppointmentRecord } from '@/lib/api';

type DashboardData = {
  role: string;
  data: {
    kpis?: Record<string, number | string | null | undefined>;
    next_appointments?: AppointmentRecord[];
    incomeChart?: Record<string, unknown>;
    servicesChart?: Record<string, unknown>;
    chatbotTelemetry?: Record<string, unknown>;
  };
};

export default function HomeScreen() {
  const { token, user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = (await api.dashboard(token)) as DashboardData;
      setDashboard(response);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const kpis = dashboard?.data.kpis ?? {};

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.brand}>
            BARBER <ThemedText type="title" style={styles.goldText}>PRO</ThemedText>
          </ThemedText>
          <ThemedText style={styles.heroTitle}>
            ¡HOLA, {user?.name ? user.name.split(' ')[0].toUpperCase() : 'MAESTRO'}!
          </ThemedText>
          <View style={styles.roleBadge}>
            <View style={styles.liveIndicator} />
            <ThemedText style={styles.roleBadgeText}>
              {dashboard?.role === 'administrador' && 'Panel Administrativo'}
              {dashboard?.role === 'barbero' && 'Panel Profesional'}
              {dashboard?.role === 'recepcionista' && 'Panel Operativo'}
              {dashboard?.role === 'cliente' && 'Experiencia Cliente'}
              {!dashboard?.role && 'Panel de Control'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.userBar}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</ThemedText>
            </View>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.userName}>
                {user?.name ?? 'Usuario'}
              </ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            </View>
          </View>
          <Pressable onPress={signOut} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={18} color={Brand.gold} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={styles.loaderText}>Sincronizando con el estudio...</ThemedText>
          </View>
        ) : (
          <View style={styles.grid}>
            <MetricCard 
              label="Citas hoy" 
              value={String(kpis.appointments_today ?? 0)} 
              icon="calendar-check" 
              color="rgba(59,130,246,0.1)" 
              textColor="#60a5fa"
            />
            <MetricCard 
              label="Ingresos hoy" 
              value={`$${Number(kpis.income_today ?? 0).toFixed(0)}`} 
              icon="cash-multiple" 
              color="rgba(34,197,94,0.1)" 
              textColor="#4ade80"
            />
            <MetricCard 
              label="Clientes" 
              value={String(kpis.new_clients ?? 0)} 
              icon="account-group" 
              color="rgba(249,115,22,0.1)" 
              textColor="#fb923c"
            />
            <MetricCard 
              label="Rating" 
              value={`${kpis.rating ?? '5.0'}`} 
              icon="star" 
              color="rgba(212,175,55,0.1)" 
              textColor={Brand.gold}
            />
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Próximas citas
            </ThemedText>
            <Pressable onPress={loadDashboard}>
              <ThemedText style={styles.reload}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {(dashboard?.data.next_appointments ?? []).length ? (
            (dashboard?.data.next_appointments ?? []).map((appointment) => (
              <View key={String(appointment.id ?? Math.random())} style={styles.listItem}>
                <ThemedText type="defaultSemiBold" style={styles.listTitle}>
                  {String(appointment.service?.nombre ?? 'Servicio')}
                </ThemedText>
                <ThemedText style={styles.listMeta}>
                  {String(appointment.fecha ?? '')} - {String(appointment.hora_inicio ?? '')}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.emptyState}>No hay citas próximas cargadas en este perfil.</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  color, 
  textColor 
}: { 
  label: string; 
  value: string; 
  icon: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={[styles.metricCard, { borderColor: color }]}>
      <View style={styles.metricTop}>
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
        <View style={[styles.metricIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon as any} size={16} color={textColor} />
        </View>
      </View>
      <ThemedText style={[styles.metricValue, { color: textColor }]}>{value}</ThemedText>
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
    gap: 16,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 24,
    gap: 12,
  },
  brand: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  goldText: {
    color: Brand.gold,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  roleBadgeText: {
    color: Brand.gold,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userBar: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Brand.bgAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.line,
  },
  avatarText: {
    color: Brand.gold,
    fontWeight: '900',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    color: Brand.muted,
    fontSize: 11,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    backgroundColor: 'rgba(212,175,55,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    minHeight: 160,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bgCard,
    gap: 12,
  },
  loaderText: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Brand.bgCard,
    padding: 16,
    justifyContent: 'space-between',
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '800',
    flex: 1,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 14,
    fontWeight: '900',
  },
  reload: {
    color: Brand.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  listItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 16,
    gap: 4,
  },
  listTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  listMeta: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    color: Brand.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
