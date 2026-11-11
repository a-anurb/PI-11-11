import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { CategoryChip, CategoryFilter } from '../../components/CategoryFilter';
import { FilterTabs } from '../../components/FilterTabs';
import {
  currentMonthPeriod,
  isInPeriod,
  Period,
  periodLabel,
  PeriodPickerModal,
  shiftPeriod,
} from '../../components/PeriodPickerModal';
import { TransactionItem } from '../../components/TransactionItem';
import { blackAlpha, colors, radii, shadow } from '../../constants/theme';
import { useCategories } from '../../context/CategoriesContext';
import { useTransactions } from '../../context/TransactionsContext';
import { Transaction } from '../../data/mockData';
import { formatCurrency } from '../../utils/format';



type SortBy = 'date' | 'category' | 'amount';

const SORT_LABELS: Record<SortBy, string> = {
  date: 'Data',
  category: 'Categoria',
  amount: 'Valor',
};

export default function Transactions() {
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortPickerOpen, setSortPickerOpen] = useState(false);

  const { categories, findForTransaction } = useCategories();
  const [period, setPeriod] = useState<Period>(currentMonthPeriod());
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  // categorias marcadas no filtro (vazio = mostrar todas)
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // chave de categoria de cada transação (id da categoria, ou nome p/ transações antigas)
  const catKeyOf = (t: Transaction) => {
    const cat = findForTransaction(t);
    return cat ? cat.id : `legacy:${t.type}:${t.category}`;
  };

  // Opções do filtro: categorias cadastradas + categorias antigas que aparecem nas transações.
  // Respeita a aba Todas/Receitas/Despesas (nunca mistura no modo Receitas/Despesas).
  const chips: CategoryChip[] = useMemo(() => {
    const list: CategoryChip[] = categories.map((c) => ({ key: c.id, name: c.name, color: c.color, type: c.type }));
    transactions.forEach((t) => {
      const key = catKeyOf(t);
      if (key.startsWith('legacy:') && !list.some((c) => c.key === key)) {
        list.push({ key, name: t.category || 'Outros', color: colors.gray400, type: t.type });
      }
    });
    const visible = list.filter((c) => filter === 'all' || c.type === filter);
    // despesas primeiro, depois receitas
    return [...visible.filter((c) => c.type === 'expense'), ...visible.filter((c) => c.type === 'income')];
  }, [categories, transactions, filter]);

  const activeSelected = selectedCats.filter((k) => chips.some((c) => c.key === k));

  const toggleCat = (key: string) => {
    setSelectedCats((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Filtros combinados: período + tipo + categorias marcadas
  const filtered = transactions.filter(
    (t) =>
      isInPeriod(t.date, period) &&
      (filter === 'all' || t.type === filter) &&
      (activeSelected.length === 0 || activeSelected.includes(catKeyOf(t)))
  );

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = Math.abs(filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'amount') return Math.abs(b.amount) - Math.abs(a.amount);
    return 0;
  });

  const handleEdit = (t: Transaction) => {
    setEditTransaction(t);
    setModalType(t.type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTransaction(null);
  };

  const sectionTitle =
    filter === 'all' ? 'Transações' : filter === 'income' ? 'Receitas' : 'Despesas';

  return (
    <LinearGradient colors={[colors.bg, colors.bgAlt]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Transações</Text>
            <Text style={styles.headerSubtitle}>Gerencie suas receitas e despesas</Text>
          </View>

          {/* Seletor de período: ‹  Setembro de 2026 ▾  › */}
          <View style={styles.periodBar}>
            {period.mode !== 'all' ? (
              <Pressable style={styles.periodArrow} onPress={() => setPeriod((p) => shiftPeriod(p, -1))} hitSlop={8}>
                <Feather name="chevron-left" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.periodArrow} />
            )}
            <Pressable style={styles.periodCenter} onPress={() => setPeriodPickerOpen(true)}>
              <Feather name="calendar" size={16} color={colors.emerald600} />
              <Text style={styles.periodLabel} numberOfLines={1}>
                {periodLabel(period)}
              </Text>
              <Feather name="chevron-down" size={16} color={blackAlpha(0.6)} />
            </Pressable>
            {period.mode !== 'all' ? (
              <Pressable style={styles.periodArrow} onPress={() => setPeriod((p) => shiftPeriod(p, 1))} hitSlop={8}>
                <Feather name="chevron-right" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.periodArrow} />
            )}
          </View>

          <FilterTabs activeFilter={filter} onFilterChange={setFilter} />

          {/* Filtro de categorias (marcar / desmarcar) — grade responsiva */}
          <CategoryFilter
            chips={chips}
            selected={activeSelected}
            onToggle={toggleCat}
            onClear={() => setSelectedCats([])}
          />

          {/* Resumo do que está sendo exibido */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: colors.emerald600 }]}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={[styles.summaryValue, { color: colors.red600 }]}>{formatCurrency(totalExpense)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalIncome - totalExpense)}</Text>
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>{sectionTitle}</Text>
            <View style={styles.sortRow}>
              <Text style={styles.sortCount}>{sorted.length}</Text>
              <Pressable style={styles.sortSelect} onPress={() => setSortPickerOpen(true)}>
                <Text style={styles.sortSelectLabel}>{SORT_LABELS[sortBy]}</Text>
                <Feather name="chevron-down" size={14} color={blackAlpha(0.6)} />
              </Pressable>
            </View>
          </View>

          <View style={styles.list}>
            {sorted.length > 0 ? (
              sorted.map((t) => <TransactionItem key={t.id} transaction={t} onEdit={handleEdit} />)
            ) : (
              <View style={styles.emptyBox}>
                <Feather name="inbox" size={28} color={blackAlpha(0.25)} />
                <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                <Text style={styles.emptySub}>Tente outro período ou desmarque categorias</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Pressable
          style={styles.fab}
          onPress={() => {
            setEditTransaction(null);
            setModalType('expense');
            setShowModal(true);
          }}
        >
          <Feather name="plus" size={30} color={colors.white} />
        </Pressable>

        <AddTransactionModal
          isOpen={showModal}
          onClose={handleCloseModal}
          type={modalType}
          editTransaction={editTransaction}
        />

        <PeriodPickerModal
          isOpen={periodPickerOpen}
          value={period}
          onClose={() => setPeriodPickerOpen(false)}
          onApply={setPeriod}
        />

        <Modal
          visible={sortPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSortPickerOpen(false)}
        >
          <Pressable style={styles.pickerOverlay} onPress={() => setSortPickerOpen(false)}>
            <View style={styles.pickerCard}>
              {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
                <Pressable
                  key={key}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSortBy(key);
                    setSortPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionLabel,
                      sortBy === key && { color: colors.emerald600, fontWeight: '600' },
                    ]}
                  >
                    {SORT_LABELS[key]}
                  </Text>
                  {sortBy === key && <Feather name="check" size={16} color={colors.emerald600} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 100,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
  },
  headerSubtitle: {
    color: blackAlpha(0.6),
    fontSize: 14,
    marginTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listHeaderTitle: {
    color: colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortCount: {
    fontSize: 14,
    color: blackAlpha(0.4),
  },
  sortSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortSelectLabel: {
    fontSize: 12,
    color: blackAlpha(0.7),
  },
  list: {
    paddingBottom: 24,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: blackAlpha(0.5),
    marginTop: 8,
  },
  emptySub: {
    color: blackAlpha(0.35),
    fontSize: 12,
    marginTop: 4,
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  periodArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  periodCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  periodLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catHeaderTitle: {
    color: colors.text,
    fontSize: 14,
  },
  catClear: {
    color: colors.emerald600,
    fontSize: 12,
  },
  catHint: {
    color: blackAlpha(0.35),
    fontSize: 11,
  },
  chipsScroll: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'flex-end',
  },
  chipWrap: {
    gap: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
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
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    color: blackAlpha(0.8),
    fontSize: 13,
  },
  chipLabelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: blackAlpha(0.5),
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  fab: {
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 8,
    width: '80%',
    ...shadow.lg,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerOptionLabel: {
    fontSize: 15,
    color: colors.text,
  },
});
