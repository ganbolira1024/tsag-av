// Нүүр хуудасны жагсаалтад нэг газрыг харуулах карт. Өгөгдлийг props-оор авна.
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '@/lib/theme';
import type { Business } from '@/lib/types';

export default function BusinessCard({ item, onPress }: { item: Business; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="image-outline" size={40} color={colors.primary} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.category}>
          {item.categories?.name}
        </Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.meta} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={styles.meta}>{item.open_hour}:00 – {item.close_hour}:00</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: space.lg,
    overflow: 'hidden',
    // iOS сүүдэр
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // Android сүүдэр
    elevation: 2,
  },
  image: { width: '100%', height: 150 },
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.md },
  category: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 13, color: colors.muted, flexShrink: 1 },
});
