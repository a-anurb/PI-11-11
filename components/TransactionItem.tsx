import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { useTransactions } from '../context/TransactionsContext';
import { Transaction } from '../data/mockData';
import { formatCurrency, formatDateShort } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';

/** Etiqueta "Receita" / "Despesa" */
export function TypeBadge({ type, small }: { type: 'income' | 'expense'; small?: boolean }) {
  const isIncome = type === 'income';
  return (
    <View
      style={[
        badgeStyles.badge,
        { backgroundColor: isIncome ? colors.emerald100 : colors.red100 },
        small && { paddingHorizontal: 6, paddingVertical: 1 },
      ]}
    >
      <Feather
        name={isIncome ? 'arrow-up-right' : 'arrow-down-right'}
        size={small ? 10 : 11}
        color={isIncome ? colors.emerald600 : colors.red600}
      />
      <Text style={[badgeStyles.text, { color: isIncome ? colors.emerald600 : colors.red600 }, small && { fontSize: 10 }]}>
        {isIncome ? 'Receita' : 'Despesa'}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  text: { fontSize: 11, fontWeight: '600' },
});

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (t: Transaction) => void;
}

export function TransactionItem({ transaction, onEdit }: TransactionItemProps) {
  const { deleteTransaction } = useTransactions();
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isIncome = transaction.type === 'income';
  const iconColor = isIncome ? colors.emerald600 : colors.red600;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteTransaction(transaction.id);
      setShowActions(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleEdit = () => {
    setShowActions(false);
    onEdit?.(transaction);
  };

  const closeSheet = () => {
    setShowActions(false);
    setConfirmDelete(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => {
          setShowActions(true);
          setConfirmDelete(false);
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: isIncome ? colors.emerald100 : colors.red100 }]}>
          <CategoryIcon icon={transaction.icon} size={22} color={iconColor} />
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>
              {transaction.title}
            </Text>
            <TypeBadge type={transaction.type} small />
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {transaction.category} • {formatDateShort(transaction.date)}
          </Text>
          {!!transaction.description && (
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
        </View>

        <Text style={{ color: isIncome ? colors.emerald600 : colors.red600 }}>
          {isIncome ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
        </Text>
      </Pressable>

      <Modal visible={showActions} animationType="slide" transparent onRequestClose={closeSheet}>
        <Pressable style={styles.overlay} onPress={closeSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryIconWrap,
                  { backgroundColor: isIncome ? colors.emerald100 : colors.red100 },
                ]}
              >
                <CategoryIcon icon={transaction.icon} size={22} color={iconColor} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {transaction.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {transaction.category} • {formatDateShort(transaction.date)}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <TypeBadge type={transaction.type} />
                </View>
              </View>
              <Text style={{ color: isIncome ? colors.emerald600 : colors.red600, fontWeight: '500' }}>
                {isIncome ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.actionBtnEdit} onPress={handleEdit}>
                <View style={[styles.actionIconWrap, { backgroundColor: colors.emerald500 }]}>
                  <Feather name="edit-2" size={18} color={colors.white} />
                </View>
                <Text style={styles.actionLabel}>Editar transação</Text>
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
                  {confirmDelete ? 'Confirmar exclusão' : 'Excluir transação'}
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
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: blackAlpha(0.4),
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: blackAlpha(0.5),
    marginTop: 2,
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
