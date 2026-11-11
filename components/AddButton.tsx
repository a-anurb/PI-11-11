import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radii, shadow } from '../constants/theme';

interface AddButtonProps {
  onPress?: () => void;
}

export function AddButton({ onPress }: AddButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Feather name="plus" size={30} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xl,
  },
});
