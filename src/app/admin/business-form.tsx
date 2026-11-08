// Админ: газар нэмэх / засах (CREATE / UPDATE) + зураг хуулах.
// Засах үед үйлчилгээ, ажилтныг нэмэх/устгах ба ажилтан↔үйлчилгээ (N:M) холбох.
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { chooseSource, uploadImage } from '@/lib/upload';
import type { Category, Service, Staff } from '@/lib/types';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import { LoadingView } from '@/components/StateViews';
import { money } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

const empty = { name: '', description: '', address: '', phone: '', open_hour: '9', close_hour: '20' };

export default function BusinessForm() {
  const { id } = useLocalSearchParams<{ id?: string }>(); // id байвал засах, үгүй бол шинээр нэмэх
  const isEdit = !!id;
  const { isAdmin } = useAuth();

  const [form, setForm] = useState(empty);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Засах горимд л хэрэглэгдэнэ
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [links, setLinks] = useState<{ staff_id: string; service_id: string }[]>([]);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });
  const [newStaff, setNewStaff] = useState('');

  const set = (key: keyof typeof empty) => (v: string) => setForm({ ...form, [key]: v });

  async function loadChildren() {
    if (!id) return;
    const [s, st] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', id).order('created_at'),
      supabase.from('staff').select('id, name, title').eq('business_id', id),
    ]);
    const svc = (s.data ?? []) as Service[];
    setServices(svc);
    setStaff((st.data ?? []) as Staff[]);
    if (svc.length) {
      const { data } = await supabase.from('staff_services').select('*').in('service_id', svc.map((x) => x.id));
      setLinks(data ?? []);
    } else setLinks([]);
  }

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('id');
      setCategories(cats ?? []);
      if (id) {
        const { data } = await supabase.from('businesses').select('*').eq('id', id).single();
        if (data) {
          setForm({
            name: data.name, description: data.description ?? '', address: data.address ?? '',
            phone: data.phone ?? '', open_hour: String(data.open_hour), close_hour: String(data.close_hour),
          });
          setCategoryId(data.category_id);
          setImageUrl(data.image_url);
        }
        await loadChildren();
      }
      setLoading(false);
    })();
  }, [id]);

  if (!isAdmin) return <Redirect href="/" />;
  if (loading) return <LoadingView />;

  function validate() {
    const e: Record<string, string> = {};
    const open = Number(form.open_hour), close = Number(form.close_hour);
    if (form.name.trim().length < 2) e.name = 'Нэр оруулна уу';
    if (!categoryId) e.category = 'Ангилал сонгоно уу';
    if (form.phone && !/^\d{8}$/.test(form.phone)) e.phone = '8 оронтой дугаар';
    if (!(open >= 0 && open <= 23)) e.open_hour = '0-23';
    if (!(close >= 1 && close <= 24) || close <= open) e.close_hour = 'Нээх цагаас хойш байх ёстой';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      let image_url = imageUrl;
      if (preview) image_url = await uploadImage(preview, `businesses/${Date.now()}.jpg`);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone || null,
        open_hour: Number(form.open_hour),
        close_hour: Number(form.close_hour),
        category_id: categoryId,
        image_url,
      };
      const { data, error } = isEdit
        ? await supabase.from('businesses').update(payload).eq('id', id).select('id').single()
        : await supabase.from('businesses').insert(payload).select('id').single();
      if (error) throw error;

      if (isEdit) {
        setPreview(null);
        setImageUrl(image_url);
        Alert.alert('Хадгаллаа');
      } else {
        // Шинээр үүсгэсний дараа засах горимд шилжиж үйлчилгээ, ажилтан нэмнэ
        Alert.alert('Нэмэгдлээ', 'Одоо үйлчилгээ, ажилтнаа нэмнэ үү.');
        router.replace({ pathname: '/admin/business-form', params: { id: data.id } });
      }
    } catch (err: any) {
      Alert.alert('Алдаа', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    const price = Number(newService.price), duration = Number(newService.duration);
    if (newService.name.trim().length < 2 || !(price >= 0) || !newService.price || !(duration > 0)) {
      return Alert.alert('Үйлчилгээний нэр, үнэ, хугацааг зөв оруулна уу');
    }
    const { error } = await supabase.from('services')
      .insert({ business_id: id, name: newService.name.trim(), price, duration_min: duration });
    if (error) return Alert.alert('Алдаа', error.message);
    setNewService({ name: '', price: '', duration: '60' });
    loadChildren();
  }

  async function addStaff() {
    if (newStaff.trim().length < 2) return Alert.alert('Ажилтны нэр оруулна уу');
    const { error } = await supabase.from('staff').insert({ business_id: id, name: newStaff.trim() });
    if (error) return Alert.alert('Алдаа', error.message);
    setNewStaff('');
    loadChildren();
  }

  function confirmDelete(table: 'services' | 'staff', rowId: string, name: string) {
    Alert.alert(`"${name}"-г устгах уу?`, undefined, [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Устгах', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from(table).delete().eq('id', rowId);
          if (error) Alert.alert('Алдаа', 'Энэ үйлчилгээгээр захиалга хийгдсэн тул устгах боломжгүй.');
          else loadChildren();
        },
      },
    ]);
  }

  // Ажилтан ↔ үйлчилгээ холбоосыг асаах/унтраах (staff_services N:M)
  async function toggleLink(staffId: string, serviceId: string) {
    const exists = links.some((l) => l.staff_id === staffId && l.service_id === serviceId);
    const { error } = exists
      ? await supabase.from('staff_services').delete().eq('staff_id', staffId).eq('service_id', serviceId)
      : await supabase.from('staff_services').insert({ staff_id: staffId, service_id: serviceId });
    if (error) Alert.alert('Алдаа', error.message);
    else loadChildren();
  }

  const shownImage = preview ?? imageUrl;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isEdit ? 'Газар засах' : 'Газар нэмэх' }} />

      <Pressable onPress={() => chooseSource(setPreview)} style={styles.imageBox}>
        {shownImage ? (
          <Image source={{ uri: shownImage }} style={styles.image} />
        ) : (
          <View style={styles.imageEmpty}>
            <Ionicons name="image-outline" size={36} color={colors.muted} />
            <Text style={styles.muted}>Зураг нэмэх (камер / цомог)</Text>
          </View>
        )}
      </Pressable>
      {preview && <Text style={styles.previewNote}>Урьдчилан харж байна — "Хадгалах" дархад хуулна</Text>}

      <Input label="Нэр *" value={form.name} onChangeText={set('name')} error={errors.name} />
      <Text style={styles.label}>Ангилал *</Text>
      <View style={styles.wrap}>
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </View>
      {errors.category && <Text style={styles.error}>{errors.category}</Text>}
      <Input label="Тайлбар" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
      <Input label="Хаяг" value={form.address} onChangeText={set('address')} />
      <Input label="Утас" value={form.phone} onChangeText={set('phone')} keyboardType="number-pad" maxLength={8} error={errors.phone} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Input label="Нээх цаг" value={form.open_hour} onChangeText={set('open_hour')} keyboardType="number-pad" maxLength={2} error={errors.open_hour} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Хаах цаг" value={form.close_hour} onChangeText={set('close_hour')} keyboardType="number-pad" maxLength={2} error={errors.close_hour} />
        </View>
      </View>
      <Button title={isEdit ? 'Хадгалах' : 'Нэмэх'} onPress={onSave} loading={saving} />

      {isEdit && (
        <>
          {/* Үйлчилгээнүүд */}
          <Text style={styles.heading}>Үйлчилгээ ({services.length})</Text>
          {services.map((s) => (
            <View key={s.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{s.name}</Text>
                <Text style={styles.muted}>{money(s.price)} · {s.duration_min} мин</Text>
              </View>
              <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => confirmDelete('services', s.id, s.name)} />
            </View>
          ))}
          <View style={styles.addBox}>
            <Input label="Шинэ үйлчилгээ" value={newService.name} onChangeText={(v) => setNewService({ ...newService, name: v })} placeholder="Үс засалт" />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Input label="Үнэ (₮)" value={newService.price} onChangeText={(v) => setNewService({ ...newService, price: v })} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Хугацаа (мин)" value={newService.duration} onChangeText={(v) => setNewService({ ...newService, duration: v })} keyboardType="number-pad" />
              </View>
            </View>
            <Button title="+ Үйлчилгээ нэмэх" variant="outline" onPress={addService} />
          </View>

          {/* Ажилтнууд + аль үйлчилгээг хийдэг вэ */}
          <Text style={styles.heading}>Ажилтан ({staff.length})</Text>
          {staff.map((st) => (
            <View key={st.id} style={[styles.row, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.itemTitle}>{st.name}</Text>
                <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => confirmDelete('staff', st.id, st.name)} />
              </View>
              <Text style={[styles.muted, { marginBottom: 6 }]}>Хийдэг үйлчилгээ:</Text>
              <View style={styles.wrap}>
                {services.map((s) => (
                  <Chip key={s.id} label={s.name}
                    active={links.some((l) => l.staff_id === st.id && l.service_id === s.id)}
                    onPress={() => toggleLink(st.id, s.id)} />
                ))}
              </View>
            </View>
          ))}
          <View style={styles.addBox}>
            <Input label="Шинэ ажилтан" value={newStaff} onChangeText={setNewStaff} placeholder="Нэр" />
            <Button title="+ Ажилтан нэмэх" variant="outline" onPress={addStaff} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageBox: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: space.md },
  image: { width: '100%', height: 180 },
  imageEmpty: {
    height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.lg,
  },
  previewNote: { color: colors.accent, marginBottom: space.md, fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.danger, fontSize: 13, marginBottom: space.md },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.xl, marginBottom: space.md },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: space.md,
    borderRadius: radius.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.border,
  },
  itemTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, marginTop: 2 },
  addBox: { backgroundColor: colors.primarySoft, padding: space.md, borderRadius: radius.md, marginTop: space.sm },
});
