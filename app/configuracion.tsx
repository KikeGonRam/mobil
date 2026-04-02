import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export default function SettingsScreen() {
  const { mode, cycleMode } = useThemeMode();
  const [notifications, setNotifications] = useState(true);
  const [maintenancePreview, setMaintenancePreview] = useState(false);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>Configuracion</ThemedText>
          <ThemedText style={styles.subtitle}>
            Modulo movil alineado al panel web para ajustes base del sistema.
          </ThemedText>
        </View>

        <View style={styles.card}>
          <Row
            label="Tema de la aplicacion"
            value={mode}
            action={
              <Pressable onPress={cycleMode} style={styles.modeButton}>
                <ThemedText style={styles.modeButtonText}>Cambiar</ThemedText>
              </Pressable>
            }
          />
          <Row
            label="Notificaciones internas"
            value={notifications ? 'Activadas' : 'Desactivadas'}
            action={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: Brand.gold, false: '#666' }} />}
          />
          <Row
            label="Simular mantenimiento"
            value={maintenancePreview ? 'Activo' : 'Inactivo'}
            action={<Switch value={maintenancePreview} onValueChange={setMaintenancePreview} trackColor={{ true: Brand.gold, false: '#666' }} />}
          />
        </View>

        <View style={styles.notice}>
          <ThemedText style={styles.noticeTitle}>Nota tecnica</ThemedText>
          <ThemedText style={styles.noticeCopy}>
            Para guardar configuraciones globales reales como en Laravel web, falta API dedicada para settings y maintenance toggle.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Row({ label, value, action }: { label: string; value: string; action: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        <ThemedText style={styles.rowValue}>{value}</ThemedText>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bgMain },
  content: { padding: 20, paddingBottom: 30, gap: 14 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 20,
  },
  title: { color: '#fff', fontWeight: '900', fontSize: 30 },
  subtitle: { marginTop: 8, color: Brand.muted, lineHeight: 22 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 12,
    gap: 10,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rowValue: { color: Brand.muted, fontSize: 12 },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonText: { color: Brand.gold, textTransform: 'uppercase', fontWeight: '800', fontSize: 11 },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    padding: 14,
    gap: 4,
  },
  noticeTitle: { color: Brand.gold, textTransform: 'uppercase', fontWeight: '900', fontSize: 11 },
  noticeCopy: { color: '#f1f1f1', lineHeight: 20 },
});
