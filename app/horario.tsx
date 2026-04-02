import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useRouter } from 'expo-router';

const WEEK_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default function ScheduleScreen() {
  const { resolvedMode } = useThemeMode();
  const palette = Colors[resolvedMode];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const router = useRouter();

  const scheduleRows = useMemo(
    () =>
      WEEK_DAYS.map((day, index) => {
        const isWorking = index !== 0;
        return {
          day,
          isWorking,
          start: isWorking ? '09:00' : '--:--',
          end: isWorking ? '18:00' : '--:--',
        };
      }),
    []
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Mi horario semanal
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Vista equivalente a la web para revisar disponibilidad por dia.
          </ThemedText>
        </View>

        <View style={styles.card}>
          {scheduleRows.map((row) => (
            <View key={row.day} style={styles.row}>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.dayName}>
                  {row.day}
                </ThemedText>
                <ThemedText style={styles.dayStatus}>{row.isWorking ? 'Laboral' : 'Descanso'}</ThemedText>
              </View>

              <View style={styles.timeBlock}>
                <ThemedText style={styles.timeText}>{row.start}</ThemedText>
                <ThemedText style={styles.timeDash}>-</ThemedText>
                <ThemedText style={styles.timeText}>{row.end}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.notice}>
          <ThemedText style={styles.noticeTitle}>Edicion de horario</ThemedText>
          <ThemedText style={styles.noticeCopy}>
            La vista ya esta alineada con la web. Para editar y guardar horario desde movil falta exponer el endpoint de horario en la API.
          </ThemedText>
        </View>

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>Volver</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 20,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: palette.muted,
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 12,
    gap: 8,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    color: palette.text,
  },
  dayStatus: {
    marginTop: 2,
    color: palette.muted,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: palette.tint,
    fontWeight: '800',
    fontSize: 13,
  },
  timeDash: {
    color: palette.muted,
  },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.goldSoftBorder,
    backgroundColor: palette.goldSoftBackground,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: palette.tint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
    fontSize: 11,
  },
  noticeCopy: {
    color: palette.text,
    lineHeight: 20,
  },
  backButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: palette.text,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
  },
  });
}
