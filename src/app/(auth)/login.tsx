// Нэвтрэх дэлгэц: и-мэйл + нууц үг → supabase.auth.signInWithPassword
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { colors, space } from '@/lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  // Формын шалгалт: серверт явуулахаас өмнө утсан дээрээ шалгана
  function validate() {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'И-мэйл буруу байна';
    if (password.length < 6) e.password = 'Нууц үг 6-аас дээш тэмдэгт';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onLogin() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErrors({ form: 'И-мэйл эсвэл нууц үг буруу байна' });
      return;
    }
    // Амжилттай → AuthProvider session-ийг автоматаар авна, бид буцна
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Тавтай морил</Text>
        <Text style={styles.subtitle}>Цагаа хэдхэн товшилтоор захиалаарай</Text>

        <Input label="И-мэйл" value={email} onChangeText={setEmail} autoCapitalize="none"
          keyboardType="email-address" placeholder="name@mail.com" error={errors.email} />
        <Input label="Нууц үг" value={password} onChangeText={setPassword} secureTextEntry
          placeholder="••••••" error={errors.password} />

        {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

        <Button title="Нэвтрэх" onPress={onLogin} loading={loading} />

        <Link href="/forgot" style={styles.link}>Нууц үгээ мартсан уу?</Link>
        <Link href="/register" style={styles.link}>Бүртгэлгүй юу? <Text style={{ fontWeight: '700' }}>Бүртгүүлэх</Text></Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingTop: space.xl * 1.5 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: space.xl },
  formError: { color: colors.danger, marginBottom: space.md, textAlign: 'center' },
  link: { color: colors.primary, textAlign: 'center', marginTop: space.lg, fontSize: 15 },
});
