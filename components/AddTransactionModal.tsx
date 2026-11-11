import { Feather } from '@expo/vector-icons';
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
import { CategoryIcon } from './CategoryIcon';
import { NewCategoryModal } from './NewCategoryModal';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { useCategories } from '../context/CategoriesContext';
import { useTransactions } from '../context/TransactionsContext';
import { Transaction } from '../data/mockData';
import { formatDateBR, formatMoney, toDateKey } from '../utils/format';
import { CalendarPicker } from './CalendarPicker';
import { useAmountInput } from '../utils/useAmountInput';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  editTransaction?: Transaction | null;
}

export function AddTransactionModal({ isOpen, onClose, type, editTransaction }: AddTransactionModalProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { getByType, findForTransaction, categories } = useCategories();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const isEditing = !!editTransaction;

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(type);
  const { value: amount, setValue: setAmount, handleChangeText } = useAmountInput('0,00');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editTransaction) {
      setActiveTab(editTransaction.type);
      const absVal = formatMoney(Math.abs(editTransaction.amount));
      setAmount(absVal);
      setSelectedCategory(findForTransaction(editTransaction)?.id ?? '');
      setDescription(editTransaction.description ?? '');
      setTitle(editTransaction.title);
      setDate(editTransaction.date);
    } else {
      setActiveTab(type);
      setAmount('0,00');
      setSelectedCategory('');
      setDescription('');
      setTitle('');
      setDate(toDateKey(new Date()));
    }
  }, [isOpen, editTransaction, type]);

  // Só as categorias do tipo selecionado (Despesa OU Receita)
  const visibleCategories = getByType(activeTab);

  const changeTab = (tab: 'expense' | 'income') => {
    setActiveTab(tab);
    // Se a categoria escolhida não for do novo tipo, limpa a seleção
    const current = categories.find((c) => c.id === selectedCategory);
    if (current && current.type !== tab) setSelectedCategory('');
  };


  const handleConfirm = () => {
    const numVal = parseFloat(amount.replace(',', '.')) || 0;
    const finalAmount = activeTab === 'expense' ? -numVal : numVal;
    const catObj = categories.find((c) => c.id === selectedCategory && c.type === activeTab);
    const catName = catObj ? catObj.name : '';
    const finalTitle = title.trim() || catName || 'Transação';

    if (isEditing && editTransaction) {
      updateTransaction({
        ...editTransaction,
        type: activeTab,
        amount: finalAmount,
        icon: catObj ? catObj.icon : editTransaction.icon,
        category: catName || (editTransaction.type === activeTab ? editTransaction.category : 'Outros'),
        categoryId: catObj ? catObj.id : editTransaction.type === activeTab ? editTransaction.categoryId : undefined,
        description,
        title: finalTitle,
        date,
      });
    } else {
      addTransaction({
        title: finalTitle,
        category: catName || 'Outros',
        amount: finalAmount,
        type: activeTab,
        date,
        icon: catObj ? catObj.icon : 'tag',
        categoryId: catObj?.id,
        description,
      });
    }
    onClose();
  };

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
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Transação' : 'Nova Transação'}</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => changeTab('expense')}
                style={[styles.tabBtn, activeTab === 'expense' ? styles.tabActiveExpense : styles.tabInactive]}
              >
                <Text style={activeTab === 'expense' ? styles.tabTextActive : styles.tabTextInactive}>
                  Despesa
                </Text>
              </Pressable>
              <Pressable
                onPress={() => changeTab('income')}
                style={[styles.tabBtn, activeTab === 'income' ? styles.tabActive : styles.tabInactive]}
              >
                <Text style={activeTab === 'income' ? styles.tabTextActive : styles.tabTextInactive}>
                  Receita
                </Text>
              </Pressable>
            </View>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Valor</Text>
              <View style={styles.amountRow}>
                <Text style={[styles.amountPrefix, activeTab === 'expense' && { color: colors.red600 }]}>R$ </Text>
                <TextInput
                keyboardAppearance="light"
                  value={amount}
                  onChangeText={handleChangeText}
                  keyboardType="number-pad"
                  style={[styles.amountInput, activeTab === 'expense' && { color: colors.red600 }]}
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.amountHint}>Toque no valor para digitar</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Título</Text>
              <TextInput
                keyboardAppearance="light"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Salário, Mercado, Uber..."
                placeholderTextColor={blackAlpha(0.4)}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Categoria de {activeTab === 'expense' ? 'Despesa' : 'Receita'}
                </Text>
              </View>
              <View style={styles.categoryGrid}>
                {visibleCategories.map((cat) => {
                  const selected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[styles.categoryItem, selected && styles.categoryItemSelected]}
                    >
                      <View style={[styles.categoryIconWrap, { backgroundColor: cat.color }]}>
                        <CategoryIcon icon={cat.icon} size={18} color={colors.white} />
                        {selected && (
                          <View style={styles.checkBadge}>
                            <Feather name="check" size={9} color={colors.white} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.categoryLabel} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setShowNewCategory(true)}
                  style={[styles.categoryItem, styles.categoryItemNew]}
                >
                  <View style={[styles.categoryIconWrap, styles.newIconWrap]}>
                    <Feather name="plus" size={18} color={colors.emerald600} />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={2}>
                    Nova
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Data</Text>
              <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Feather name="calendar" size={16} color={colors.emerald600} />
                <Text style={styles.dateBtnText}>
                  {date === toDateKey(new Date()) ? `Hoje • ${formatDateBR(date)}` : formatDateBR(date)}
                </Text>
                <Feather name="chevron-down" size={16} color={blackAlpha(0.5)} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                keyboardAppearance="light"
                value={description}
                onChangeText={setDescription}
                placeholder="Adicione uma descrição (opcional)"
                placeholderTextColor={blackAlpha(0.4)}
                style={styles.input}
              />
            </View>

            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Feather name="check" size={18} color={colors.white} />
              <Text style={styles.confirmLabel}>
                {isEditing ? 'Salvar Alterações' : 'Confirmar Transação'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.dateCard} onPress={(e) => e.stopPropagation()}>
              <CalendarPicker
                mode="single"
                start={date}
                onChange={(d) => {
                  if (d) setDate(d);
                  setShowDatePicker(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>

        <NewCategoryModal
          isOpen={showNewCategory}
          onClose={() => setShowNewCategory(false)}
          initialType={activeTab}
          onCreated={(cat) => {
            // Se criou do mesmo tipo da transação, já deixa selecionada
            if (cat.type === activeTab) setSelectedCategory(cat.id);
          }}
        />
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.emerald500,
    ...shadow.md,
  },
  tabActiveExpense: {
    backgroundColor: colors.red500,
    ...shadow.md,
  },
  tabInactive: {
    backgroundColor: colors.card,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabTextInactive: {
    color: blackAlpha(0.6),
  },
  amountCard: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 20,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: blackAlpha(0.6),
    textAlign: 'center',
    marginBottom: 4,
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
  amountHint: {
    fontSize: 11,
    color: blackAlpha(0.35),
    textAlign: 'center',
    marginTop: 6,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
  },
  dateBtnText: {
    flex: 1,
    color: colors.text,
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  dateCard: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryItemNew: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.emerald500,
    backgroundColor: 'transparent',
  },
  newIconWrap: {
    backgroundColor: colors.emerald100,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    width: '17%',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
  },
  categoryItemSelected: {
    backgroundColor: colors.emerald100,
    borderWidth: 2,
    borderColor: colors.emerald500,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 9,
    color: blackAlpha(0.7),
    textAlign: 'center',
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
