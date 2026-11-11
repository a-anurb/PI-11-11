import { useCloudValue } from '../lib/cloudData';
import { createContext, ReactNode, useContext } from 'react';
import { Goal } from '../data/mockData';
import { formatCurrency, toDateKey } from '../utils/format';
import { useNotifications } from './NotificationsContext';

interface GoalsContextType {
  goals: Goal[];
  isLoaded: boolean;
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
}

const GoalsContext = createContext<GoalsContextType | null>(null);

const STORAGE_KEY_BASE = 'finapp_goals';

export function GoalsProvider({ children }: { children: ReactNode }) {
  // dados separados por usuário logado
  const [goals, setGoals, isLoaded] = useCloudValue<Goal[]>(STORAGE_KEY_BASE, []);
  const { notify } = useNotifications();

  const addGoal = (g: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...g,
      id: Date.now().toString(),
      createdAt: toDateKey(new Date()),
    };
    setGoals((prev) => [newGoal, ...prev]);
    notify('goal', 'Nova meta criada', `${newGoal.title} • objetivo de ${formatCurrency(newGoal.targetAmount)}`, 'goals');
  };

  const updateGoal = (updated: Goal) => {
    const previous = goals.find((g) => g.id === updated.id);
    if (previous && !previous.completed && updated.completed) {
      notify('goal', 'Meta concluída', `Você atingiu a meta "${updated.title}" (${formatCurrency(updated.targetAmount)}).`, 'goals');
    } else if (previous && !updated.completed && updated.targetAmount > 0) {
      const pct = (updated.currentAmount / updated.targetAmount) * 100;
      const prevPct = (previous.currentAmount / previous.targetAmount) * 100;
      if (prevPct < 50 && pct >= 50) {
        notify('goal', 'Meta na metade do caminho', `"${updated.title}" já está em ${pct.toFixed(0)}%. Continue assim!`, 'goals');
      }
    }
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <GoalsContext.Provider value={{ goals, isLoaded, addGoal, updateGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
}
