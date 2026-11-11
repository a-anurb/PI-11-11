// Equivalente ao `valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })`
// usado no projeto original. Implementado manualmente para evitar depender do
// Intl completo em todos os motores JS do React Native.
export function formatMoney(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${withThousands},${decPart}`;
}

export function formatCurrency(value: number): string {
  return `R$ ${formatMoney(value)}`;
}

// Equivalente ao `new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })`
export const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  return `${day} de ${month}.`;
}

export const MONTHS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** Date → "YYYY-MM-DD" usando o horário LOCAL (evita erro de fuso do toISOString) */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "2026-09-05" → "05/09/2026" */
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** ISO date-time → "há 5 min", "ontem", "12/09" … */
export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
