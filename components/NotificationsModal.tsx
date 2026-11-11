import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blackAlpha, colors, radii } from '../constants/theme';
import {
  AppNotification,
  NotificationKind,
  NotificationSettings,
  useNotifications,
} from '../context/NotificationsContext';
import { formatRelative } from '../utils/format';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** aba que abre primeiro (o Perfil abre direto em "Configurações") */
  initialTab?: 'list' | 'settings';
}

const KIND_INFO: Record<NotificationKind, { icon: keyof typeof Feather.glyphMap; color: string; bg: string; label: string }> = {
  reminder: { icon: 'clock', color: colors.blue600, bg: colors.blue100, label: 'Lembrete' },
  goal: { icon: 'target', color: colors.yellow400, bg: colors.yellow100, label: 'Meta' },
  transaction: { icon: 'repeat', color: colors.emerald600, bg: colors.emerald100, label: 'Transação' },
  system: { icon: 'info', color: colors.purple600, bg: colors.purple100, label: 'Sistema' },
};

const FILTERS: { key: 'all' | NotificationKind; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'reminder', label: 'Lembretes' },
  { key: 'goal', label: 'Metas' },
  { key: 'transaction', label: 'Transações' },
  { key: 'system', label: 'Sistema' },
];

const SETTINGS_ITEMS: { key: keyof NotificationSettings; title: string; subtitle: string }[] = [
  { key: 'reminders', title: 'Lembretes diários', subtitle: 'Lembrar de registrar as transações do dia' },
  { key: 'goals', title: 'Progresso das metas', subtitle: 'Avisar ao criar, chegar na metade e concluir metas' },
  { key: 'transactions', title: 'Transações registradas', subtitle: 'Avisar a cada receita ou despesa adicionada' },
  { key: 'spendingAlerts', title: 'Alertas de gastos', subtitle: 'Avisar quando as despesas do mês passarem das receitas' },
  { key: 'weeklySummary', title: 'Resumo semanal', subtitle: 'Receber um resumo das finanças toda semana' },
];

export function NotificationsModal({ isOpen, onClose, initialTab = 'list' }: NotificationsModalProps) {
  const {
    notifications,
    unreadCount,
    settings,
    toggleSetting,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();
  const [tab, setTab] = useState<'list' | 'settings'>(initialTab);
  const [kindFilter, setKindFilter] = useState<'all' | NotificationKind>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setConfirmClear(false);
    }
  }, [isOpen, initialTab]);

  const visible = notifications.filter((n) => kindFilter === 'all' || n.kind === kindFilter);

  const renderItem = (n: AppNotification) => {
    const info = KIND_INFO[n.kind];
    return (
      <Pressable
        key={n.id}
        onPress={() => markAsRead(n.id)}
        style={[styles.item, !n.read && styles.itemUnread]}
      >
        <View style={[styles.itemIcon, { backgroundColor: info.bg }]}>
          <Feather name={info.icon} size={18} color={info.color} />
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemTopRow}>
            <Text style={[styles.itemKind, { color: info.color }]}>{info.label}</Text>
            <Text style={styles.itemTime}>{formatRelative(n.createdAt)}</Text>
          </View>
          <Text style={[styles.itemTitle, !n.read && { fontWeight: '700' }]}>{n.title}</Text>
          <Text style={styles.itemMessage}>{n.message}</Text>
        </View>
        <View style={styles.itemSide}>
          {!n.read && <View style={styles.unreadDot} />}
          <Pressable onPress={() => removeNotification(n.id)} hitSlop={10} style={styles.removeBtn}>
            <Feather name="x" size={14} color={blackAlpha(0.4)} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notificações</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
            </Text>
          </View>
          {tab === 'list' && unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={styles.headerAction} hitSlop={8}>
              <Feather name="check-circle" size={16} color={colors.emerald600} />
              <Text style={styles.headerActionText}>Ler todas</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('list')} style={[styles.tab, tab === 'list' && styles.tabActive]}>
            <Feather name="bell" size={14} color={tab === 'list' ? colors.white : blackAlpha(0.6)} />
            <Text style={[styles.tabLabel, tab === 'list' && styles.tabLabelActive]}>Avisos</Text>
          </Pressable>
          <Pressable onPress={() => setTab('settings')} style={[styles.tab, tab === 'settings' && styles.tabActive]}>
            <Feather name="sliders" size={14} color={tab === 'settings' ? colors.white : blackAlpha(0.6)} />
            <Text style={[styles.tabLabel, tab === 'settings' && styles.tabLabelActive]}>Configurações</Text>
          </Pressable>
        </View>

        {tab === 'list' ? (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setKindFilter(f.key)}
                  style={[styles.filterChip, kindFilter === f.key && styles.filterChipActive]}
                >
                  <Text style={[styles.filterLabel, kindFilter === f.key && styles.filterLabelActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {visible.length > 0 ? (
              <>
                {visible.map(renderItem)}
                <Pressable
                  style={[styles.clearBtn, confirmClear && { backgroundColor: colors.red500 }]}
                  onPress={() => {
                    if (confirmClear) {
                      clearAll();
                      setConfirmClear(false);
                    } else setConfirmClear(true);
                  }}
                >
                  <Feather name="trash-2" size={15} color={confirmClear ? colors.white : colors.red600} />
                  <Text style={[styles.clearLabel, confirmClear && { color: colors.white }]}>
                    {confirmClear ? 'Toque de novo para confirmar' : 'Limpar todas as notificações'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="bell-off" size={28} color={blackAlpha(0.4)} />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                <Text style={styles.emptyText}>
                  Lembretes, avisos de metas e de transações vão aparecer aqui.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>Quais avisos você quer receber?</Text>
            {SETTINGS_ITEMS.map((item) => (
              <View key={item.key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggleSetting(item.key)}
                  trackColor={{ false: colors.gray300, true: colors.emerald500 }}
                  thumbColor={colors.white}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  headerTitle: { color: colors.text, fontSize: 22 },
  headerSubtitle: { color: blackAlpha(0.5), fontSize: 12, marginTop: 2 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerActionText: { color: colors.emerald600, fontSize: 12 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    maxWidth: 416,
    alignSelf: 'center',
    width: '92%',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.emerald500 },
  tabLabel: { color: blackAlpha(0.6), fontSize: 13 },
  tabLabelActive: { color: colors.white, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40, maxWidth: 448, width: '100%', alignSelf: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.emerald100, borderColor: colors.emerald500 },
  filterLabel: { color: blackAlpha(0.7), fontSize: 12 },
  filterLabelActive: { color: colors.emerald600, fontWeight: '600' },
  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemUnread: { borderColor: colors.emerald200, backgroundColor: colors.cardAlt },
  itemIcon: { width: 40, height: 40, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemKind: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTime: { fontSize: 11, color: blackAlpha(0.4) },
  itemTitle: { color: colors.text, fontSize: 14 },
  itemMessage: { color: blackAlpha(0.6), fontSize: 12, marginTop: 3, lineHeight: 17 },
  itemSide: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald600 },
  removeBtn: { marginTop: 'auto' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.red50,
    marginTop: 8,
  },
  clearLabel: { color: colors.red600, fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 15 },
  emptyText: { color: blackAlpha(0.5), fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  sectionLabel: { color: blackAlpha(0.5), fontSize: 13, marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { color: colors.text, fontSize: 14 },
  settingSubtitle: { color: blackAlpha(0.5), fontSize: 12, marginTop: 2 },
});
