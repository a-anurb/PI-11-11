import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii } from '../constants/theme';
import { MONTHS_LONG, toDateKey } from '../utils/format';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface CalendarPickerProps {
  /** 'single' = um dia; 'range' = início e fim */
  mode: 'single' | 'range';
  /** datas no formato YYYY-MM-DD */
  start: string | null;
  end?: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

/** Calendário simples, sem bibliotecas externas. */
export function CalendarPicker({ mode, start, end = null, onChange }: CalendarPickerProps) {
  const base = start ? new Date(`${start}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handlePress = (day: number) => {
    const key = toDateKey(new Date(viewYear, viewMonth, day));
    if (mode === 'single') {
      onChange(key, null);
      return;
    }
    // range: 1º toque = início, 2º toque = fim (inverte se vier antes)
    if (!start || (start && end)) {
      onChange(key, null);
    } else if (key < start) {
      onChange(key, start);
    } else {
      onChange(start, key);
    }
  };

  const todayKey = toDateKey(new Date());

  return (
    <View>
      <View style={styles.headerRow}>
        <Pressable onPress={() => goMonth(-1)} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTHS_LONG[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={() => goMonth(1)} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-right" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const key = toDateKey(new Date(viewYear, viewMonth, day));
          const isStart = key === start;
          const isEnd = key === end;
          const inRange = mode === 'range' && start && end && key > start && key < end;
          const selected = isStart || isEnd;
          return (
            <View key={i} style={[styles.cell, inRange && styles.cellInRange]}>
              <Pressable
                onPress={() => handlePress(day)}
                style={[styles.dayBtn, selected && styles.daySelected, !selected && key === todayKey && styles.dayToday]}
              >
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  monthTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: blackAlpha(0.45) },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellInRange: { backgroundColor: colors.emerald100 },
  dayBtn: { width: '86%', height: '86%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.emerald500 },
  dayToday: { borderWidth: 1, borderColor: colors.emerald500 },
  dayText: { color: colors.text, fontSize: 13 },
  dayTextSelected: { color: colors.white, fontWeight: '700' },
});
