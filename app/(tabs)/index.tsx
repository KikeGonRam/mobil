import { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CopilotStep, CopilotText, useCopilot } from 'react-native-copilot';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { api, type AppointmentRecord } from '@/lib/api';
import { useResponsive } from '@/hooks/use-responsive';
import { useTour } from '@/hooks/use-tour';

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
  const { resolvedMode } = useThemeMode();
  const { isSmallPhone, isTablet, wp, spacing, fontScale } = useResponsive();
  const { canShowTour, markTourComplete } = useTour();
  const { start: startTour, stop: stopTour } = useCopilot();
  const palette = Colors[resolvedMode];
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasStartedTour = useRef(false);
  const heroRef = useRef(null);
  const appointmentsRef = useRef(null);
  const kpisRef = useRef(null);

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

  // Iniciar tour en la primera carga si es la primera vez
  useFocusEffect(
    useCallback(() => {
      if (canShowTour() && !hasStartedTour.current && !loading && dashboard) {
        hasStartedTour.current = true;
        const timer = setTimeout(() => {
          startTour();
        }, 500);
        return () => clearTimeout(timer);
      }
      return;
    }, [canShowTour, loading, dashboard, startTour])
  );

  const kpis = dashboard?.data.kpis ?? {};
  const gridColumns = isSmallPhone ? 2 : isTablet ? 4 : 2;
  const contentPadding = spacing(20);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { gap: spacing(16), padding: contentPadding }]} showsVerticalScrollIndicator={false}>
        <CopilotStep
          text={<CopilotText>Bienvenido a tu panel de control. Aquí verás toda la información de tu barbería.</CopilotText>}
          order={1}
          name="step-header"
        >
          <View ref={heroRef} style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText type="title" style={[styles.brand, { color: palette.text, fontSize: fontScale(32) }]}>
              BARBER <ThemedText type="title" style={styles.goldText}>PRO</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.heroTitle, { color: palette.text, fontSize: fontScale(16) }]}>
              ¡HOLA, {user?.name ? user.name.split(' ')[0].toUpperCase() : 'MAESTRO'}!
            </ThemedText>
            <View style={[styles.roleBadge, { borderColor: 'rgba(212,175,55,0.2)', backgroundColor: resolvedMode === 'dark' ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.16)' }]}>
              <View style={styles.liveIndicator} />
              <ThemedText style={[styles.roleBadgeText, { color: Brand.gold, fontSize: fontScale(10) }]}>
                {dashboard?.role === 'administrador' && 'Panel Administrativo'}
                {dashboard?.role === 'barbero' && 'Panel Profesional'}
                {dashboard?.role === 'recepcionista' && 'Panel Operativo'}
                {dashboard?.role === 'cliente' && 'Experiencia Cliente'}
                {!dashboard?.role && 'Panel de Control'}
              </ThemedText>
            </View>
          </View>
        </CopilotStep>

        <View style={[styles.userBar, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <ThemedText style={[styles.avatarText, { fontSize: fontScale(16) }]}>{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</ThemedText>
            </View>
            <View>
              <ThemedText type="defaultSemiBold" style={[styles.userName, { color: palette.text, fontSize: fontScale(15) }]}>
                {user?.name ?? 'Usuario'}
              </ThemedText>
              <ThemedText style={[styles.userEmail, { color: palette.muted, fontSize: fontScale(11) }]}>{user?.email}</ThemedText>
            </View>
          </View>
          <Pressable onPress={signOut} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={18} color={Brand.gold} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Brand.gold} />
            <ThemedText style={[styles.loaderText, { color: palette.muted, fontSize: fontScale(12) }]}>Sincronizando con el estudio...</ThemedText>
          </View>
        ) : (
          <CopilotStep
            text={<CopilotText>Aquí ves tus métricas en tiempo real: citas, ingresos, clientes y calificación.</CopilotText>}
            order={2}
            name="step-kpis"
          >
            <View ref={kpisRef} style={[styles.grid, { gap: spacing(12) }]}>
              {[1, 2, 3, 4].map((i) => {
                const metricWidth = (100 / gridColumns) - (12 * (gridColumns - 1) / gridColumns);
                const metrics = [
                  {
                    label: 'Citas hoy',
                    value: String(kpis.appointments_today ?? 0),
                    icon: 'calendar-check',
                    color: 'rgba(59,130,246,0.1)',
                    textColor: '#60a5fa',
                  },
                  {
                    label: 'Ingresos hoy',
                    value: `$${Number(kpis.income_today ?? 0).toFixed(0)}`,
                    icon: 'cash-multiple',
                    color: 'rgba(34,197,94,0.1)',
                    textColor: '#4ade80',
                  },
                  {
                    label: 'Clientes',
                    value: String(kpis.new_clients ?? 0),
                    icon: 'account-group',
                    color: 'rgba(249,115,22,0.1)',
                    textColor: '#fb923c',
                  },
                  {
                    label: 'Rating',
                    value: `${kpis.rating ?? '5.0'}`,
                    icon: 'star',
                    color: 'rgba(212,175,55,0.1)',
                    textColor: Brand.gold,
                  },
                ];
                const metric = metrics[i - 1];
                return (
                  <View key={i} style={[styles.metricCard, { borderColor: metric.color, width: `${metricWidth}%` }]}>
                    <View style={styles.metricTop}>
                      <ThemedText style={[styles.metricLabel, { fontSize: fontScale(10) }]}>{metric.label}</ThemedText>
                      <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>
                        <MaterialCommunityIcons name={metric.icon as any} size={16} color={metric.textColor} />
                      </View>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: metric.textColor, fontSize: fontScale(26) }]}>{metric.value}</ThemedText>
                  </View>
                );
              })}
            </View>
          </CopilotStep>
        )}

        <CopilotStep
          text={<CopilotText>Aquí están tus próximas citas. Haz clic para actualizar la información.</CopilotText>}
          order={3}
          name="step-appointments"
        >
          <View ref={appointmentsRef} style={[styles.sectionCard, { borderColor: palette.border, backgroundColor: palette.card, padding: contentPadding }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: palette.text, fontSize: fontScale(14) }]}>
                Próximas citas
              </ThemedText>
              <Pressable onPress={loadDashboard}>
                <ThemedText style={[styles.reload, { fontSize: fontScale(11) }]}>Actualizar</ThemedText>
              </Pressable>
            </View>

            {(dashboard?.data.next_appointments ?? []).length ? (
              (dashboard?.data.next_appointments ?? []).map((appointment) => (
                <View key={String(appointment.id ?? Math.random())} style={[styles.listItem, { borderColor: palette.border, backgroundColor: palette.accent }]}>
                  <ThemedText type="defaultSemiBold" style={[styles.listTitle, { color: palette.text, fontSize: fontScale(14) }]}>
                    {String(appointment.service?.nombre ?? 'Servicio')}
                  </ThemedText>
                  <ThemedText style={[styles.listMeta, { color: palette.muted, fontSize: fontScale(12) }]}>
                    {String(appointment.fecha ?? '')} - {String(appointment.hora_inicio ?? '')}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={[styles.emptyState, { fontSize: fontScale(13) }]}>No hay citas próximas cargadas en este perfil.</ThemedText>
            )}
          </View>
        </CopilotStep>
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
  const { fontScale } = useResponsive();
  return (
    <View style={[styles.metricCard, { borderColor: color }]}>
      <View style={styles.metricTop}>
        <ThemedText style={[styles.metricLabel, { fontSize: fontScale(10) }]}>{label}</ThemedText>
        <View style={[styles.metricIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon as any} size={16} color={textColor} />
        </View>
      </View>
      <ThemedText style={[styles.metricValue, { color: textColor, fontSize: fontScale(26) }]}>{value}</ThemedText>
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
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  brand: {
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  goldText: {
    color: Brand.gold,
  },
  heroTitle: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
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
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userBar: {
    borderRadius: 24,
    borderWidth: 1,
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
  },
  userName: {
    fontWeight: '800',
  },
  userEmail: {
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
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
    fontWeight: '800',
    flex: 1,
  },
  metricValue: {
    lineHeight: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '900',
  },
  reload: {
    color: Brand.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '800',
  },
  listItem: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  listTitle: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  listMeta: {
    fontWeight: '600',
  },
  emptyState: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
