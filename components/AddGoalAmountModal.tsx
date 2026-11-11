import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { useGoals } from '../context/GoalsContext';
import { Goal } from '../data/mockData';
import { formatCurrency } from '../utils/format';
import { useAmountInput } from '../utils/useAmountInput';

interface AddGoalAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
}

export function AddGoalAmountModal({ isOpen, onClose, goal }: AddGoalAmountModalProps) {
  const { updateGoal } = useGoals();
  const { value: amount, setValue: setAmount, handleChangeText } = useAmountInput('0,00');

  const handleConfirm = () => {
    const numVal = parseFloat(amount.replace(',', '.')) || 0;
    if (numVal <= 0) {
      onClose();
      return;
    }
    const newCurrent = goal.currentAmount + numVal;
    updateGoal({
      ...goal,
      currentAmount: newCurrent,
      completed: newCurrent >= goal.targetAmount,
    });
    setAmount('0,00');
    onClose();
  };

  const handleClose = () => {
    setAmount('0,00');
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.headerBtn}>
              <Feather name="x" size={20} color={blackAlpha(0.6)} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Adicionar a {goal.title}
            </Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.body}>
            <Text style={styles.progressText}>
              {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
            </Text>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Valor a adicionar</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>R$ </Text>
                <TextInput
                keyboardAppearance="light"
                  value={amount}
                  onChangeText={handleChangeText}
                  keyboardType="number-pad"
                  style={styles.amountInput}
                  selectTextOnFocus
                  autoFocus
                />
              </View>
            </View>

            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Feather name="check" size={18} color={colors.white} />
              <Text style={styles.confirmLabel}>Adicionar Valor</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii['3xl'],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.emerald200,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.emerald600,
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  body: {
    padding: 24,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 13,
    color: blackAlpha(0.6),
    marginBottom: 16,
  },
  amountCard: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 24,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: blackAlpha(0.6),
    textAlign: 'center',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountPrefix: {
    fontSize: 36,
    color: colors.emerald600,
  },
  amountInput: {
    fontSize: 36,
    color: colors.emerald600,
    minWidth: 140,
    textAlign: 'center',
    padding: 0,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii['2xl'],
    backgroundColor: colors.emerald500,
  },
  confirmLabel: {
    color: colors.white,
    fontSize: 15,
  },
});
