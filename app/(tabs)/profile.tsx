import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoriesModal } from '../../components/CategoriesModal';
import { AchievementsModal } from '../../components/AchievementsModal';
import { AvatarCustomizerModal } from '../../components/AvatarCustomizerModal';
import { AvatarFrame } from '../../components/AvatarFrame';
import { AvatarPickerModal } from '../../components/AvatarPickerModal';
import { EditProfileModal } from '../../components/EditProfileModal';
import { ImportLegacyModal } from '../../components/ImportLegacyModal';
import { UserAvatar } from '../../components/UserAvatar';
import { HelpModal } from '../../components/HelpModal';
import { NotificationsModal } from '../../components/NotificationsModal';
import { blackAlpha, brand, colors, radii, shadow } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLevelUp } from '../../context/LevelUpContext';
import { useProfile } from '../../context/ProfileContext';
import { useTransactions } from '../../context/TransactionsContext';
import { formatCurrency } from '../../utils/format';

export default function Profile() {
  const { transactions } = useTransactions();
  const { profile } = useProfile();
  const { logout } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editAction, setEditAction] = useState<'email' | 'phone' | 'password' | null>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const lv = useLevelUp();
  const earned = lv.medals.filter((m) => m.unlocked);
  const openEdit = (action: 'email' | 'phone' | 'password' | null = null) => {
    setEditAction(action);
    setShowEditProfile(true);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showImportLegacy, setShowImportLegacy] = useState(false);

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = Math.abs(
    transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = income - expenses;
  const savingsRate = income !== 0 ? ((balance / income) * 100).toFixed(0) : '0';

  const getFinancialInsight = () => {
    if (transactions.length === 0) {
      return {
        message: 'Adicione suas transações para receber uma análise financeira personalizada.',
        tip: 'Comece registrando suas receitas e despesas na tela Início.',
        colors: [colors.gray100, colors.gray50] as const,
        border: colors.gray300,
      };
    }
    if (balance > income * 0.3) {
      return {
        message: 'Parabéns! Você está economizando muito bem. Continue assim!',
        tip: 'Considere investir parte dessa economia em aplicações de longo prazo.',
        colors: [colors.emerald100, colors.emerald50] as const,
        border: colors.emerald500,
      };
    } else if (balance > income * 0.1) {
      return {
        message: 'Você está no caminho certo, mas pode melhorar.',
        tip: 'Tente reduzir gastos com alimentação fora de casa e entretenimento.',
        colors: [colors.yellow100, colors.yellow50] as const,
        border: colors.yellow400,
      };
    } else {
      return {
        message: 'Atenção! Suas despesas estão muito altas.',
        tip: 'Revise seus gastos fixos e corte despesas desnecessárias urgentemente.',
        colors: [colors.red100, colors.red50] as const,
        border: colors.red500,
      };
    }
  };

  const insight = getFinancialInsight();

  const accountItems = [
    { icon: 'mail' as const, bg: colors.emerald100, iconColor: colors.emerald600, title: 'E-mail', subtitle: profile.email || 'Não informado' },
    { icon: 'phone' as const, bg: colors.blue100, iconColor: colors.blue600, title: 'Telefone', subtitle: profile.phone || 'Não informado' },
    { icon: 'lock' as const, bg: colors.purple100, iconColor: colors.purple600, title: 'Senha', subtitle: 'Alterar senha' },
  ];

  const preferenceItems = [
    { icon: 'bell' as const, bg: colors.yellow100, iconColor: colors.yellow600, title: 'Notificações', subtitle: 'Avisos e alertas' },
    { icon: 'tag' as const, bg: colors.emerald100, iconColor: colors.emerald600, title: 'Categorias', subtitle: 'Despesas e receitas' },
  ];

  const supportItems = [
    { icon: 'help-circle' as const, bg: colors.orange100, iconColor: colors.orange600, title: 'Central de Ajuda', subtitle: 'FAQ e tutoriais' },
    { icon: 'log-out' as const, bg: colors.red100, iconColor: colors.red600, title: 'Sair', subtitle: 'Desconectar da conta', danger: true },
  ];

  const renderGroup = (
    items: { icon: any; bg: string; iconColor: string; title: string; subtitle: string; danger?: boolean }[],
    onItemPress?: (title: string) => void
  ) => (
    <View style={styles.groupCard}>
      {items.map((item, index) => (
        <Pressable
          key={item.title}
          style={[styles.groupItem, index < items.length - 1 && styles.groupItemBorder]}
          onPress={() => onItemPress?.(item.title)}
        >
          <View style={[styles.groupIconWrap, { backgroundColor: item.bg }]}>
            <Feather name={item.icon} size={18} color={item.iconColor} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupTitle, item.danger && { color: colors.red600 }]}>{item.title}</Text>
            <Text style={styles.groupSubtitle}>{item.subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={blackAlpha(0.3)} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={[colors.bg, colors.bgAlt]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil</Text>
            <Text style={styles.headerSubtitle}>Gerencie sua conta e preferências</Text>
          </View>

          {/* Cartão do usuário: dados vêm da conta autenticada */}
          <LinearGradient
            colors={[brand.greenBright, brand.green, brand.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.profileRow}>
              <Pressable onPress={() => setShowAvatar(true)} accessibilityLabel="Alterar foto de perfil">
                <AvatarFrame level={lv.level} size={80}>
                  <UserAvatar avatar={profile.avatar} name={profile.name} size={80} />
                </AvatarFrame>
                <View style={styles.cameraBadge}>
                  <Feather name="camera" size={13} color={brand.green} />
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
                <View style={styles.profileLine}>
                  <Feather name="mail" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.profileEmail} numberOfLines={1}>{profile.email}</Text>
                </View>
                <View style={styles.profileLine}>
                  <Feather name="phone" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.profileEmail} numberOfLines={1}>{profile.phone || 'Telefone não informado'}</Text>
                </View>
                <Pressable style={styles.editBtn} onPress={() => openEdit()}>
                  <Feather name="edit-2" size={12} color={brand.green} />
                  <Text style={styles.editBtnLabel}>Editar perfil</Text>
                </Pressable>
              </View>
            </View>

            {/* Level Up: nível, título, progresso, avatar e medalhas */}
            <View style={styles.levelBox}>
              <View style={styles.levelTop}>
                <View style={styles.levelBadge}>
                  <MaterialCommunityIcons name="star-circle" size={14} color={brand.green} />
                  <Text style={styles.levelBadgeText}>Nível {lv.level}</Text>
                </View>
                <Text style={styles.levelTitle} numberOfLines={1}>{lv.title}</Text>
                <Text style={styles.levelXp}>{lv.xp} XP</Text>
              </View>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${lv.progress * 100}%` }]} />
              </View>
              <Text style={styles.levelHint}>
                {lv.nextLevelXp !== null ? `Faltam ${lv.nextLevelXp - lv.xp} XP para o nível ${lv.level + 1}` : 'Nível máximo alcançado'}
              </Text>
              <View style={styles.levelActions}>
                <Pressable style={styles.customizeBtn} onPress={() => setShowCustomizer(true)}>
                  <MaterialCommunityIcons name="face-man-shimmer-outline" size={16} color={brand.green} />
                  <Text style={styles.customizeLabel}>Personalizar avatar</Text>
                </Pressable>
                <Pressable style={styles.medalsBtn} onPress={() => setShowAchievements(true)} accessibilityLabel="Ver medalhas">
                  {earned.slice(0, 3).map((m) => (
                    <View key={m.def.id} style={[styles.medalDot, { backgroundColor: m.def.color }]}>
                      <MaterialCommunityIcons name={m.def.icon as any} size={12} color={colors.white} />
                    </View>
                  ))}
                  {earned.length === 0 && <MaterialCommunityIcons name="medal-outline" size={16} color={colors.white} />}
                  <Text style={styles.medalsLabel}>
                    {earned.length}/{lv.medals.length}
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          <LinearGradient colors={insight.colors} style={[styles.insightBox, { borderLeftColor: insight.border }]}>
            <Text style={styles.insightTitle}>Análise Financeira</Text>
            <Text style={styles.insightMessage}>{insight.message}</Text>
            <View style={styles.insightStatsRow}>
              <View style={styles.insightStatBox}>
                <Text style={styles.insightStatLabel}>Taxa de Economia</Text>
                <Text style={[styles.insightStatValue, { color: colors.emerald600 }]}>{savingsRate}%</Text>
              </View>
              <View style={styles.insightStatBox}>
                <Text style={styles.insightStatLabel}>Saldo do Mês</Text>
                <Text style={[styles.insightStatValue, { color: colors.text }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>
            <View style={styles.insightTipBox}>
              <Text style={styles.insightTipText}>
                <Text style={{ fontWeight: '700' }}>Dica: </Text>
                {insight.tip}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Conta</Text>
            {renderGroup(accountItems, (title) => {
              if (title === 'E-mail') openEdit('email');
              if (title === 'Telefone') openEdit('phone');
              if (title === 'Senha') openEdit('password');
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Preferências</Text>
            {renderGroup(preferenceItems, (title) => {
              if (title === 'Notificações') setShowNotifications(true);
              if (title === 'Categorias') setShowCategories(true);
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Seus dados</Text>
            <Pressable onPress={() => setShowImportLegacy(true)} style={[styles.groupCard, { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Feather name="database" size={21} color={brand.green} />
              <View style={{ flex: 1 }}><Text style={styles.groupTitle}>Importar dados antigos</Text><Text style={styles.groupSubtitle}>Recuperar registros salvos neste aparelho</Text></View>
              <Feather name="chevron-right" size={18} color={blackAlpha(0.3)} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Suporte</Text>
            {renderGroup(supportItems, (title) => {
              if (title === 'Central de Ajuda') setShowHelp(true);
              if (title === 'Sair') logout();
            })}
          </View>

          <Text style={styles.versionText}>MonY · versão 1.1.0</Text>
        </ScrollView>

        <EditProfileModal isOpen={showEditProfile} initialAction={editAction} onClose={() => setShowEditProfile(false)} />
        <AvatarPickerModal isOpen={showAvatar} onClose={() => setShowAvatar(false)} />
        <AvatarCustomizerModal isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />
        <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
        <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <CategoriesModal isOpen={showCategories} onClose={() => setShowCategories(false)} />
        <ImportLegacyModal isOpen={showImportLegacy} onClose={() => setShowImportLegacy(false)} />
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
  profileCard: {
    borderRadius: radii['3xl'],
    padding: 24,
    marginBottom: 24,
    ...shadow.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  levelBox: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  levelBadgeText: { color: brand.green, fontWeight: '800', fontSize: 12 },
  levelTitle: { flex: 1, color: colors.white, fontWeight: '700', fontSize: 14 },
  levelXp: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  levelTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 10, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: 4, backgroundColor: '#bbf7d0' },
  levelHint: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 5 },
  levelActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  customizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: 10,
  },
  customizeLabel: { color: brand.green, fontWeight: '700', fontSize: 13 },
  medalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  medalDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.white, marginLeft: -6 },
  medalsLabel: { color: colors.white, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
  },
  profileLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  profileEmail: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },
  editBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  editBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.green,
  },
  insightBox: {
    borderRadius: radii['2xl'],
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  insightTitle: {
    color: colors.text,
    marginBottom: 8,
  },
  insightMessage: {
    fontSize: 14,
    color: blackAlpha(0.8),
    marginBottom: 12,
  },
  insightStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  insightStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: radii.xl,
    padding: 12,
  },
  insightStatLabel: {
    fontSize: 11,
    color: blackAlpha(0.6),
    marginBottom: 4,
  },
  insightStatValue: {
    fontSize: 17,
  },
  insightTipBox: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: radii.xl,
    padding: 12,
  },
  insightTipText: {
    fontSize: 12,
    color: blackAlpha(0.7),
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    ...shadow.sm,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  groupItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 14,
    color: colors.text,
  },
  groupSubtitle: {
    fontSize: 12,
    color: blackAlpha(0.5),
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: blackAlpha(0.4),
    marginTop: 24,
  },
});
