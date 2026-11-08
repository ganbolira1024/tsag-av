// Профайл: нэр/утас засах (UPDATE), камер эсвэл цомгоос зураг авч
// урьдчилан харуулаад Storage руу хуулах, гарах.
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { chooseSource, uploadImage } from '@/lib/upload';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { EmptyView } from '@/components/StateViews';
import { colors, radius, space } from '@/lib/theme';

export default function Profile() {
  const { session, profile, isAdmin, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preview, setPreview] = useState<string | null>(null); // хуулахаас өмнөх зураг
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Профайл ачаалагдмагц формыг бөглөнө
  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <EmptyView text="Та зочноор үзэж байна" icon="person-circle-outline" />
        <Button title="Нэвтрэх" onPress={() => router.push('/login')} style={{ marginHorizontal: space.xl }} />
        <Button title="Бүртгүүлэх" variant="outline" onPress={() => router.push('/register')} style={{ margin: space.xl, marginTop: space.md }} />
      </View>
    );
  }

  async function onSave() {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = 'Нэрээ оруулна уу';
    if (phone && !/^\d{8}$/.test(phone)) e.phone = 'Утасны дугаар 8 оронтой';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url ?? null;
      if (preview) {
        // Storage policy: зөвхөн avatars/<өөрийн id>/ хавтас руу хуулах эрхтэй
        avatar_url = await uploadImage(preview, `avatars/${session!.user.id}/avatar.jpg`);
      }
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone || null, avatar_url })
        .eq('id', session!.user.id);
      if (error) throw error;
      setPreview(null);
      await refreshProfile();
      Alert.alert('Хадгаллаа');
    } catch (err: any) {
      Alert.alert('Алдаа', err.message ?? 'Хадгалж чадсангүй');
    } finally {
      setSaving(false);
    }
  }

  function onLogout() {
    Alert.alert('Гарах уу?', undefined, [
      { text: 'Болих', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  const avatar = preview ?? profile?.avatar_url;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => chooseSource(setPreview)}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Ionicons name="person" size={44} color={colors.primary} />
            </View>
          )}
          <View style={styles.camera}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        {preview && <Text style={styles.previewNote}>Урьдчилан харж байна — "Хадгалах" дарж хуулна</Text>}
        <Text style={styles.email}>{session.user.email}</Text>
        {isAdmin && <Text style={styles.adminTag}>АДМИН</Text>}
      </View>

      <Input label="Овог нэр" value={fullName} onChangeText={setFullName} error={errors.fullName} />
      <Input label="Утас" value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={8} error={errors.phone} />
      <Button title="Хадгалах" onPress={onSave} loading={saving} />
      <Button title="Гарах" variant="outline" onPress={onLogout} style={{ marginTop: space.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: space.xl },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  camera: {
    position: 'absolute', right: 2, bottom: 2, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  previewNote: { color: colors.accent, marginTop: space.sm, fontSize: 13 },
  email: { marginTop: space.md, color: colors.muted, fontSize: 15 },
  adminTag: {
    marginTop: space.sm, backgroundColor: colors.text, color: '#fff', fontWeight: '800', fontSize: 11,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, overflow: 'hidden',
  },
});
