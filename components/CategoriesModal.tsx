import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blackAlpha, colors, radii } from '../constants/theme';
import { useCategories } from '../context/CategoriesContext';
import { TransactionType } from '../data/mockData';
import { CategoryIcon } from './CategoryIcon';
import { NewCategoryModal } from './NewCategoryModal';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Lista as categorias separadas por Despesa / Receita e permite criar e excluir. */
export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { getByType, deleteCategory } = useCategories();
  const [type, setType] = useState<TransactionType>('expense');
  const [showNew, setShowNew] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setConfirmId(null);
  }, [isOpen]);

  const list = getByType(type);

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Categorias</Text>
            <Text style={styles.headerSubtitle}>Separadas por despesa e receita</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setType('expense')}
            style={[styles.tab, type === 'expense' && { backgroundColor: colors.red500 }]}
          >
            <Feather name="trending-down" size={14} color={type === 'expense' ? colors.white : colors.red600} />
            <Text style={[styles.tabLabel, type === 'expense' && styles.tabLabelActive]}>Despesas</Text>
          </Pressable>
          <Pressable
            onPress={() => setType('income')}
            style={[styles.tab, type === 'income' && { backgroundColor: colors.emerald500 }]}
          >
            <Feather name="trending-up" size={14} color={type === 'income' ? colors.white : colors.emerald600} />
            <Text style={[styles.tabLabel, type === 'income' && styles.tabLabelActive]}>Receitas</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Pressable style={styles.newBtn} onPress={() => setShowNew(true)}>
            <Feather name="plus" size={18} color={colors.emerald600} />
            <Text style={styles.newLabel}>
              Nova categoria de {type === 'expense' ? 'despesa' : 'receita'}
            </Text>
          </Pressable>

          {list.map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: c.color }]}>
                <CategoryIcon icon={c.icon} size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.sub}>{c.custom ? 'Criada por você' : 'Padrão do app'}</Text>
              </View>
              {c.custom && (
                <Pressable
                  onPress={() => {
                    if (confirmId === c.id) {
                      deleteCategory(c.id);
                      setConfirmId(null);
                    } else setConfirmId(c.id);
                  }}
                  style={[styles.deleteBtn, confirmId === c.id && { backgroundColor: colors.red500 }]}
                  hitSlop={6}
                >
                  <Feather name="trash-2" size={14} color={confirmId === c.id ? colors.white : colors.red600} />
                  {confirmId === c.id && <Text style={styles.deleteLabel}>Confirmar</Text>}
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>

        <NewCategoryModal isOpen={showNew} onClose={() => setShowNew(false)} initialType={type} onCreated={(c) => setType(c.type)} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  headerTitle: { color: colors.text, fontSize: 22 },
  headerSubtitle: { color: blackAlpha(0.5), fontSize: 12, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 4,
    marginBottom: 8,
    maxWidth: 416,
    width: '92%',
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { color: blackAlpha(0.6), fontSize: 13 },
  tabLabelActive: { color: colors.white, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40, maxWidth: 448, width: '100%', alignSelf: 'center' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.emerald500,
    backgroundColor: colors.emerald50,
    marginBottom: 12,
  },
  newLabel: { color: colors.emerald600 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { width: 38, height: 38, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 14 },
  sub: { color: blackAlpha(0.45), fontSize: 11, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.xl,
    backgroundColor: colors.red50,
  },
  deleteLabel: { color: colors.white, fontSize: 12 },
});
