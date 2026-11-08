// Шошго + алдааны мессежтэй оролтын талбар (form validation харуулахад)
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, space } from '@/lib/theme';

type Props = TextInputProps & { label: string; error?: string };

export default function Input({ label, error, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.card,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
});
