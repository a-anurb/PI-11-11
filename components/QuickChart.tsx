import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';
import { formatCurrency } from '../utils/format';

interface QuickChartProps {
  income: number;
  expenses: number;
}

export function QuickChart({ income, expenses }: QuickChartProps) {
  const { width } = useWindowDimensions();
  const chartSize = 96;

  const data = [
    {
      name: 'Receitas',
      value: income || 0.0001,
      color: colors.emerald500,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Despesas',
      value: expenses || 0.0001,
      color: colors.red500,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Visão Rápida</Text>
      <View style={styles.row}>
        <View style={{ width: chartSize, height: chartSize }}>
          <PieChart
            data={data}
            width={chartSize}
            height={chartSize}
            chartConfig={{
              color: () => colors.black,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            hasLegend={false}
            center={[chartSize / 4, 0]}
          />
        </View>
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: colors.emerald500 }]} />
            <Text style={styles.legendLabel}>Receitas</Text>
            <Text style={[styles.legendValue, { color: colors.emerald600 }]}>
              {formatCurrency(income)}
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: colors.red500 }]} />
            <Text style={styles.legendLabel}>Despesas</Text>
            <Text style={[styles.legendValue, { color: colors.red600 }]}>
              {formatCurrency(expenses)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 16,
    ...shadow.sm,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: blackAlpha(0.6),
  },
  legendValue: {
    fontSize: 14,
    marginLeft: 'auto',
  },
});
