import { StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors } from '../constants/theme';

interface MonthlyBarChartProps {
  labels: string[];
  income: number[];
  expenses: number[];
  height?: number;
}

// Arredonda o valor máximo para um número "redondo" acima dele,
// para que as linhas de grade fiquem em valores limpos (ex: 6000, 4500...)
function niceCeil(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const rounded = Math.ceil(value / magnitude) * magnitude;
  return rounded;
}

function formatAxisValue(value: number): string {
  if (value >= 1000) {
    const inK = value / 1000;
    return `${Number.isInteger(inK) ? inK : inK.toFixed(1)}k`;
  }
  return String(value);
}

const GRID_STEPS = 4;

export function MonthlyBarChart({ labels, income, expenses, height = 180 }: MonthlyBarChartProps) {
  const maxRaw = Math.max(1, ...income, ...expenses);
  const maxValue = niceCeil(maxRaw);
  const barsAreaHeight = height;

  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) =>
    Math.round((maxValue / GRID_STEPS) * (GRID_STEPS - i))
  );

  return (
    <View style={styles.container}>
      <View style={[styles.yAxis, { height: barsAreaHeight }]}>
        {gridValues.map((v, i) => (
          <Text key={i} style={styles.yLabel}>
            {formatAxisValue(v)}
          </Text>
        ))}
      </View>

      <View style={styles.chartArea}>
        <View style={[styles.barsArea, { height: barsAreaHeight }]}>
          {gridValues.map((_, i) => (
            <View key={i} style={[styles.gridLine, { top: (barsAreaHeight * i) / GRID_STEPS }]} />
          ))}

          <View style={styles.barsRow}>
            {labels.map((label, i) => {
              const incomeValue = income[i] ?? 0;
              const expenseValue = expenses[i] ?? 0;
              const incomeH = (incomeValue / maxValue) * barsAreaHeight;
              const expenseH = (expenseValue / maxValue) * barsAreaHeight;
              return (
                <View key={label} style={styles.barGroup}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(incomeH, incomeValue > 0 ? 3 : 0), backgroundColor: colors.emerald500 },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(expenseH, expenseValue > 0 ? 3 : 0), backgroundColor: colors.red500 },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.xLabelsRow}>
          {labels.map((label) => (
            <Text key={label} style={styles.xLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 10,
    color: blackAlpha(0.4),
  },
  chartArea: {
    flex: 1,
  },
  barsArea: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
  barsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  xLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  xLabel: {
    fontSize: 11,
    color: blackAlpha(0.5),
  },
});
