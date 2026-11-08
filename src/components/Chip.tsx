// Сонгогдох "шошго" товч — ангилал, өдөр, цаг сонгоход ашиглана
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space } from '@/lib/theme';

type Props = { label: string; active?: boolean; disabled?: boolean; onPress: () => void };

export default function Chip({ label, active, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, active && styles.active, disabled && styles.disabled]}
    >
      <Text style={[styles.text, active && { color: '#fff' }, disabled && { textDecorationLine: 'line-through' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.4 },
  text: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
