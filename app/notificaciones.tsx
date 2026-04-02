import { Alert, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Brand } from '@/constants/theme';
import { api, ApiError, type NotificationRecord } from '@/lib/api';
import { useRouter } from 'expo-router';

type NotificationWithMessage = NotificationRecord & {
  message?: string;
  title?: string;
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationWithMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.getNotifications(token);
      setNotifications(response.data);
    } catch (exception) {
      if (exception instanceof ApiError && exception.status === 404) {
        // Endpoint no disponible, usar notificaciones locales
        setNotifications([]);
      } else {
        Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (!token) return;

    setMarkingRead(true);
    try {
      await api.markNotificationsRead(token);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read_at: new Date().toISOString() }))
      );
      Alert.alert('Éxito', 'Todas las notificaciones fueron marcadas como leídas.');
    } catch {
      Alert.alert('Error', 'No se pudieron marcar las notificaciones como leídas.');
    } finally {
      setMarkingRead(false);
    }
  }, [token]);

  const handleNotificationPress = useCallback((notification: NotificationWithMessage) => {
    // Navegar según el tipo de notificación
    const data = notification.data;
    
    if (data.appointment_id) {
      router.push({ pathname: '/appointments/[id]', params: { id: String(data.appointment_id) } });
    }
  }, [router]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.loader}>
          <ActivityIndicator color={Brand.gold} size="large" />
          <ThemedText style={styles.loaderText}>Cargando notificaciones...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Notificaciones
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
              : 'No tienes notificaciones sin leer'}
          </ThemedText>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markingRead}
            style={[styles.markReadButton, markingRead && styles.markReadButtonDisabled]}>
            {markingRead ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.markReadButtonText}>Marcar todas como leídas</ThemedText>
            )}
          </Pressable>
        )}

        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const title = String(notification.title ?? notification.data.title ?? 'Notificación');
            const message = String(
              notification.message ??
              notification.data.message ??
              notification.data.body ??
              'Sin contenido'
            );

            return (
              <Pressable
                key={String(notification.id)}
                onPress={() => handleNotificationPress(notification)}
                style={[
                  styles.notificationCard,
                  isUnread ? styles.notificationCardUnread : null,
                ]}>
                <View style={styles.notificationHeader}>
                  <View
                    style={[
                      styles.notificationIcon,
                      {
                        backgroundColor: isUnread
                          ? 'rgba(212,175,55,0.15)'
                          : 'rgba(176,176,176,0.1)',
                      },
                    ]}>
                    <ThemedText style={styles.notificationIconSymbol}>
                      {isUnread ? '●' : '○'}
                    </ThemedText>
                  </View>
                  <View style={styles.notificationContent}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}>
                      {title}
                    </ThemedText>
                    <ThemedText style={styles.notificationMessage}>{message}</ThemedText>
                    <ThemedText style={styles.notificationDate}>
                      {new Date(notification.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>🔔</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyStateTitle}>
              Sin notificaciones
            </ThemedText>
            <ThemedText style={styles.emptyStateCopy}>
              Cuando tengas notificaciones nuevas, aparecerán aquí.
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
    backgroundColor: Brand.bgMain,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: Brand.muted,
    marginTop: 8,
    lineHeight: 22,
  },
  markReadButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  markReadButtonDisabled: {
    opacity: 0.5,
  },
  markReadButtonText: {
    color: Brand.gold,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  notificationCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
  },
  notificationCardUnread: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.03)',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationIconSymbol: {
    fontSize: 14,
    fontWeight: '900',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 14,
  },
  notificationTitleUnread: {
    color: Brand.gold,
  },
  notificationMessage: {
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  notificationDate: {
    color: Brand.muted,
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
    color: '#fff',
  },
  emptyStateCopy: {
    color: Brand.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: Brand.muted,
  },
});
