import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { useGoals } from '../context/GoalsContext';
import { Goal } from '../data/mockData';
import { formatCurrency } from '../utils/format';
import { AddGoalAmountModal } from './AddGoalAmountModal';
import { AddGoalModal } from './AddGoalModal';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const { deleteGoal } = useGoals();
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [showAddAmount, setShowAddAmount] = useState(false);

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  const closeSheet = () => {
    setShowActions(false);
    setConfirmDelete(false);
  };

  const handleEdit = () => {
    closeSheet();
    setShowEditGoal(true);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteGoal(goal.id);
      closeSheet();
    } else {
      setConfirmDelete(true);
    }
  };

  const content = (
    <>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: goal.completed ? colors.emerald500 : colors.emerald100 },
          ]}
        >
          <Feather name="target" size={22} color={goal.completed ? colors.white : colors.emerald600} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={styles.subtitle}>
            {goal.completed ? 'Meta Concluída!' : `Faltam ${formatCurrency(remaining)}`}
          </Text>
        </View>
        <Pressable
          style={styles.menuBtn}
          onPress={() => {
            setShowActions(true);
            setConfirmDelete(false);
          }}
          hitSlop={8}
        >
          <Feather name="more-vertical" size={18} color={blackAlpha(0.4)} />
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{formatCurrency(goal.currentAmount)}</Text>
          <Text style={styles.progressLabel}>{formatCurrency(goal.targetAmount)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}>
            <LinearGradient
              colors={
                goal.completed
                  ? [colors.emerald500, colors.emerald600]
                  : [colors.emerald400, colors.teal400]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
        <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
      </View>

      {!goal.completed && (
        <Pressable style={styles.addBtn} onPress={() => setShowAddAmount(true)}>
          <Feather name="trending-up" size={16} color={colors.white} />
          <Text style={styles.addBtnLabel}>Adicionar Valor</Text>
        </Pressable>
      )}
    </>
  );

  return (
    <>
      {goal.completed ? (
        <LinearGradient
          colors={[colors.emerald100, colors.emerald50]}
          style={[styles.card, styles.cardCompleted]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card }]}>{content}</View>
      )}

      <Modal visible={showActions} animationType="slide" transparent onRequestClose={closeSheet}>
        <Pressable style={styles.overlay} onPress={closeSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryIconWrap,
                  { backgroundColor: goal.completed ? colors.emerald500 : colors.emerald100 },
                ]}
              >
                <Feather name="target" size={22} color={goal.completed ? colors.white : colors.emerald600} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {goal.title}
                </Text>
                <Text style={styles.subtitle}>
                  {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.actionBtnEdit} onPress={handleEdit}>
                <View style={[styles.actionIconWrap, { backgroundColor: colors.emerald500 }]}>
                  <Feather name="edit-2" size={18} color={colors.white} />
                </View>
                <Text style={styles.actionLabel}>Editar meta</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtnDelete, confirmDelete && { backgroundColor: colors.red500 }]}
                onPress={handleDelete}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: confirmDelete ? 'rgba(255,255,255,0.2)' : colors.red500 },
                  ]}
                >
                  <Feather name="trash-2" size={18} color={colors.white} />
                </View>
                <Text style={[styles.actionLabel, confirmDelete && { color: colors.white, fontWeight: '600' }]}>
                  {confirmDelete ? 'Confirmar exclusão' : 'Excluir meta'}
                </Text>
              </Pressable>

              <Pressable style={styles.actionBtnCancel} onPress={closeSheet}>
                <View style={[styles.actionIconWrap, { backgroundColor: colors.gray300 }]}>
                  <Feather name="x" size={18} color={colors.white} />
                </View>
                <Text style={styles.actionLabel}>Cancelar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AddGoalModal isOpen={showEditGoal} onClose={() => setShowEditGoal(false)} editGoal={goal} />
      <AddGoalAmountModal isOpen={showAddAmount} onClose={() => setShowAddAmount(false)} goal={goal} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii['2xl'],
    padding: 16,
    ...shadow.sm,
  },
  cardCompleted: {
    borderWidth: 2,
    borderColor: colors.emerald500,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    padding: 4,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: blackAlpha(0.5),
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: blackAlpha(0.6),
  },
  progressTrack: {
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressPercent: {
    fontSize: 12,
    color: blackAlpha(0.5),
    marginTop: 4,
    textAlign: 'right',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.xl,
    backgroundColor: colors.emerald500,
  },
  addBtnLabel: {
    color: colors.white,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: radii['2xl'],
    backgroundColor: colors.emerald50,
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: radii['2xl'],
    backgroundColor: colors.red50,
  },
  actionBtnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: radii['2xl'],
    backgroundColor: colors.gray50,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: colors.text,
  },
});
