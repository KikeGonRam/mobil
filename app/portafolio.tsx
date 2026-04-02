import { Image, Pressable, ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { api, ApiError, type WorkRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

export default function PortfolioScreen() {
  const { token, user } = useAuth();
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const router = useRouter();
  const [works, setWorks] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const loadPortfolio = useCallback(async () => {
    if (!token || !barberId) return;

    setLoading(true);
    try {
      const response = await api.getBarberPortfolio(token, barberId);
      setWorks(response.data);
      setApiUnavailable(false);
    } catch (exception) {
      if (exception instanceof ApiError && exception.status === 404) {
        setApiUnavailable(true);
        setWorks([]);
      } else {
        setApiUnavailable(false);
      Alert.alert('Error', 'No se pudo cargar el portafolio.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, barberId]);

  useEffect(() => {
    // Get barber ID from user profile
    if (user?.barber_id) {
      setBarberId(user.barber_id);
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (barberId) {
      void loadPortfolio();
    }
  }, [barberId, loadPortfolio]);

  const isBarber = user?.roles?.includes('barbero');

  if (!isBarber) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
        <View style={styles.notAllowed}>
          <ThemedText type="title" style={[styles.notAllowedTitle, { color: palette.text }]}>
            Acceso restringido
          </ThemedText>
          <ThemedText style={[styles.notAllowedCopy, { color: palette.muted }]}>
            Esta sección solo está disponible para barberos.
          </ThemedText>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { borderColor: palette.border, backgroundColor: palette.accent }]}>
            <ThemedText style={[styles.backButtonText, { color: palette.text }]}>Volver</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
        <View style={styles.loader}>
          <ActivityIndicator color={palette.tint} size="large" />
          <ThemedText style={[styles.loaderText, { color: palette.muted }]}>Cargando portafolio...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: palette.background }] }>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText type="title" style={[styles.title, { color: palette.text }]}>
            Mi portafolio
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
            Tus trabajos y realizaciones profesionales
          </ThemedText>
        </View>

        {apiUnavailable ? (
          <View style={[styles.noticeCard, { borderColor: palette.goldSoftBorder, backgroundColor: palette.goldSoftBackground }]}>
            <ThemedText style={[styles.noticeTitle, { color: palette.tint }]}>Portafolio en integracion</ThemedText>
            <ThemedText style={[styles.noticeCopy, { color: palette.text }]}>
              Esta vista ya existe en movil y web. Falta habilitar el endpoint en la API para sincronizar tus trabajos reales.
            </ThemedText>
          </View>
        ) : null}

        {works.length > 0 ? (
          <View style={styles.grid}>
            {works.map((work) => {
              const mainImage = work.images[0]?.image;
              const imageCount = work.images.length;

              return (
                <View key={String(work.id)} style={[styles.workCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
                  {mainImage ? (
                    <View style={[styles.imageContainer, { backgroundColor: palette.accent }]}>
                      <Image
                        source={{ uri: mainImage }}
                        style={styles.workImage}
                        resizeMode="cover"
                      />
                      {imageCount > 1 && (
                        <View style={styles.imageCount}>
                          <ThemedText style={styles.imageCountText}>+{imageCount - 1}</ThemedText>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.imageContainer, styles.noImage, { backgroundColor: palette.accent }]}>
                      <ThemedText style={[styles.noImageText, { color: palette.muted }]}>Sin imagen</ThemedText>
                    </View>
                  )}

                  <View style={styles.workInfo}>
                    <ThemedText type="defaultSemiBold" style={[styles.workTitle, { color: palette.text }]}>
                      {work.title}
                    </ThemedText>
                    {work.description && (
                      <ThemedText style={[styles.workDescription, { color: palette.muted }]} numberOfLines={2}>
                        {work.description}
                      </ThemedText>
                    )}
                    <ThemedText style={[styles.workDate, { color: palette.muted }]}>
                      {new Date(work.work_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>✂️</ThemedText>
            <ThemedText type="subtitle" style={[styles.emptyStateTitle, { color: palette.text }]}>
              Sin trabajos en el portafolio
            </ThemedText>
            <ThemedText style={[styles.emptyStateCopy, { color: palette.muted }]}>
              Cuando subas tus primeros trabajos, aparecerán aquí.
            </ThemedText>
            <ThemedText style={[styles.emptyStateHint, { color: palette.tint }]}>
              Usa la versión web para subir nuevos trabajos.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  grid: {
    gap: 16,
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
    fontSize: 11,
  },
  noticeCopy: {
    lineHeight: 20,
  },
  workCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  workImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  imageCount: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  workInfo: {
    padding: 14,
    gap: 6,
  },
  workTitle: {
    fontSize: 15,
  },
  workDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  workDate: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyStateTitle: {
  },
  emptyStateCopy: {
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyStateHint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
  },
  notAllowed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  notAllowedTitle: {
  },
  notAllowedCopy: {
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
  },
});
