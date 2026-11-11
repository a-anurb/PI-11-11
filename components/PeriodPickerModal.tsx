import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii } from '../constants/theme';
import { formatDateBR, MONTHS_LONG, MONTHS_SHORT, toDateKey } from '../utils/format';
import { CalendarPicker } from './CalendarPicker';

// ---------------------------------------------------------------------------
// Tipo do período selecionado + funções auxiliares (usadas na tela Transações)
// ---------------------------------------------------------------------------
export type Period =
  | { mode: 'all' }
  | { mode: 'month'; year: number; month: number } // month: 0-11
  | { mode: 'day'; date: string } // YYYY-MM-DD
  | { mode: 'range'; start: string; end: string };

export function currentMonthPeriod(): Period {
  const now = new Date();
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() };
}

export function periodLabel(p: Period): string {
  switch (p.mode) {
    case 'all':
      return 'Todo o período';
    case 'month':
      return `${MONTHS_LONG[p.month]} de ${p.year}`;
    case 'day':
      return p.date === toDateKey(new Date()) ? `Hoje, ${formatDateBR(p.date)}` : formatDateBR(p.date);
    case 'range':
      return `${formatDateBR(p.start).slice(0, 5)} a ${formatDateBR(p.end)}`;
  }
}

/** a data (YYYY-MM-DD) está dentro do período? */
export function isInPeriod(date: string, p: Period): boolean {
  switch (p.mode) {
    case 'all':
      return true;
    case 'month':
      return date.startsWith(`${p.year}-${String(p.month + 1).padStart(2, '0')}`);
    case 'day':
      return date === p.date;
    case 'range':
      return date >= p.start && date <= p.end;
  }
}

/** avança/volta o período pelas flechinhas (‹ ›) */
export function shiftPeriod(p: Period, delta: number): Period {
  if (p.mode === 'month') {
    const d = new Date(p.year, p.month + delta, 1);
    return { mode: 'month', year: d.getFullYear(), month: d.getMonth() };
  }
  if (p.mode === 'day') {
    const d = new Date(`${p.date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    return { mode: 'day', date: toDateKey(d) };
  }
  if (p.mode === 'range') {
    const s = new Date(`${p.start}T00:00:00`);
    const e = new Date(`${p.end}T00:00:00`);
    const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    s.setDate(s.getDate() + delta * days);
    e.setDate(e.getDate() + delta * days);
    return { mode: 'range', start: toDateKey(s), end: toDateKey(e) };
  }
  return p;
}

// ---------------------------------------------------------------------------
// Modal de seleção: Mês | Data | Período | Tudo
// ---------------------------------------------------------------------------
type Tab = 'month' | 'day' | 'range' | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'month', label: 'Mês' },
  { key: 'day', label: 'Data' },
  { key: 'range', label: 'Período' },
  { key: 'all', label: 'Tudo' },
];

interface PeriodPickerModalProps {
  isOpen: boolean;
  value: Period;
  onClose: () => void;
  onApply: (p: Period) => void;
}

export function PeriodPickerModal({ isOpen, value, onClose, onApply }: PeriodPickerModalProps) {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState<string | null>(toDateKey(now));
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // Ao abrir, carrega o período atual
  useEffect(() => {
    if (!isOpen) return;
    setTab(value.mode);
    if (value.mode === 'month') {
      setYear(value.year);
      setMonth(value.month);
    }
    if (value.mode === 'day') setDay(value.date);
    if (value.mode === 'range') {
      setRangeStart(value.start);
      setRangeEnd(value.end);
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }, [isOpen]);

  const canApply =
    tab === 'all' || tab === 'month' || (tab === 'day' && !!day) || (tab === 'range' && !!rangeStart);

  const apply = () => {
    if (tab === 'all') onApply({ mode: 'all' });
    if (tab === 'month') onApply({ mode: 'month', year, month });
    if (tab === 'day' && day) onApply({ mode: 'day', date: day });
    if (tab === 'range' && rangeStart) {
      onApply({ mode: 'range', start: rangeStart, end: rangeEnd ?? rangeStart });
    }
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Selecionar período</Text>

          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, tab === t.key && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {tab === 'month' && (
              <View>
                <View style={styles.yearRow}>
                  <Pressable onPress={() => setYear((y) => y - 1)} style={styles.navBtn} hitSlop={8}>
                    <Feather name="chevron-left" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={styles.yearText}>{year}</Text>
                  <Pressable onPress={() => setYear((y) => y + 1)} style={styles.navBtn} hitSlop={8}>
                    <Feather name="chevron-right" size={18} color={colors.text} />
                  </Pressable>
                </View>
                <View style={styles.monthGrid}>
                  {MONTHS_SHORT.map((m, i) => {
                    const selected = i === month;
                    const isCurrent = i === now.getMonth() && year === now.getFullYear();
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMonth(i)}
                        style={[styles.monthBtn, selected && styles.monthBtnSelected, !selected && isCurrent && styles.monthBtnCurrent]}
                      >
                        <Text style={[styles.monthLabel, selected && styles.monthLabelSelected]}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {tab === 'day' && <CalendarPicker mode="single" start={day} onChange={(d) => setDay(d)} />}

            {tab === 'range' && (
              <View>
                <View style={styles.rangeInfo}>
                  <View style={styles.rangeBox}>
                    <Text style={styles.rangeLabel}>De</Text>
                    <Text style={styles.rangeValue}>{rangeStart ? formatDateBR(rangeStart) : '—'}</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={blackAlpha(0.4)} />
                  <View style={styles.rangeBox}>
                    <Text style={styles.rangeLabel}>Até</Text>
                    <Text style={styles.rangeValue}>{rangeEnd ? formatDateBR(rangeEnd) : '—'}</Text>
                  </View>
                </View>
                <Text style={styles.hint}>Toque na data inicial e depois na data final.</Text>
                <CalendarPicker
                  mode="range"
                  start={rangeStart}
                  end={rangeEnd}
                  onChange={(s, e) => {
                    setRangeStart(s);
                    setRangeEnd(e);
                  }}
                />
              </View>
            )}

            {tab === 'all' && (
              <View style={styles.allBox}>
                <Feather name="layers" size={28} color={colors.emerald600} />
                <Text style={styles.allText}>Mostrar transações de todas as datas.</Text>
              </View>
            )}
          </ScrollView>

          <Pressable style={[styles.applyBtn, !canApply && { opacity: 0.4 }]} onPress={apply} disabled={!canApply}>
            <Feather name="check" size={18} color={colors.white} />
            <Text style={styles.applyLabel}>Aplicar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.emerald500 },
  tabLabel: { color: blackAlpha(0.6), fontSize: 13 },
  tabLabelActive: { color: colors.white, fontWeight: '600' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  yearText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthBtn: {
    width: '31.5%',
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  monthBtnSelected: { backgroundColor: colors.emerald500 },
  monthBtnCurrent: { borderWidth: 1, borderColor: colors.emerald500 },
  monthLabel: { color: colors.text },
  monthLabelSelected: { color: colors.white, fontWeight: '700' },
  rangeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rangeBox: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: 10 },
  rangeLabel: { fontSize: 11, color: blackAlpha(0.5) },
  rangeValue: { color: colors.text, marginTop: 2 },
  hint: { fontSize: 11, color: blackAlpha(0.45), marginBottom: 10 },
  allBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  allText: { color: blackAlpha(0.6) },
  applyBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radii['2xl'],
    backgroundColor: colors.emerald500,
  },
  applyLabel: { color: colors.white, fontSize: 15 },
});
