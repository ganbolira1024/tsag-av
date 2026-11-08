// Цаг захиалах: ажилтан → өдөр → цаг → тэмдэглэл → "Баталгаажуулах"
// bookings хүснэгтэд status='pending' мөр үүсгэнэ (CREATE).
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Business, Service, Staff } from '@/lib/types';
import Chip from '@/components/Chip';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { EmptyView, LoadingView } from '@/components/StateViews';
import { hhmm, money, nextDays, weekdays } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export default function BookScreen() {
  const { serviceId, businessId } = useLocalSearchParams<{ serviceId: string; businessId: string }>();
  const { session } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [day, setDay] = useState<Date>(nextDays(1)[0]);
  const [slot, setSlot] = useState<Date | null>(null);
  const [taken, setTaken] = useState<number[]>([]); // завгүй цагууд (millisecond)
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => nextDays(7), []);

  // 1) Үйлчилгээ, газар, энэ үйлчилгээг хийдэг ажилтнууд (staff_services N:M-ээр)
  useEffect(() => {
    (async () => {
      const [s, b, st] = await Promise.all([
        supabase.from('services').select('*').eq('id', serviceId).single(),
        supabase.from('businesses').select('*').eq('id', businessId).single(),
        supabase.from('staff_services').select('staff(id, name, title)').eq('service_id', serviceId),
      ]);
      setService(s.data as Service);
      setBusiness(b.data as Business);
      const list = ((st.data ?? []) as any[]).map((r) => r.staff).filter(Boolean) as Staff[];
      setStaffList(list);
      if (list.length > 0) setStaffId(list[0].id);
      setLoading(false);
    })();
  }, [serviceId, businessId]);

  // 2) Ажилтан эсвэл өдөр солигдох бүрт тухайн өдрийн завгүй цагийг татна
  useEffect(() => {
    if (!staffId) return;
    setSlot(null);
    const from = new Date(day);
    const to = new Date(day);
    to.setDate(to.getDate() + 1);
    supabase
      .rpc('taken_slots', { p_staff: staffId, p_from: from.toISOString(), p_to: to.toISOString() })
      .then(({ data }) => setTaken(((data ?? []) as string[]).map((t) => new Date(t).getTime())));
  }, [staffId, day]);

  // 3) Ажлын цагаас 30 минут тутамд боломжит цагуудыг үүсгэнэ
  const slots = useMemo(() => {
    if (!business || !service) return [];
    const result: Date[] = [];
    const start = new Date(day);
    start.setHours(business.open_hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(business.close_hour, 0, 0, 0);
    for (let t = start.getTime(); t + service.duration_min * 60000 <= end.getTime(); t += 30 * 60000) {
      result.push(new Date(t));
    }
    return result;
  }, [business, service, day]);

  if (!session) return <Redirect href="/login" />; // нэвтрээгүй бол оруулахгүй
  if (loading) return <LoadingView />;
  if (!service || !business) return <EmptyView text="Үйлчилгээ олдсонгүй" />;

  async function onConfirm() {
    if (!staffId) return Alert.alert('Ажилтан сонгоно уу');
    if (!slot) return Alert.alert('Цаг сонгоно уу');
    if (note.length > 200) return Alert.alert('Тэмдэглэл 200 тэмдэгтээс хэтэрсэн');

    setSaving(true);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: session!.user.id,
        business_id: businessId,
        service_id: serviceId,
        staff_id: staffId,
        start_at: slot.toISOString(),
        note: note.trim() || null,
      })
      .select('id')
      .single();
    setSaving(false);

    if (error) {
      // 23505 = unique index зөрчсөн → өөр хүн яг энэ цагийг сая авсан
      Alert.alert('Алдаа', error.code === '23505' ? 'Энэ цаг дөнгөж сая захиалагдсан байна.' : error.message);
      return;
    }
    Alert.alert('Амжилттай', 'Таны захиалга бүртгэгдлээ. Төлбөрөө төлснөөр баталгаажна.');
    router.dismissAll();
    router.push(`/booking/${data.id}`);
  }

  const now = Date.now();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{service.name}</Text>
        <Text style={styles.summaryMeta}>{business.name}</Text>
        <Text style={styles.summaryPrice}>{money(service.price)} · {service.duration_min} мин</Text>
      </View>

      <Text style={styles.label}>Ажилтан</Text>
      {staffList.length === 0 ? (
        <Text style={styles.muted}>Энэ үйлчилгээнд ажилтан оноогоогүй байна.</Text>
      ) : (
        <View style={styles.wrap}>
          {staffList.map((s) => (
            <Chip key={s.id} label={`${s.name}${s.title ? ` · ${s.title}` : ''}`} active={staffId === s.id} onPress={() => setStaffId(s.id)} />
          ))}
        </View>
      )}

      <Text style={styles.label}>Өдөр</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((d) => (
          <Chip
            key={d.toISOString()}
            label={`${weekdays[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`}
            active={d.getTime() === day.getTime()}
            onPress={() => setDay(d)}
          />
        ))}
      </ScrollView>

      <Text style={styles.label}>Цаг</Text>
      <View style={styles.wrap}>
        {slots.map((s) => {
          const isPast = s.getTime() < now;
          const isTaken = taken.includes(s.getTime());
          return (
            <Chip
              key={s.toISOString()}
              label={hhmm(s)}
              active={slot?.getTime() === s.getTime()}
              disabled={isPast || isTaken}
              onPress={() => setSlot(s)}
            />
          );
        })}
      </View>

      <Input label="Тэмдэглэл (заавал биш)" value={note} onChangeText={setNote} multiline maxLength={200}
        placeholder="Жишээ нь: богино засалт хүсч байна" style={{ minHeight: 80, textAlignVertical: 'top' }} />

      <Button title="Захиалга баталгаажуулах" onPress={onConfirm} loading={saving} disabled={!slot} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg },
  summaryTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summaryMeta: { color: '#CCFBF1', marginTop: 2 },
  summaryPrice: { color: '#fff', marginTop: space.sm, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: space.md, marginBottom: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  muted: { color: colors.muted },
});
