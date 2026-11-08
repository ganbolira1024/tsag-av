// Миний захиалгууд (READ). RLS-ийн ачаар зөвхөн өөрийн захиалга ирнэ.
// Төлвөөр шүүх, доош татаж шинэчлэх, дэлгэц рүү буцаж ирэх бүрт шинэчлэх.
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Booking } from '@/lib/types';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import StatusBadge from '@/components/StatusBadge';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { dateTime, money } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

const filters = [
  { key: 'all', label: 'Бүгд' },
  { key: 'pending', label: 'Хүлээгдэж буй' },
  { key: 'paid', label: 'Төлөгдсөн' },
  { key: 'cancelled', label: 'Цуцлагдсан' },
];

export default function Bookings() {
  const { session } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return setLoading(false);
    // Foreign key-ээр холбоотой хүснэгтүүдээс нэрсийг нэг дор татна (JOIN)
    let q = supabase
      .from('bookings')
      .select('*, services(name, price, duration_min), businesses(name, address), staff(name)')
      .order('start_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error: err } = await q;
    if (err) setError('Ачаалж чадсангүй. Интернэтээ шалгана уу.');
    else {
      setError('');
      setItems((data ?? []) as Booking[]);
    }
    setLoading(false);
  }, [session, filter]);

  // Дэлгэц рүү буцаж ирэх бүрт (жишээ нь цуцалсны дараа) дахин ачаална
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!session) {
    return (
      <View style={styles.guest}>
        <EmptyView text="Захиалгаа харахын тулд нэвтэрнэ үү" icon="lock-closed-outline" />
        <Button title="Нэвтрэх" onPress={() => router.push('/login')} style={{ marginHorizontal: space.xl }} />
      </View>
    );
  }
  if (loading) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.filters}>
        {filters.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>
      {error ? (
        <ErrorView message={error} onRetry={onRefresh} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: space.lg, paddingTop: 0, flexGrow: 1 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<EmptyView text="Захиалга алга байна. Нүүр хуудаснаас цаг захиалаарай!" icon="calendar-outline" />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/booking/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.service}>{item.services?.name}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.business}>{item.businesses?.name}</Text>
              <Text style={styles.meta}>{dateTime(item.start_at)}  ·  {item.staff?.name ?? '—'}</Text>
              <Text style={styles.price}>{money(item.services?.price ?? 0)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  guest: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', padding: space.lg, paddingBottom: space.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  service: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  business: { color: colors.primary, marginTop: 4, fontWeight: '600' },
  meta: { color: colors.muted, marginTop: 6 },
  price: { color: colors.text, fontWeight: '700', marginTop: 6 },
});
