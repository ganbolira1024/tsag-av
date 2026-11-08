// Админ хэсэг: статистик (захиалга, хэрэглэгч, орлого), төлвийн график,
// сүүлийн захиалгууд, газруудыг удирдах (нэмэх/засах/устгах).
// RLS-д is_admin() шалгадаг тул энгийн хэрэглэгч энэ өгөгдлийг авч чадахгүй.
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Booking, Business } from '@/lib/types';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { LoadingView } from '@/components/StateViews';
import { dateTime, money } from '@/lib/format';
import { colors, radius, space, statusInfo } from '@/lib/theme';

type Stats = { bookings: number; users: number; revenue: number; byStatus: Record<string, number> };

export default function Admin() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [all, users, rec, biz] = await Promise.all([
      supabase.from('bookings').select('status, services(price)'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }), // зөвхөн тоо
      supabase.from('bookings')
        .select('*, services(name, price, duration_min), businesses(name, address), staff(name)')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('businesses').select('*, categories(name, icon)').order('created_at', { ascending: false }),
    ]);

    const rows = (all.data ?? []) as any[];
    const byStatus: Record<string, number> = { pending: 0, paid: 0, cancelled: 0, completed: 0 };
    let revenue = 0;
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      if (r.status === 'paid' || r.status === 'completed') revenue += r.services?.price ?? 0;
    }
    setStats({ bookings: rows.length, users: users.count ?? 0, revenue, byStatus });
    setRecent((rec.data ?? []) as Booking[]);
    setBusinesses((biz.data ?? []) as Business[]);
  }, []);

  useFocusEffect(useCallback(() => { if (isAdmin) load(); }, [isAdmin, load]));

  if (!isAdmin) return <Redirect href="/" />; // хамгаалалттай дэлгэц
  if (!stats) return <LoadingView />;

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markCompleted(id: string) {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);
    if (error) Alert.alert('Алдаа', error.message);
    else load();
  }

  function confirmDeleteBusiness(b: Business) {
    Alert.alert(`"${b.name}"-г устгах уу?`, 'Үйлчилгээ, ажилтан, захиалга нь хамт устна.', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Устгах',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('businesses').delete().eq('id', b.id);
          if (error) Alert.alert('Алдаа', error.message);
          else load();
        },
      },
    ]);
  }

  const max = Math.max(1, ...Object.values(stats.byStatus)); // графикийн хамгийн урт багана

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Статистик картууд */}
      <View style={styles.statsRow}>
        <StatCard icon="calendar" label="Захиалга" value={String(stats.bookings)} />
        <StatCard icon="people" label="Хэрэглэгч" value={String(stats.users)} />
      </View>
      <StatCard icon="cash" label="Орлого (төлөгдсөн)" value={money(stats.revenue)} wide />

      {/* Төлвөөр — энгийн хэвтээ баганан график */}
      <Text style={styles.heading}>Захиалгын төлөв</Text>
      <View style={styles.box}>
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <View key={status} style={styles.barRow}>
            <Text style={styles.barLabel}>{statusInfo[status]?.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(count / max) * 100}%`, backgroundColor: statusInfo[status]?.color }]} />
            </View>
            <Text style={styles.barValue}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Сүүлийн захиалгууд */}
      <Text style={styles.heading}>Сүүлийн захиалгууд</Text>
      {recent.length === 0 && <Text style={styles.muted}>Захиалга алга</Text>}
      {recent.map((b) => (
        <View key={b.id} style={styles.box}>
          <View style={styles.between}>
            <Text style={styles.itemTitle}>{b.services?.name}</Text>
            <StatusBadge status={b.status} />
          </View>
          <Text style={styles.muted}>{b.businesses?.name} · {dateTime(b.start_at)}</Text>
          {(b.status === 'paid' || b.status === 'pending') && (
            <Pressable onPress={() => markCompleted(b.id)}>
              <Text style={styles.link}>Дууссан болгох</Text>
            </Pressable>
          )}
        </View>
      ))}

      {/* Газрууд — CRUD */}
      <View style={[styles.between, { marginTop: space.lg }]}>
        <Text style={[styles.heading, { marginTop: 0 }]}>Газрууд ({businesses.length})</Text>
        <Button title="+ Нэмэх" onPress={() => router.push('/admin/business-form')} style={{ height: 38 }} />
      </View>
      {businesses.map((b) => (
        <View key={b.id} style={[styles.box, styles.between]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{b.name}</Text>
            <Text style={styles.muted} numberOfLines={1}>{b.address}</Text>
          </View>
          <Ionicons name="create-outline" size={22} color={colors.primary} style={{ padding: 6 }}
            onPress={() => router.push({ pathname: '/admin/business-form', params: { id: b.id } })} />
          <Ionicons name="trash-outline" size={22} color={colors.danger} style={{ padding: 6 }}
            onPress={() => confirmDeleteBusiness(b)} />
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, wide }: { icon: any; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.stat, wide && { marginBottom: space.md }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: space.sm },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.lg, marginBottom: space.md },
  box: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.border },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  itemTitle: { fontWeight: '700', color: colors.text, fontSize: 15, flexShrink: 1 },
  muted: { color: colors.muted, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '600', marginTop: space.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  barLabel: { width: 105, color: colors.text, fontSize: 13 },
  barTrack: { flex: 1, height: 12, backgroundColor: colors.bg, borderRadius: 6, overflow: 'hidden' },
  bar: { height: 12, borderRadius: 6 },
  barValue: { width: 30, textAlign: 'right', fontWeight: '700', color: colors.text },
});
