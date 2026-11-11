import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { useGoals } from '../context/GoalsContext';
import { Goal } from '../data/mockData';
import { formatMoney } from '../utils/format';
import { useAmountInput } from '../utils/useAmountInput';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}

export function AddGoalModal({ isOpen, onClose, editGoal }: AddGoalModalProps) {
  const { addGoal, updateGoal } = useGoals();
  const isEditing = !!editGoal;
  const [title, setTitle] = useState('');
  const {
    value: targetAmount,
    setValue: setTargetAmount,
    handleChangeText,
  } = useAmountInput('0,00');

  useEffect(() => {
    if (!isOpen) return;
    if (editGoal) {
      setTitle(editGoal.title);
      setTargetAmount(formatMoney(editGoal.targetAmount));
    } else {
      setTitle('');
      setTargetAmount('0,00');
    }
  }, [isOpen, editGoal]);

  const handleConfirm = () => {
    const numVal = parseFloat(targetAmount.replace(',', '.')) || 0;
    if (isEditing && editGoal) {
      updateGoal({
        ...editGoal,
        title: title.trim() || editGoal.title,
        targetAmount: numVal,
        completed: editGoal.currentAmount >= numVal,
      });
    } else {
      addGoal({
        title: title.trim(),
        targetAmount: numVal,
        currentAmount: 0,
        completed: false,
      });
    }
    onClose();
  };

  const isDisabled = !title.trim() || targetAmount === '0,00';

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Feather name="x" size={20} color={blackAlpha(0.6)} />
            </Pressable>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Meta' : 'Nova Meta'}</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.iconRow}>
              <LinearGradient
                colors={[colors.emerald400, colors.emerald600]}
                style={styles.iconCircle}
              >
                <Feather name="target" size={36} color={colors.white} />
              </LinearGradient>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome da Meta</Text>
              <TextInput
                keyboardAppearance="light"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Viagem, Notebook, Reserva..."
                placeholderTextColor={blackAlpha(0.4)}
                style={styles.input}
              />
            </View>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Valor da Meta</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>R$ </Text>
                <TextInput
                keyboardAppearance="light"
                  value={targetAmount}
                  onChangeText={handleChangeText}
                  keyboardType="number-pad"
                  style={styles.amountInput}
                  selectTextOnFocus
                />
              </View>
            </View>

            <Pressable
              style={[styles.confirmBtn, isDisabled && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={isDisabled}
            >
              <Feather name="check" size={18} color={colors.white} />
              <Text style={styles.confirmLabel}>{isEditing ? 'Salvar Alterações' : 'Criar Meta'}</Text>
            </Pressable>
          </ScrollView>
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
    maxHeight: '90%',
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
  },
  body: {
    padding: 24,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    color: blackAlpha(0.7),
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    color: colors.text,
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
  confirmBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmLabel: {
    color: colors.white,
    fontSize: 15,
  },
});
