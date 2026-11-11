import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddGoalModal } from '../../components/AddGoalModal';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { BalanceCard } from '../../components/BalanceCard';
import { NotificationsModal } from '../../components/NotificationsModal';
import { QuickActions } from '../../components/QuickActions';
import { QuickChart } from '../../components/QuickChart';
import { TypeBadge } from '../../components/TransactionItem';
import { UserAvatar } from '../../components/UserAvatar';
import { blackAlpha, colors, radii, shadow } from '../../constants/theme';
import { useNotifications } from '../../context/NotificationsContext';
import { useProfile } from '../../context/ProfileContext';
import { useTransactions } from '../../context/TransactionsContext';
import { motivationalQuotes } from '../../data/mockData';
import { formatCurrency, formatDateShort } from '../../utils/format';

function getMonthKey(offsetFromNow: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - offsetFromNow, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Home() {
  const { transactions } = useTransactions();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const [quote, setQuote] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(
    transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  );
  const balance = income - expenses;

  // Variação real em relação ao mês anterior. Fica null (e escondida) quando
  // não há transações no mês anterior para comparar — não inventamos número.
  const currentMonthKey = getMonthKey(0);
  const previousMonthKey = getMonthKey(1);
  const currentMonthNet = transactions
    .filter((t) => t.date.startsWith(currentMonthKey))
    .reduce((s, t) => s + t.amount, 0);
  const previousMonthNet = transactions
    .filter((t) => t.date.startsWith(previousMonthKey))
    .reduce((s, t) => s + t.amount, 0);
  const variation =
    previousMonthNet !== 0 ? ((currentMonthNet - previousMonthNet) / Math.abs(previousMonthNet)) * 100 : null;

  const firstName = profile.name.trim() ? profile.name.trim().split(' ')[0] : '';

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <LinearGradient colors={[colors.bg, colors.bgAlt]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{firstName ? `Olá, ${firstName}!` : 'Olá!'}</Text>
              <Text style={styles.headerTitle}>Suas Finanças</Text>
            </View>
            <View style={styles.headerIcons}>
              <Pressable style={styles.bellBtn} onPress={() => setShowNotifications(true)}>
                <Feather name="bell" size={20} color={blackAlpha(0.8)} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Pressable>
              <Link href="/profile" asChild>
                <Pressable style={styles.avatar} accessibilityLabel="Abrir perfil">
                  <UserAvatar avatar={profile.avatar} name={profile.name} size={48} />
                </Pressable>
              </Link>
            </View>
          </View>

          <BalanceCard balance={balance} income={income} expenses={expenses} variation={variation} />

          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>{quote}</Text>
          </View>

          <View style={styles.section}>
            <QuickChart income={income} expenses={expenses} />
          </View>

          <QuickActions
            onAddGoal={() => setShowAddGoal(true)}
            onAddIncome={() => {
              setTransactionType('income');
              setShowAddTransaction(true);
            }}
            onAddExpense={() => {
              setTransactionType('expense');
              setShowAddTransaction(true);
            }}
          />

          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Transações Recentes</Text>
              <Link href="/transactions" asChild>
                <Pressable>
                  <Text style={styles.recentLink}>Ver todas</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.recentList}>
              {recent.map((t) => (
                <View key={t.id} style={styles.recentItem}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.recentItemTitle}>{t.title}</Text>
                    <View style={styles.recentMeta}>
                      <TypeBadge type={t.type} small />
                      <Text style={styles.recentItemDate}>
                        {t.category} • {formatDateShort(t.date)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: t.type === 'income' ? colors.emerald600 : colors.red600,
                    }}
                  >
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                  </Text>
                </View>
              ))}
              {recent.length === 0 && (
                <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          type={transactionType}
        />
        <AddGoalModal isOpen={showAddGoal} onClose={() => setShowAddGoal(false)} />
        <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    color: blackAlpha(0.6),
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.red500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  quoteBox: {
    backgroundColor: colors.yellow100,
    borderRadius: radii['2xl'],
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.yellow400,
  },
  quoteText: {
    fontSize: 14,
    color: blackAlpha(0.8),
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  recentSection: {
    marginTop: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentTitle: {
    color: colors.text,
    fontSize: 14,
  },
  recentLink: {
    fontSize: 12,
    color: colors.emerald600,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  recentItemTitle: {
    fontSize: 14,
    color: colors.text,
  },
  recentItemDate: {
    fontSize: 12,
    color: blackAlpha(0.45),
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: blackAlpha(0.4),
    paddingVertical: 16,
  },
});
