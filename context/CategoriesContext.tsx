import { useCloudValue } from '../lib/cloudData';
import { createContext, ReactNode, useContext } from 'react';
import { Category, defaultCategories, Transaction, TransactionType } from '../data/mockData';

interface CategoriesContextType {
  isLoaded: boolean;
  /** todas as categorias (padrão + criadas pelo usuário) */
  categories: Category[];
  /** somente as categorias de um tipo (Despesa ou Receita) */
  getByType: (type: TransactionType) => Category[];
  addCategory: (c: Omit<Category, 'id' | 'custom'>) => Category;
  deleteCategory: (id: string) => void;
  /** descobre a categoria de uma transação (inclusive transações antigas sem categoryId) */
  findForTransaction: (t: Transaction) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

const STORAGE_KEY_BASE = 'finapp_custom_categories';

export function CategoriesProvider({ children }: { children: ReactNode }) {
  // dados separados por usuário logado
  const [customCategories, setCustomCategories, isLoaded] = useCloudValue<Category[]>(STORAGE_KEY_BASE, []);

  const categories = [...defaultCategories, ...customCategories];

  const getByType = (type: TransactionType) => categories.filter((c) => c.type === type);

  const addCategory = (c: Omit<Category, 'id' | 'custom'>) => {
    const newCategory: Category = {
      ...c,
      name: c.name.trim(),
      id: `custom_${Date.now()}`,
      custom: true,
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCategory = (id: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const findForTransaction = (t: Transaction) => {
    if (t.categoryId) {
      const byId = categories.find((c) => c.id === t.categoryId);
      if (byId) return byId;
    }
    // Transações antigas: procura pelo nome dentro do mesmo tipo
    return categories.find(
      (c) => c.type === t.type && c.name.toLowerCase() === (t.category ?? '').toLowerCase()
    );
  };

  return (
    <CategoriesContext.Provider
      value={{ categories, isLoaded, getByType, addCategory, deleteCategory, findForTransaction }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
