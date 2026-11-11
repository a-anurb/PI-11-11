// =============================================================================
// MonY — Level Up (XP, níveis, títulos e medalhas)
// -----------------------------------------------------------------------------
// O XP é CALCULADO a partir do que o usuário já faz no app (transações, metas,
// categorias, simulações, perfil). Não existe moeda virtual nem compra.
// Regras pensadas para premiar CONSTÂNCIA e organização, não volume de gastos:
//   • transações: 10 XP cada, contando no máximo 5 por dia
//   • metas: 25 XP por meta criada (até 4) e 100 XP por meta concluída
//   • categorias criadas: 15 XP cada (até 3)
//   • simulações salvas: 10 XP cada (até 5)
//   • perfil completo (telefone + avatar ou foto): 30 XP
// =============================================================================

export interface LevelStats {
  /** datas (YYYY-MM-DD) de cada transação */
  transactionDates: string[];
  /** transações com tipo/valor/data para a medalha "Mês no azul" */
  transactions: { type: 'income' | 'expense'; amount: number; date: string }[];
  goalsCreated: number;
  goalsCompleted: number;
  customCategories: number;
  simulationsSaved: number;
  profileComplete: boolean;
}

export const LEVELS = [
  { level: 1, xp: 0, title: 'Iniciante' },
  { level: 2, xp: 100, title: 'Organizador' },
  { level: 3, xp: 250, title: 'Planejador' },
  { level: 4, xp: 500, title: 'Estrategista' },
  { level: 5, xp: 900, title: 'Mestre das finanças' },
] as const;

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

export type MedalId =
  | 'first_tx'
  | 'streak7'
  | 'goal_set'
  | 'goal_done'
  | 'organizer'
  | 'simulator'
  | 'profile'
  | 'green_month';

export interface MedalDef {
  id: MedalId;
  name: string;
  description: string;
  condition: string;
  icon: string; // MaterialCommunityIcons
  color: string;
}

export const MEDALS: MedalDef[] = [
  { id: 'first_tx', name: 'Primeiro passo', description: 'Começou a organizar o seu dinheiro.', condition: 'Registre sua primeira transação.', icon: 'shoe-print', color: '#2f8f57' },
  { id: 'streak7', name: 'Constância', description: 'Manteve o hábito de registrar.', condition: 'Registre transações em 7 dias diferentes.', icon: 'calendar-check', color: '#2b7088' },
  { id: 'goal_set', name: 'Sonho no papel', description: 'Transformou um objetivo em meta.', condition: 'Crie sua primeira meta.', icon: 'flag-variant', color: '#b45309' },
  { id: 'goal_done', name: 'Meta alcançada', description: 'Chegou lá!', condition: 'Conclua uma meta.', icon: 'trophy-variant', color: '#ca8a04' },
  { id: 'organizer', name: 'Organizador', description: 'Deixou as categorias do seu jeito.', condition: 'Crie uma categoria personalizada.', icon: 'tag-multiple', color: '#7c3aed' },
  { id: 'simulator', name: 'Consumidor consciente', description: 'Fez as contas antes de comprar.', condition: 'Salve uma simulação no Simulador.', icon: 'calculator-variant', color: '#0f766e' },
  { id: 'profile', name: 'Perfil completo', description: 'Seu perfil está com a sua cara.', condition: 'Informe o telefone e escolha um avatar ou foto.', icon: 'account-check', color: '#be185d' },
  { id: 'green_month', name: 'Mês no azul', description: 'Fechou um mês gastando menos do que recebeu.', condition: 'Tenha um mês com receitas maiores que despesas (com pelo menos 3 registros).', icon: 'chart-line', color: '#1f6b3f' },
];

export interface LevelResult {
  xp: number;
  level: number;
  title: string;
  /** XP do nível atual e do próximo (para a barra de progresso) */
  levelXp: number;
  nextLevelXp: number | null;
  progress: number; // 0..1
  medals: { def: MedalDef; unlocked: boolean; progress?: { current: number; target: number } }[];
  unlockedMedals: MedalId[];
  breakdown: { label: string; xp: number }[];
}

function greenMonth(tx: LevelStats['transactions']) {
  const byMonth = new Map<string, { inc: number; exp: number; n: number }>();
  tx.forEach((t) => {
    const k = t.date.slice(0, 7);
    const m = byMonth.get(k) ?? { inc: 0, exp: 0, n: 0 };
    if (t.type === 'income') m.inc += Math.abs(t.amount);
    else m.exp += Math.abs(t.amount);
    m.n += 1;
    byMonth.set(k, m);
  });
  return [...byMonth.values()].some((m) => m.n >= 3 && m.inc > 0 && m.inc > m.exp);
}

export function computeLevel(s: LevelStats): LevelResult {
  // ---- XP
  const perDay = new Map<string, number>();
  s.transactionDates.forEach((d) => perDay.set(d, (perDay.get(d) ?? 0) + 1));
  const txXp = [...perDay.values()].reduce((sum, n) => sum + Math.min(n, 5) * 10, 0);
  const goalXp = Math.min(s.goalsCreated, 4) * 25 + s.goalsCompleted * 100;
  const catXp = Math.min(s.customCategories, 3) * 15;
  const simXp = Math.min(s.simulationsSaved, 5) * 10;
  const profXp = s.profileComplete ? 30 : 0;
  const xp = txXp + goalXp + catXp + simXp + profXp;

  // ---- nível
  let cur: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) cur = l;
  const next = LEVELS.find((l) => l.level === cur.level + 1) ?? null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;

  // ---- medalhas
  const days = perDay.size;
  const checks: Record<MedalId, { ok: boolean; progress?: { current: number; target: number } }> = {
    first_tx: { ok: s.transactionDates.length >= 1 },
    streak7: { ok: days >= 7, progress: { current: Math.min(days, 7), target: 7 } },
    goal_set: { ok: s.goalsCreated >= 1 },
    goal_done: { ok: s.goalsCompleted >= 1 },
    organizer: { ok: s.customCategories >= 1 },
    simulator: { ok: s.simulationsSaved >= 1 },
    profile: { ok: s.profileComplete },
    green_month: { ok: greenMonth(s.transactions) },
  };
  const medals = MEDALS.map((def) => ({ def, unlocked: checks[def.id].ok, progress: checks[def.id].progress }));

  return {
    xp,
    level: cur.level,
    title: cur.title,
    levelXp: cur.xp,
    nextLevelXp: next ? next.xp : null,
    progress: Math.max(0, Math.min(1, progress)),
    medals,
    unlockedMedals: medals.filter((m) => m.unlocked).map((m) => m.def.id),
    breakdown: [
      { label: 'Transações registradas', xp: txXp },
      { label: 'Metas', xp: goalXp },
      { label: 'Categorias criadas', xp: catXp },
      { label: 'Simulações salvas', xp: simXp },
      { label: 'Perfil completo', xp: profXp },
    ],
  };
}
