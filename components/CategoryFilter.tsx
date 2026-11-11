import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, brand, colors, radii } from '../constants/theme';

export interface CategoryChip {
  key: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
}

interface CategoryFilterProps {
  chips: CategoryChip[];
  selected: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}

/** Quantas categorias aparecem por grupo antes de "Ver todas" */
const COLLAPSED_PER_GROUP = 6;

/**
 * Filtro de categorias em GRADE (quebra linha automaticamente):
 *  • nada fica escondido fora da tela (funciona em qualquer largura)
 *  • separado em Despesas / Receitas
 *  • com muitas categorias, mostra as primeiras e um botão "Ver todas"
 *  • categorias marcadas aparecem sempre, mesmo com a lista recolhida
 */
export function CategoryFilter({ chips, selected, onToggle, onClear }: CategoryFilterProps) {
  const [expanded, setExpanded] = useState(false);

  const groups = (['expense', 'income'] as const)
    .map((type) => ({ type, items: chips.filter((c) => c.type === type) }))
    .filter((g) => g.items.length > 0);

  const hiddenCount = groups.reduce((sum, g) => sum + Math.max(0, g.items.length - COLLAPSED_PER_GROUP), 0);
  const canCollapse = hiddenCount > 0;

  const visibleItems = (items: CategoryChip[]) => {
    if (expanded || !canCollapse) return items;
    return items.filter((c, i) => i < COLLAPSED_PER_GROUP || selected.includes(c.key));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Categorias
          {selected.length > 0 && <Text style={styles.count}>{`  ${selected.length} marcada${selected.length > 1 ? 's' : ''}`}</Text>}
        </Text>
        {selected.length > 0 ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <Feather name="x" size={13} color={brand.green} />
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>Nenhuma marcada = todas</Text>
        )}
      </View>

      {groups.map((g) => {
        const items = visibleItems(g.items);
        const isIncome = g.type === 'income';
        return (
          <View key={g.type} style={styles.group}>
            {groups.length > 1 && (
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: isIncome ? colors.emerald500 : colors.red500 }]} />
                <Text style={[styles.groupLabel, { color: isIncome ? colors.emerald600 : colors.red600 }]}>
                  {isIncome ? 'Receitas' : 'Despesas'}
                </Text>
                <Text style={styles.groupCount}>{g.items.length}</Text>
              </View>
            )}
            <View style={styles.grid}>
              {items.map((c) => {
                const on = selected.includes(c.key);
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => onToggle(c.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      on && { backgroundColor: c.color, borderColor: c.color },
                      pressed && !on && { backgroundColor: colors.gray50 },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={c.name}
                  >
                    {on ? (
                      <Feather name="check" size={13} color={colors.white} />
                    ) : (
                      <View style={[styles.dot, { backgroundColor: c.color }]} />
                    )}
                    <Text style={[styles.chipLabel, on && styles.chipLabelOn]} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      {canCollapse && (
        <Pressable onPress={() => setExpanded((e) => !e)} style={styles.moreBtn}>
          <Text style={styles.moreText}>
            {expanded ? 'Mostrar menos' : `Ver todas as categorias (+${hiddenCount})`}
          </Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={brand.green} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  count: { color: brand.green, fontSize: 12, fontWeight: '600' },
  hint: { color: blackAlpha(0.4), fontSize: 11 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: brand.greenSoft,
  },
  clearText: { color: brand.green, fontSize: 12, fontWeight: '600' },
  group: { marginBottom: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  groupDot: { width: 6, height: 6, borderRadius: 3 },
  groupLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCount: { fontSize: 11, color: blackAlpha(0.35) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { color: blackAlpha(0.8), fontSize: 13, flexShrink: 1 },
  chipLabelOn: { color: colors.white, fontWeight: '600' },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: brand.greenBorder,
    backgroundColor: brand.greenSoft,
  },
  moreText: { color: brand.green, fontWeight: '600', fontSize: 13 },
});
