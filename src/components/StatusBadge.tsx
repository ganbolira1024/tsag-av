// Захиалгын төлвийг өнгөтэй шошгоор харуулна
import { StyleSheet, Text, View } from 'react-native';
import { radius } from '@/lib/theme';
import { statusInfo } from '@/lib/theme';

export default function StatusBadge({ status }: { status: string }) {
  const info = statusInfo[status] ?? statusInfo.pending;
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});
