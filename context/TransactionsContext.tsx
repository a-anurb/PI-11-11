import { useCloudValue } from '../lib/cloudData';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { Transaction } from '../data/mockData';
import { formatCurrency, toDateKey } from '../utils/format';
import { useNotifications } from './NotificationsContext';

interface TransactionsContextType {
  transactions: Transaction[];
  isLoaded: boolean;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

const STORAGE_KEY_BASE = 'finapp_transactions';
const WEEKLY_KEY_BASE = 'finapp_last_weekly_summary';

function monthKeyOf(date: string) {
  return date.slice(0, 7);
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  // dados separados por usuário logado
  const [lastSummary, setLastSummary, weeklyLoaded] = useCloudValue<number>(WEEKLY_KEY_BASE, 0);
  const [transactions, setTransactions, isLoaded] = useCloudValue<Transaction[]>(STORAGE_KEY_BASE, []);
  const { notify, settings, isLoaded: notificationsLoaded } = useNotifications();

  // Resumo semanal (se ativado nas configurações de notificação)
  useEffect(() => {
    if (!isLoaded || !weeklyLoaded || !notificationsLoaded || !settings.weeklySummary) return;
    (async () => {
      try {
        const last = lastSummary;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (last && Date.now() - last < sevenDays) return;
        const since = toDateKey(new Date(Date.now() - sevenDays));
        const week = transactions.filter((t) => t.date >= since);
        const inc = week.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = Math.abs(week.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        notify(
          'system',
          'Resumo semanal',
          `Últimos 7 dias: ${week.length} transações • Receitas ${formatCurrency(inc)} • Despesas ${formatCurrency(exp)}`
        );
        setLastSummary(Date.now());
      } catch {
        // ignora
      }
    })();
  }, [isLoaded, weeklyLoaded, notificationsLoaded, settings.weeklySummary, lastSummary]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...t, id: Date.now().toString() };
    const next = [newTransaction, ...transactions];
    setTransactions((prev) => [newTransaction, ...prev]);

    const isIncome = t.type === 'income';
    notify(
      'transaction',
      isIncome ? 'Receita registrada' : 'Despesa registrada',
      `${t.title} • ${t.category} • ${isIncome ? '+' : '-'} ${formatCurrency(Math.abs(t.amount))}`,
      'transactions'
    );

    // Alerta de gastos: despesas do mês passaram das receitas do mês
    if (!isIncome) {
      const mk = monthKeyOf(t.date);
      const monthIncome = next
        .filter((x) => x.type === 'income' && monthKeyOf(x.date) === mk)
        .reduce((s, x) => s + x.amount, 0);
      const monthExpenses = Math.abs(
        next.filter((x) => x.type === 'expense' && monthKeyOf(x.date) === mk).reduce((s, x) => s + x.amount, 0)
      );
      const before = monthExpenses - Math.abs(t.amount);
      if (monthIncome > 0 && monthExpenses > monthIncome && before <= monthIncome) {
        notify(
          'transaction',
          'Atenção aos gastos',
          `Suas despesas deste mês (${formatCurrency(monthExpenses)}) passaram das receitas (${formatCurrency(monthIncome)}).`,
          'spendingAlerts'
        );
      }
    }
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TransactionsContext.Provider
      value={{ transactions, isLoaded, addTransaction, updateTransaction, deleteTransaction }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
