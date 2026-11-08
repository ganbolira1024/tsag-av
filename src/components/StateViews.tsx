// Ачаалж буй / хоосон / алдааны төлвийн нэгдсэн дэлгэцүүд
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '@/lib/theme';
import Button from './Button';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyView({ text, icon = 'file-tray-outline' }: { text: string; icon?: any }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
      {onRetry && <Button title="Дахин оролдох" variant="outline" onPress={onRetry} style={{ marginTop: space.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, minHeight: 240 },
  text: { marginTop: space.md, color: colors.muted, fontSize: 15, textAlign: 'center' },
});
