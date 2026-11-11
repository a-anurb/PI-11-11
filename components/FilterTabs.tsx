import { Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';

type Filter = 'all' | 'income' | 'expense';

interface FilterTabsProps {
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onFilterChange('all')}
        style={[
          styles.tab,
          activeFilter === 'all' ? { backgroundColor: colors.black, ...shadow.md } : styles.tabInactive,
        ]}
      >
        <Text style={activeFilter === 'all' ? styles.textActiveAll : styles.textInactive}>Todas</Text>
      </Pressable>

      <Pressable
        onPress={() => onFilterChange('income')}
        style={[
          styles.tab,
          activeFilter === 'income'
            ? { backgroundColor: colors.emerald600, ...shadow.md }
            : styles.tabInactive,
        ]}
      >
        <Text style={activeFilter === 'income' ? styles.textActiveWhite : styles.textInactive}>
          Receitas
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onFilterChange('expense')}
        style={[
          styles.tab,
          activeFilter === 'expense'
            ? { backgroundColor: colors.red500, ...shadow.md }
            : styles.tabInactive,
        ]}
      >
        <Text style={activeFilter === 'expense' ? styles.textActiveWhite : styles.textInactive}>
          Despesas
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  tabInactive: {
    backgroundColor: colors.card,
  },
  textActiveAll: {
    color: colors.emerald400,
  },
  textActiveWhite: {
    color: colors.white,
  },
  textInactive: {
    color: blackAlpha(0.6),
  },
});
