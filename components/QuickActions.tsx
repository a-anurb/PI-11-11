import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';

interface QuickActionsProps {
  onAddGoal?: () => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export function QuickActions({ onAddGoal, onAddIncome, onAddExpense }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atalhos Rápidos</Text>

      <View style={styles.grid}>
        <Link href="/reports" asChild>
          <Pressable style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.emerald100 }]}>
              <Feather name="bar-chart-2" size={24} color={colors.emerald600} />
            </View>
            <Text style={styles.cardLabel}>Ver Relatórios</Text>
          </Pressable>
        </Link>

        <Pressable style={styles.card} onPress={onAddGoal}>
          <View style={[styles.iconWrap, { backgroundColor: colors.yellow100 }]}>
            <Feather name="target" size={24} color={colors.yellow600} />
          </View>
          <Text style={styles.cardLabel}>Adicionar Meta</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onAddIncome}>
          <View style={[styles.iconWrap, { backgroundColor: colors.emerald100 }]}>
            <Feather name="trending-up" size={24} color={colors.emerald600} />
          </View>
          <Text style={styles.cardLabel}>Adicionar Receita</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onAddExpense}>
          <View style={[styles.iconWrap, { backgroundColor: colors.red100 }]}>
            <Feather name="trending-down" size={24} color={colors.red600} />
          </View>
          <Text style={styles.cardLabel}>Adicionar Despesa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: blackAlpha(0.7),
    textAlign: 'center',
  },
});
