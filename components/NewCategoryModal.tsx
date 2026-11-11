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
import { blackAlpha, colors, radii } from '../constants/theme';
import { useCategories } from '../context/CategoriesContext';
import { Category, CATEGORY_COLORS, CATEGORY_ICON_CHOICES, TransactionType } from '../data/mockData';
import { CategoryIcon } from './CategoryIcon';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** tipo que vem pré-selecionado (o usuário pode trocar) */
  initialType: TransactionType;
  onCreated?: (category: Category) => void;
}

export function NewCategoryModal({ isOpen, onClose, initialType, onCreated }: NewCategoryModalProps) {
  const { categories, addCategory } = useCategories();
  const [type, setType] = useState<TransactionType>(initialType);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setName('');
    setColor(CATEGORY_COLORS[0]);
    setIcon(CATEGORY_ICON_CHOICES[0]);
    setError('');
  }, [isOpen, initialType]);

  const handleSave = () => {
    const clean = name.trim();
    if (!clean) {
      setError('Dê um nome para a categoria.');
      return;
    }
    const exists = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setError(`Já existe uma categoria de ${type === 'expense' ? 'despesa' : 'receita'} com esse nome.`);
      return;
    }
    const created = addCategory({ name: clean, type, color, icon });
    onCreated?.(created);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Feather name="x" size={20} color={blackAlpha(0.6)} />
            </Pressable>
            <Text style={styles.headerTitle}>Nova Categoria</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Esta categoria é de</Text>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setType('expense')}
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
              >
                <Feather name="trending-down" size={16} color={type === 'expense' ? colors.white : colors.red600} />
                <Text style={[styles.typeLabel, type === 'expense' && styles.typeLabelActive]}>Despesa</Text>
              </Pressable>
              <Pressable
                onPress={() => setType('income')}
                style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
              >
                <Feather name="trending-up" size={16} color={type === 'income' ? colors.white : colors.emerald600} />
                <Text style={[styles.typeLabel, type === 'income' && styles.typeLabelActive]}>Receita</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              keyboardAppearance="light"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError('');
              }}
              placeholder={type === 'expense' ? 'Ex: Academia, Streaming...' : 'Ex: Bolsa, Aluguel recebido...'}
              placeholderTextColor={blackAlpha(0.35)}
              style={styles.input}
              maxLength={24}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Cor</Text>
            <View style={styles.wrapRow}>
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                >
                  {color === c && <Feather name="check" size={14} color={colors.white} />}
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Ícone</Text>
            <View style={styles.wrapRow}>
              {CATEGORY_ICON_CHOICES.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[styles.iconChoice, icon === ic && { backgroundColor: color }]}
                >
                  <CategoryIcon icon={ic} size={18} color={icon === ic ? colors.white : blackAlpha(0.7)} />
                </Pressable>
              ))}
            </View>

            <View style={styles.preview}>
              <View style={[styles.previewIcon, { backgroundColor: color }]}>
                <CategoryIcon icon={icon} size={18} color={colors.white} />
              </View>
              <Text style={styles.previewName}>{name.trim() || 'Nova categoria'}</Text>
              <View
                style={[styles.typeBadge, { backgroundColor: type === 'expense' ? colors.red100 : colors.emerald100 }]}
              >
                <Text style={{ fontSize: 11, color: type === 'expense' ? colors.red600 : colors.emerald600 }}>
                  {type === 'expense' ? 'Despesa' : 'Receita'}
                </Text>
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Feather name="check" size={18} color={colors.white} />
              <Text style={styles.saveLabel}>Criar Categoria</Text>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.emerald600, fontSize: 16 },
  body: { padding: 20 },
  label: { fontSize: 13, color: blackAlpha(0.7), marginBottom: 8, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnExpense: { backgroundColor: colors.red500, borderColor: colors.red500 },
  typeBtnIncome: { backgroundColor: colors.emerald500, borderColor: colors.emerald500 },
  typeLabel: { color: blackAlpha(0.7) },
  typeLabelActive: { color: colors.white, fontWeight: '600' },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  error: { color: colors.red600, fontSize: 12, marginBottom: 4 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorDotSelected: { borderWidth: 2, borderColor: colors.white },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  previewIcon: { width: 36, height: 36, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  previewName: { flex: 1, color: colors.text },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii['2xl'],
    backgroundColor: colors.emerald500,
  },
  saveLabel: { color: colors.white, fontSize: 15 },
});
