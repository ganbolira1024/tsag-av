// Бүртгүүлэх дэлгэц: supabase.auth.signUp. Нэр, утсыг metadata-аар дамжуулж,
// өгөгдлийн сан дахь trigger (handle_new_user) profiles мөрийг үүсгэнэ.
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { colors, space } from '@/lib/theme';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Нэг функцээр бүх талбарыг шинэчилнэ: set('email')(text)
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  function validate() {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Нэрээ оруулна уу';
    if (!/^\d{8}$/.test(form.phone)) e.phone = 'Утасны дугаар 8 оронтой байна';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'И-мэйл буруу байна';
    if (form.password.length < 6) e.password = 'Нууц үг 6-аас дээш тэмдэгт';
    if (form.confirm !== form.password) e.confirm = 'Нууц үг таарахгүй байна';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onRegister() {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.full_name.trim(), phone: form.phone } },
    });
    setLoading(false);

    if (error) {
      setErrors({ form: error.message.includes('registered') ? 'Энэ и-мэйл бүртгэлтэй байна' : error.message });
      return;
    }
    if (!data.session) {
      // Supabase-д "Confirm email" асаалттай бол и-мэйлээ баталгаажуулах хэрэгтэй
      Alert.alert('Бүртгэл үүслээ', 'И-мэйлээ шалгаж баталгаажуулаад нэвтэрнэ үү.');
      router.replace('/login');
      return;
    }
    router.dismissAll();
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Input label="Овог нэр" value={form.full_name} onChangeText={set('full_name')} placeholder="Хулан" error={errors.full_name} />
        <Input label="Утас" value={form.phone} onChangeText={set('phone')} keyboardType="number-pad" maxLength={8} placeholder="99112233" error={errors.phone} />
        <Input label="И-мэйл" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="name@mail.com" error={errors.email} />
        <Input label="Нууц үг" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
        <Input label="Нууц үг давтах" value={form.confirm} onChangeText={set('confirm')} secureTextEntry error={errors.confirm} />
        {errors.form && <Text style={styles.formError}>{errors.form}</Text>}
        <Button title="Бүртгүүлэх" onPress={onRegister} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl },
  formError: { color: colors.danger, marginBottom: space.md, textAlign: 'center' },
});
