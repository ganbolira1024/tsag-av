// Нууц үг сэргээх: Supabase и-мэйлээр сэргээх холбоос илгээнэ
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { colors, space } from '@/lib/theme';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSend() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('И-мэйл буруу байна');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    Alert.alert('Илгээлээ', 'Нууц үг сэргээх холбоосыг и-мэйл рүү тань илгээлээ.');
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Бүртгэлтэй и-мэйлээ оруулбал нууц үг сэргээх холбоос илгээнэ.</Text>
      <Input label="И-мэйл" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
      <Button title="Холбоос илгээх" onPress={onSend} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl },
  text: { color: colors.muted, fontSize: 15, marginBottom: space.lg },
});
