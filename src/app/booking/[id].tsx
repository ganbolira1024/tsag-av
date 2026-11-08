// Нэг захиалгын дэлгэрэнгүй: тэмдэглэл засах (UPDATE), цуцлах (UPDATE status),
// устгах (DELETE) — устгах/цуцлахын өмнө баталгаажуулах цонх гарна.
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import StatusBadge from '@/components/StatusBadge';
import FakeQR from '@/components/FakeQR';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { dateTime, money } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, price, duration_min), businesses(name, address), staff(name)')
      .eq('id', id)
      .single();
    setBooking(data as Booking | null);
    setNote(data?.note ?? '');
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function saveNote() {
    if (note.length > 200) return Alert.alert('200 тэмдэгтээс хэтэрсэн');
    setSaving(true);
    const { error } = await supabase.from('bookings').update({ note: note.trim() || null }).eq('id', id);
    setSaving(false);
    if (error) Alert.alert('Алдаа', error.message);
    else Alert.alert('Хадгаллаа');
  }

  function confirmCancel() {
    Alert.alert('Захиалга цуцлах уу?', 'Энэ үйлдлийг буцаах боломжгүй.', [
      { text: 'Үгүй', style: 'cancel' },
      {
        text: 'Тийм, цуцлах',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
          if (error) Alert.alert('Алдаа', error.message);
          else load();
        },
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Устгах уу?', 'Захиалгыг түүхээс бүр мөсөн устгана.', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Устгах',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('bookings').delete().eq('id', id);
          if (error) Alert.alert('Алдаа', error.message);
          else router.back();
        },
      },
    ]);
  }

  if (loading) return <LoadingView />;
  if (!booking) return <ErrorView message="Захиалга олдсонгүй" onRetry={load} />;

  const canCancel = booking.status === 'pending' && new Date(booking.start_at).getTime() > Date.now();
  const canDelete = booking.status === 'pending' || booking.status === 'cancelled';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <StatusBadge status={booking.status} />
        <Text style={styles.title}>{booking.services?.name}</Text>
        <Row label="Газар" value={booking.businesses?.name} />
        <Row label="Хаяг" value={booking.businesses?.address} />
        <Row label="Ажилтан" value={booking.staff?.name} />
        <Row label="Цаг" value={dateTime(booking.start_at)} />
        <Row label="Үргэлжлэх" value={`${booking.services?.duration_min} мин`} />
        <Row label="Үнэ" value={money(booking.services?.price ?? 0)} />
      </View>

      {booking.status === 'pending' && (
        <View style={styles.payBox}>
          <Text style={styles.payTitle}>Төлбөр төлөх</Text>
          <Text style={styles.payText}>Банкны апп-аараа QR кодыг уншуулна уу</Text>
          <FakeQR value={booking.id} size={190} />
          <Text style={styles.payAmount}>{money(booking.services?.price ?? 0)}</Text>
        </View>
      )}

      <Input label="Тэмдэглэл" value={note} onChangeText={setNote} multiline maxLength={200}
        style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Button title="Тэмдэглэл хадгалах" variant="outline" onPress={saveNote} loading={saving} />

      {canCancel && <Button title="Захиалга цуцлах" variant="danger" onPress={confirmCancel} style={{ marginTop: space.md }} />}
      {canDelete && <Button title="Түүхээс устгах" variant="outline" onPress={confirmDelete} style={{ marginTop: space.md }} />}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginVertical: space.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.muted },
  rowValue: { color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: space.md },
  payBox: { backgroundColor: colors.card, padding: space.lg, borderRadius: radius.lg, marginBottom: space.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  payTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  payText: { color: colors.muted, marginTop: 4, marginBottom: space.md, textAlign: 'center' },
  payAmount: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: space.md },
});
