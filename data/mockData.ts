export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  icon: string;
  description?: string;
  /** id da categoria (ver CategoriesContext). Transações antigas podem não ter. */
  categoryId?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  /** chave do ícone em components/CategoryIcon.tsx */
  icon: string;
  color: string;
  /** Despesa ou Receita — define em qual tipo de transação a categoria aparece */
  type: TransactionType;
  /** true = criada pelo usuário (pode ser excluída) */
  custom?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  completed: boolean;
  createdAt: string;
}

// O app começa sem transações — tudo aqui é criado pelo próprio usuário.
export const mockTransactions: Transaction[] = [];

// O app começa sem metas — tudo aqui é criado pelo próprio usuário.
export const mockGoals: Goal[] = [];

export const motivationalQuotes = [
  'Cada centavo economizado é um passo rumo aos seus sonhos!',
  'Investir em si mesmo é o melhor negócio que você pode fazer!',
  'Pequenas economias hoje, grandes conquistas amanhã!',
  'Mantenha o foco nas suas metas financeiras!',
  'Você está no controle do seu futuro financeiro!',
  'Organize suas finanças, organize sua vida!',
  'Seja inteligente com seu dinheiro, seja livre!',
  'Seu futuro agradece suas escolhas de hoje!',
];

// Categorias padrão, separadas por tipo. As criadas pelo usuário ficam salvas
// no CategoriesContext (AsyncStorage) e são somadas a estas.
export const defaultCategories: Category[] = [
  // ---- Despesas ----
  { id: 'food', name: 'Alimentação', icon: 'food', color: '#8b5cf6', type: 'expense' },
  { id: 'snack', name: 'Lanche', icon: 'coffee', color: '#f97316', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: 'transport', color: '#0ea5e9', type: 'expense' },
  { id: 'home', name: 'Casa', icon: 'home', color: '#f59e0b', type: 'expense' },
  { id: 'health', name: 'Saúde', icon: 'health', color: '#ec4899', type: 'expense' },
  { id: 'leisure', name: 'Lazer', icon: 'leisure', color: '#06b6d4', type: 'expense' },
  { id: 'education', name: 'Educação', icon: 'education', color: '#3b82f6', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: 'shopping_cart', color: '#10b981', type: 'expense' },
  { id: 'gifts', name: 'Presentes', icon: 'gifts', color: '#f472b6', type: 'expense' },
  { id: 'family', name: 'Família', icon: 'family', color: '#eab308', type: 'expense' },
  { id: 'bills', name: 'Contas', icon: 'bills', color: '#ef4444', type: 'expense' },
  // ---- Receitas ----
  { id: 'salary', name: 'Salário', icon: 'salary', color: '#16a34a', type: 'income' },
  { id: 'investment', name: 'Renda Extra', icon: 'investment', color: '#14b8a6', type: 'income' },
  { id: 'returns', name: 'Investimentos', icon: 'returns', color: '#22c55e', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', color: '#0ea5e9', type: 'income' },
  { id: 'sales', name: 'Vendas', icon: 'sales', color: '#a855f7', type: 'income' },
  { id: 'gift_received', name: 'Presente recebido', icon: 'gifts', color: '#f472b6', type: 'income' },
];

// Cores e ícones oferecidos ao criar uma nova categoria
export const CATEGORY_COLORS = [
  '#10b981', '#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e',
];

export const CATEGORY_ICON_CHOICES = [
  'tag', 'food', 'coffee', 'transport', 'home', 'health', 'leisure', 'education',
  'shopping_cart', 'gifts', 'family', 'bills', 'phone', 'entertainment', 'pet',
  'travel', 'salary', 'investment', 'returns', 'freelance', 'sales', 'star',
];
