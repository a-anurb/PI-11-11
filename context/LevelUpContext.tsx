import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { computeLevel, LevelResult, MEDALS } from '../lib/levelUp';
import { readCloudData, writeCloudData } from '../lib/cloudData';
import { useAuth, useUserStorageKey } from './AuthContext';
import { useCategories } from './CategoriesContext';
import { useGoals } from './GoalsContext';
import { useNotifications } from './NotificationsContext';
import { useTransactions } from './TransactionsContext';

// -----------------------------------------------------------------------------
// Level Up: nível, título e medalhas calculados a partir dos dados reais do
// usuário (transações, metas, categorias, simulações e perfil). Não guarda um
// "saldo de XP" separado — tudo é recalculado, então nunca fica fora de sincronia.
// -----------------------------------------------------------------------------

interface LevelUpContextType extends LevelResult {
  /** relê dados que vêm de fora dos contextos (ex.: simulações salvas) */
  refresh: () => void;
}

const LevelUpContext = createContext<LevelUpContextType | null>(null);

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { goals, isLoaded: goalsLoaded } = useGoals();
  const { categories, isLoaded: categoriesLoaded } = useCategories();
  const { notify } = useNotifications();
  const simKey = useUserStorageKey('mony_simulations');

  const [simulationsSaved, setSimulationsSaved] = useState(0);

  const refresh = useCallback(() => {
    AsyncStorage.getItem(simKey)
      .then((raw) => setSimulationsSaved(raw ? (JSON.parse(raw) as unknown[]).length : 0))
      .catch(() => {});
  }, [simKey]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000); // simulações são salvas em outra aba
    return () => clearInterval(t);
  }, [refresh]);

  const result = useMemo(
    () =>
      computeLevel({
        transactionDates: transactions.map((t) => t.date),
        transactions: transactions.map((t) => ({ type: t.type, amount: t.amount, date: t.date })),
        goalsCreated: goals.length,
        goalsCompleted: goals.filter((g) => g.completed).length,
        customCategories: categories.filter((c) => c.custom).length,
        simulationsSaved,
        profileComplete: !!user?.phone && !!user?.avatar && user.avatar.type !== 'initials',
      }),
    [transactions, goals, categories, simulationsSaved, user?.phone, user?.avatar]
  );

  // Avisos de "subiu de nível" e "nova medalha" (só para conquistas novas)
  const seenLoaded = useRef(false);
  const seen = useRef<{ level: number; medals: string[] } | null>(null);
  useEffect(() => {
    if (!txLoaded || !goalsLoaded || !categoriesLoaded) return;
    (async () => {
      if (!seenLoaded.current) {
        try {
          seen.current = user ? await readCloudData<{ level: number; medals: string[] }>(user.id, 'mony_levelup_seen') : null;
        } catch {
          seen.current = null;
        }
        seenLoaded.current = true;
      }
      const prev = seen.current;
      if (prev) {
        if (result.level > prev.level) {
          notify('goal', `Você subiu para o nível ${result.level}!`, `Novo título: ${result.title}. Novos itens de avatar foram liberados.`);
        }
        result.unlockedMedals
          .filter((m) => !prev.medals.includes(m))
          .forEach((m) => {
            const def = MEDALS.find((x) => x.id === m)!;
            notify('goal', `Nova medalha: ${def.name}`, def.description);
          });
      }
      const next = { level: Math.max(result.level, prev?.level ?? 0), medals: Array.from(new Set([...(prev?.medals ?? []), ...result.unlockedMedals])) };
      seen.current = next;
      if (user) writeCloudData(user.id, 'mony_levelup_seen', next).catch(() => {});
    })();
  }, [txLoaded, goalsLoaded, categoriesLoaded, result.level, result.unlockedMedals.join(',')]);

  return <LevelUpContext.Provider value={{ ...result, refresh }}>{children}</LevelUpContext.Provider>;
}

export function useLevelUp() {
  const ctx = useContext(LevelUpContext);
  if (!ctx) throw new Error('useLevelUp must be used within LevelUpProvider');
  return ctx;
}
