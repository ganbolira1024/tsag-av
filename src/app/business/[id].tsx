// Газрын дэлгэрэнгүй: мэдээлэл, үйлчилгээний жагсаалт, дуртай болгох.
// "Захиалах" дарахад нэвтрээгүй бол нэвтрэх дэлгэц рүү шилжүүлнэ.
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Business, Service } from '@/lib/types';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { money } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    // Promise.all → хоёр хүсэлтийг зэрэг явуулна (хурдан)
    const [b, s] = await Promise.all([
      supabase.from('businesses').select('*, categories(name, icon)').eq('id', id).single(),
      supabase.from('services').select('*').eq('business_id', id).order('price'),
    ]);
    if (b.error) setError('Мэдээлэл ачаалж чадсангүй');
    else {
      setBusiness(b.data as Business);
      setServices((s.data ?? []) as Service[]);
    }
    if (session) {
      const { data } = await supabase
        .from('favorites').select('business_id')
        .eq('user_id', session.user.id).eq('business_id', id).maybeSingle();
      setIsFav(!!data);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id, session]);

  // Дуртай: favorites (N:M) хүснэгтэд мөр нэмэх / устгах
  async function toggleFav() {
    if (!session) return router.push('/login');
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('business_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: session.user.id, business_id: id });
    }
    setIsFav(!isFav);
  }

  function onBook(service: Service) {
    if (!session) return router.push('/login'); // хамгаалалттай урсгал
    router.push({ pathname: '/book/[serviceId]', params: { serviceId: service.id, businessId: id } });
  }

  if (loading) return <LoadingView />;
  if (error || !business) return <ErrorView message={error || 'Олдсонгүй'} onRetry={load} />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: business.name,
          headerRight: () => (
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={isFav ? colors.danger : colors.text} onPress={toggleFav} />
          ),
        }}
      />
      {business.image_url && <Image source={{ uri: business.image_url }} style={styles.image} />}

      <View style={styles.section}>
        <Text style={styles.category}>{business.categories?.name}</Text>
        <Text style={styles.name}>{business.name}</Text>
        {business.description ? <Text style={styles.desc}>{business.description}</Text> : null}
        <InfoRow icon="location-outline" text={business.address} />
        <InfoRow icon="call-outline" text={business.phone} />
        <InfoRow icon="time-outline" text={`${business.open_hour}:00 – ${business.close_hour}:00`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Үйлчилгээ</Text>
        {services.length === 0 && <Text style={styles.desc}>Одоогоор үйлчилгээ бүртгэгдээгүй байна.</Text>}
        {services.map((s) => (
          <View key={s.id} style={styles.service}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.serviceMeta}>{s.duration_min} мин · {money(s.price)}</Text>
            </View>
            <Pressable style={styles.bookBtn} onPress={() => onBook(s)}>
              <Text style={styles.bookText}>Захиалах</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220 },
  section: { backgroundColor: colors.card, padding: space.lg, marginBottom: space.sm },
  category: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginVertical: 4 },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: space.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  infoText: { color: colors.text, fontSize: 14 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: space.md },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceName: { fontSize: 16, fontWeight: '600', color: colors.text },
  serviceMeta: { fontSize: 14, color: colors.muted, marginTop: 2 },
  bookBtn: { backgroundColor: colors.primary, paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: radius.pill },
  bookText: { color: '#fff', fontWeight: '700' },
});
