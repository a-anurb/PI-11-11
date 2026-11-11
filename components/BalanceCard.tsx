import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../constants/theme';
import { formatCurrency } from '../utils/format';

// Cores do card de saldo
// Gradiente do print de referência: verde-petróleo escuro (topo) → verde esmeralda (base)
const BALANCE_GRADIENT = ['#144146', '#153540', '#164146', '#115e56', '#0c8a6d'] as const;
const INCOME = {
  bg: '#e9fdf0', // verde bem claro
  iconBg: '#bbf7d0',
  icon: '#16a34a',
  label: '#166534',
  value: '#15803d',
};
const EXPENSE = {
  bg: '#fee8e8', // vermelho claro
  iconBg: '#fecaca',
  icon: '#dc2626',
  label: '#991b1b',
  value: '#dc2626',
};

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  /** Variação percentual em relação ao mês anterior. `null` quando não há
   *  dados suficientes do mês anterior para calcular (não inventamos número). */
  variation?: number | null;
}

export function BalanceCard({ balance, income, expenses, variation }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <LinearGradient
      // Verde mais claro e suave (antes: emerald500 → emerald600 → teal700)
      colors={BALANCE_GRADIENT}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name="credit-card" size={20} color={colors.white} />
          <Text style={styles.headerLabel}>Saldo Total</Text>
        </View>
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Feather name={hidden ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>

      <Text style={styles.balanceValue}>{hidden ? 'R$ ••••••' : formatCurrency(balance)}</Text>

      {variation !== null && variation !== undefined && (
        <View style={styles.variationBadge}>
          <Feather
            name={variation >= 0 ? 'arrow-up-right' : 'arrow-down-right'}
            size={12}
            color={colors.white}
          />
          <Text style={styles.variationText}>
            {variation >= 0 ? '+' : ''}
            {variation.toFixed(0)}% em relação ao mês anterior
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        {/* Receitas = verde claro (dinheiro entrando) */}
        <View style={[styles.pill, styles.pillIncome]}>
          <View style={styles.pillHeader}>
            <View style={[styles.pillIconWrap, { backgroundColor: INCOME.iconBg }]}>
              <Feather name="trending-up" size={16} color={INCOME.icon} />
            </View>
            <Text style={[styles.pillLabel, { color: INCOME.label }]}>Receitas</Text>
          </View>
          <Text style={[styles.pillValue, { color: INCOME.value }]}>
            {hidden ? '••••' : formatCurrency(income)}
          </Text>
        </View>

        {/* Despesas = vermelho (dinheiro saindo) */}
        <View style={[styles.pill, styles.pillExpense]}>
          <View style={styles.pillHeader}>
            <View style={[styles.pillIconWrap, { backgroundColor: EXPENSE.iconBg }]}>
              <Feather name="trending-down" size={16} color={EXPENSE.icon} />
            </View>
            <Text style={[styles.pillLabel, { color: EXPENSE.label }]}>Despesas</Text>
          </View>
          <Text style={[styles.pillValue, { color: EXPENSE.value }]}>
            {hidden ? '••••' : formatCurrency(expenses)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii['3xl'],
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0c3b3a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    color: colors.white,
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 38,
    color: colors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 12,
  },
  variationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginBottom: 20,
  },
  variationText: {
    color: colors.white,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  pill: {
    flex: 1,
    borderRadius: radii['2xl'],
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pillIncome: {
    backgroundColor: INCOME.bg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pillExpense: {
    backgroundColor: EXPENSE.bg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pillIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  pillValue: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '600',
  },
});
