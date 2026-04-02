import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, ImageBackground } from 'react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeMode } from '@/contexts/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api, type BarberRecord, type ServiceRecord } from '@/lib/api';

export default function LandingScreen() {
  const { token } = useAuth();
  const { mode, cycleMode, resolvedMode } = useThemeMode();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [barbers, setBarbers] = useState<BarberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook de colores para reactividad total
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const fabScale = useSharedValue(1);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesResponse, barbersResponse] = await Promise.all([api.services(), api.barbers()]);
      setServices(servicesResponse.data.slice(0, 3));
      setBarbers(barbersResponse.data.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800).delay(100)}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.heroImage}
            imageStyle={{ opacity: resolvedMode === 'dark' ? 0.45 : 0.7, borderRadius: 28 }}
          >
            <View style={[styles.heroOverlay, { backgroundColor: resolvedMode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.2)' }]}>
              <View style={styles.heroTopRow}>
                <View style={styles.brandBadge}>
                  <ThemedText style={styles.brandBadgeText}>TRADICIÓN & VANGUARDIA</ThemedText>
                </View>
                <Pressable onPress={cycleMode} style={styles.themeButton}>
                  <MaterialCommunityIcons 
                    name={mode === 'dark' ? 'moon-waning-crescent' : mode === 'light' ? 'white-balance-sunny' : 'brightness-6'} 
                    size={14} 
                    color="#fff" 
                  />
                  <ThemedText style={styles.themeButtonText}>
                    {mode.toUpperCase()}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.heroTextContainer}>
                <ThemedText type="title" style={[styles.heroTitle, { color: resolvedMode === 'dark' ? '#fff' : '#000' }]}>
                  LA <ThemedText style={{ color: Brand.gold, fontWeight: '900' }}>EXCELENCIA</ThemedText>
                </ThemedText>
                <ThemedText style={[styles.heroSubtitle, { color: resolvedMode === 'dark' ? '#fff' : '#000' }]}>
                  en cada detalle
                </ThemedText>
                
                <ThemedText style={styles.heroCopy}>
                  Elevamos el concepto de barbería a un estudio de arte. Un espacio diseñado para el hombre que exige perfección.
                </ThemedText>
              </View>

              <View style={styles.ctaRow}>
                <Pressable
                  onPress={() => router.push(token ? '/(tabs)/reservas' : '/registro')}
                  style={styles.primaryCta}>
                  <ThemedText style={styles.primaryCtaText}>{token ? 'RESERVAR' : 'REGISTRO'}</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => router.push(token ? '/(tabs)' : '/login')}
                  style={styles.secondaryCta}>
                  <ThemedText style={[styles.secondaryCtaText, { color: resolvedMode === 'dark' ? '#fff' : '#000' }]}>{token ? 'MI PANEL' : 'ACCESO'}</ThemedText>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Servicios destacados
          </ThemedText>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
              <ThemedText style={styles.loaderText}>Cargando experiencia...</ThemedText>
            </View>
          ) : (
            services.map((service, i) => (
              <Animated.View key={String(service.id)} entering={FadeInUp.delay(500 + i * 100)} style={[styles.card, { borderColor, backgroundColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {service.nombre}
                  </ThemedText>
                  <ThemedText style={styles.cardPrice}>${Number(service.precio ?? 0).toFixed(0)}</ThemedText>
                </View>
                <ThemedText style={styles.cardMeta}>
                  {service.categoria ?? 'General'} · {service.duracion_min ?? 0} min
                </ThemedText>
              </Animated.View>
            ))
          )}
          <Pressable onPress={() => router.push('/(tabs)/explore')} style={styles.ghostButton}>
            <ThemedText style={styles.ghostButtonText}>Ver catálogo completo →</ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(600)} style={[styles.section, { borderColor, backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Nuestros Maestros
          </ThemedText>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Brand.gold} />
            </View>
          ) : (
            <View style={styles.barberGrid}>
              {barbers.map((barber, i) => (
                <Animated.View key={String(barber.id)} entering={FadeInUp.delay(700 + i * 100)} style={[styles.barberCard, { borderColor, backgroundColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>{(barber.name ?? 'B').slice(0, 2).toUpperCase()}</ThemedText>
                  </View>
                  <ThemedText style={styles.barberName}>{barber.name.split(' ')[0]}</ThemedText>
                  <ThemedText style={styles.barberMeta}>Master</ThemedText>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Urban Blade · Premium Grooming Studio</ThemedText>
        </View>
      </ScrollView>

      {/* FAB - Asistente Chatbot */}
      <Animated.View style={[styles.fabContainer, animatedFabStyle]}>
        <Pressable 
          onPressIn={() => (fabScale.value = withSpring(0.9))}
          onPressOut={() => (fabScale.value = withSpring(1))}
          style={styles.fab}>
          <MaterialCommunityIcons name="robot-outline" size={24} color="#000" />
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  heroImage: {
    minHeight: 480,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextContainer: {
    gap: 4,
    marginTop: 20,
  },
  brandBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandBadgeText: {
    color: Brand.gold,
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeButtonText: {
    color: '#fff',
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 28,
    fontWeight: '300',
    marginTop: -10,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  heroCopy: {
    lineHeight: 22,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryCta: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: Brand.gold,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Brand.gold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryCtaText: {
    color: '#000',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 2,
  },
  secondaryCta: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryCtaText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 2,
  },
  section: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  loader: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardPrice: {
    color: Brand.gold,
    fontWeight: '900',
    fontSize: 16,
  },
  cardMeta: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  ghostButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  ghostButtonText: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  barberGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  barberCard: {
    flex: 1,
    minWidth: 90,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    height: 56,
    width: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.gold,
    fontWeight: '900',
    fontSize: 18,
  },
  barberName: {
    fontWeight: '800',
    fontSize: 14,
  },
  barberMeta: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '800',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.gold,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
