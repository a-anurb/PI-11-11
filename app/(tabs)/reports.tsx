import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalCard } from '../../components/GoalCard';
import { MonthlyBarChart } from '../../components/MonthlyBarChart';
import { blackAlpha, colors, radii, shadow } from '../../constants/theme';
import { useGoals } from '../../context/GoalsContext';
import { useTransactions } from '../../context/TransactionsContext';
import { formatCurrency, MONTHS_SHORT } from '../../utils/format';

const CATEGORY_PALETTE = [
  colors.red500,
  colors.blue500,
  colors.purple500,
  colors.pink500,
  colors.cyan500,
  colors.amber500,
  colors.emerald500,
  colors.orange600,
];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Últimos N meses (incluindo o atual), para o gráfico de Evolução Mensal.
// Se não houver transações em um mês, o valor fica zerado — não é inventado.
function getLastMonths(n: number) {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: capitalize(MONTHS_SHORT[d.getMonth()]) });
  }
  return months;
}

export default function Reports() {
  const { transactions } = useTransactions();
  const { goals } = useGoals();
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 448) - 32 - 32; // largura da tela - padding da scroll - padding do card

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = Math.abs(
    transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  );
  const balance = income - expenses;

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  // --- Evolução Mensal: soma real de receitas/despesas por mês ---
  const months = getLastMonths(4);
  const monthlyLabels = months.map((m) => m.label);
  const monthlyReceitas = months.map(({ key }) =>
    transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(key))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const monthlyDespesas = months.map(({ key }) =>
    Math.abs(
      transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(key))
        .reduce((sum, t) => sum + t.amount, 0)
    )
  );
  const hasMonthlyData = monthlyReceitas.some((v) => v > 0) || monthlyDespesas.some((v) => v > 0);

  // --- Despesas por Categoria: agrupamento real das transações ---
  const categoryTotals = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const key = t.category || 'Outros';
      categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + Math.abs(t.amount));
    });
  const categoryData = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
    }));

  // --- Tendência do Saldo: saldo acumulado real ao longo das transações ---
  const sortedByDate = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const runningByDate = new Map<string, number>();
  let running = 0;
  sortedByDate.forEach((t) => {
    running += t.amount;
    runningByDate.set(t.date, running);
  });
  const trendEntries = Array.from(runningByDate.entries()).slice(-8);
  const trendLabels = trendEntries.map(([date]) => date.slice(8, 10));
  const trendValues = trendEntries.map(([, v]) => v);
  const hasTrendData = trendEntries.length >= 2;

  const topCategory = categoryData[0];
  const topCategoryPercent =
    expenses > 0 && topCategory ? Math.round((topCategory.value / expenses) * 100) : null;

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
    propsForBackgroundLines: {
      stroke: colors.border,
    },
    barPercentage: 0.6,
  };

  return (
    <LinearGradient colors={[colors.bg, colors.bgAlt]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Relatórios</Text>
            <Text style={styles.headerSubtitle}>Análise detalhada das suas finanças</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.emerald100 }]}>
                <Feather name="trending-up" size={18} color={colors.emerald600} />
              </View>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: colors.emerald600 }]}>
                {formatCurrency(income)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.red100 }]}>
                <Feather name="trending-down" size={18} color={colors.red600} />
              </View>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={[styles.summaryValue, { color: colors.red600 }]}>
                {formatCurrency(expenses)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.yellow100 }]}>
                <Feather name="dollar-sign" size={18} color={colors.yellow600} />
              </View>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metas em Andamento</Text>
              <View style={styles.goalsList}>
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </View>
            </View>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metas Concluídas</Text>
              <View style={styles.goalsList}>
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </View>
            </View>
          )}

          {/* Monthly Comparison Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Evolução Mensal</Text>
            <MonthlyBarChart
              labels={monthlyLabels}
              income={monthlyReceitas}
              expenses={monthlyDespesas}
              height={180}
            />
            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.emerald500 }]} />
                <Text style={styles.legendLabel}>Receitas</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.red500 }]} />
                <Text style={styles.legendLabel}>Despesas</Text>
              </View>
            </View>
            {!hasMonthlyData && (
              <Text style={styles.emptyChartText}>
                Adicione transações para ver a evolução mensal
              </Text>
            )}
          </View>

          {/* Trend Line Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Tendência do Saldo</Text>
            {hasTrendData ? (
              <LineChart
                data={{
                  labels: trendLabels,
                  datasets: [{ data: trendValues }],
                }}
                width={chartWidth}
                height={180}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                }}
                bezier
                withInnerLines
                style={styles.chart}
              />
            ) : (
              <View style={styles.emptyChartBox}>
                <Feather name="activity" size={28} color={blackAlpha(0.2)} />
                <Text style={styles.emptyChartText}>
                  Adicione pelo menos duas transações para ver a tendência do saldo
                </Text>
              </View>
            )}
          </View>

          {/* Category Pie Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Despesas por Categoria</Text>
            {categoryData.length > 0 ? (
              <>
                <View style={styles.pieRow}>
                  <PieChart
                    data={categoryData.map((c) => ({
                      name: c.name,
                      population: c.value,
                      color: c.color,
                      legendFontColor: colors.text,
                      legendFontSize: 11,
                    }))}
                    width={chartWidth}
                    height={140}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    hasLegend={false}
                    center={[chartWidth / 4, 0]}
                  />
                </View>
                <View style={styles.categoryLegendList}>
                  {categoryData.slice(0, 6).map((cat, index) => (
                    <View key={index} style={styles.categoryLegendRow}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.categoryLegendLabel}>{cat.name}</Text>
                      <Text style={styles.categoryLegendValue}>{formatCurrency(cat.value)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyChartBox}>
                <Feather name="pie-chart" size={28} color={blackAlpha(0.2)} />
                <Text style={styles.emptyChartText}>Nenhuma despesa registrada ainda</Text>
              </View>
            )}
          </View>

          {/* Insights */}
          {transactions.length > 0 ? (
            <View style={styles.insightsBox}>
              <Text style={styles.insightsTitle}>Insights</Text>
              {balance >= 0 ? (
                <Text style={styles.insightItem}>
                  • Você está com {formatCurrency(balance)} de saldo positivo
                </Text>
              ) : (
                <Text style={styles.insightItem}>
                  • Suas despesas superam as receitas em {formatCurrency(Math.abs(balance))}
                </Text>
              )}
              {topCategory && topCategoryPercent !== null && (
                <Text style={styles.insightItem}>
                  • {topCategory.name} é sua maior despesa ({topCategoryPercent}% do total)
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.insightsBox}>
              <Text style={styles.insightsTitle}>Insights</Text>
              <Text style={styles.insightItem}>
                • Adicione suas transações para ver insights personalizados aqui
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
  },
  headerSubtitle: {
    color: blackAlpha(0.6),
    fontSize: 14,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: blackAlpha(0.6),
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: 12,
  },
  goalsList: {
    gap: 12,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    color: colors.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: radii.xl,
    marginLeft: -16,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: blackAlpha(0.6),
  },
  pieRow: {
    alignItems: 'center',
  },
  categoryLegendList: {
    gap: 8,
    marginTop: 12,
  },
  categoryLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLegendLabel: {
    fontSize: 12,
    color: blackAlpha(0.6),
    flex: 1,
  },
  categoryLegendValue: {
    fontSize: 12,
    color: colors.text,
  },
  emptyChartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyChartText: {
    fontSize: 12,
    color: blackAlpha(0.4),
    textAlign: 'center',
    marginTop: 8,
  },
  insightsBox: {
    backgroundColor: colors.emerald50,
    borderRadius: radii['2xl'],
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.emerald500,
  },
  insightsTitle: {
    color: colors.text,
    marginBottom: 8,
  },
  insightItem: {
    fontSize: 14,
    color: blackAlpha(0.7),
    marginBottom: 4,
  },
});
