import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { CategoriesProvider, useCategories } from '../../context/CategoriesContext';
import { GoalsProvider, useGoals } from '../../context/GoalsContext';
import { LevelUpProvider } from '../../context/LevelUpContext';
import { NotificationsProvider, useNotifications } from '../../context/NotificationsContext';
import { ProfileProvider } from '../../context/ProfileContext';
import { TransactionsProvider, useTransactions } from '../../context/TransactionsContext';

export default function TabsLayout() {
  const { user, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.emerald500} />
      </View>
    );
  }

  // Sem usuário logado → tela de login
  if (!user) return <Redirect href="/login" />;

  return (
    // key = id do usuário: ao trocar de conta, todos os dados são recarregados
    <NotificationsProvider key={user.id}>
      <CategoriesProvider>
        <TransactionsProvider>
          <GoalsProvider>
            <LevelUpProvider>
            <ProfileProvider>
              <DataReadyTabs />
            </ProfileProvider>
            </LevelUpProvider>
          </GoalsProvider>
        </TransactionsProvider>
      </CategoriesProvider>
    </NotificationsProvider>
  );
}

/** Não mostra telas editáveis até carregar a nuvem/cache desta conta. */
function DataReadyTabs() {
  const { isLoaded: tx } = useTransactions();
  const { isLoaded: goals } = useGoals();
  const { isLoaded: cats } = useCategories();
  const { isLoaded: notifications } = useNotifications();
  if (!tx || !goals || !cats || !notifications) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.emerald500} />
    </View>;
  }
  return <Tabs
    tabBar={(props) => <BottomNav {...props} />}
    screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
  >
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="transactions" options={{ title: 'Transações' }} />
    <Tabs.Screen name="reports" options={{ title: 'Relatórios' }} />
    <Tabs.Screen name="simulator" options={{ title: 'Simulador' }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
  </Tabs>;
}
