import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand, colors, radii } from '../constants/theme';
import { useLevelUp } from '../context/LevelUpContext';
import { CATALOG, isUnlocked } from '../lib/avatarCatalog';
import { LEVELS } from '../lib/levelUp';

export function AchievementsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const lv = useLevelUp();
  const unlocked = lv.medals.filter((m) => m.unlocked);
  const locked = lv.medals.filter((m) => !m.unlocked);
  const next = LEVELS.find((l) => l.level === lv.level + 1);
  // itens de avatar que o próximo nível libera
  const nextItems = next
    ? Object.values(CATALOG)
        .flat()
        .filter((i) => i.unlock.kind === 'level' && i.unlock.level === next.level)
        .map((i) => i.label)
    : [];
  const avatarItems = Object.values(CATALOG).flat();
  const freeOrUnlocked = avatarItems.filter((i) => isUnlocked(i.unlock, lv.level, lv.unlockedMedals)).length;

  const MedalRow = ({ m }: { m: (typeof lv.medals)[number] }) => (
    <View style={[styles.medal, !m.unlocked && styles.medalLocked]}>
      <View style={[styles.medalIcon, { backgroundColor: m.unlocked ? m.def.color : colors.gray200 }]}>
        <MaterialCommunityIcons name={m.def.icon as any} size={22} color={m.unlocked ? colors.white : colors.gray400} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.medalTop}>
          <Text style={[styles.medalName, !m.unlocked && { color: colors.textMuted }]}>{m.def.name}</Text>
          {m.unlocked ? (
            <View style={styles.badgeOk}>
              <Feather name="check" size={10} color={colors.white} />
              <Text style={styles.badgeOkText}>Conquistada</Text>
            </View>
          ) : (
            <Feather name="lock" size={13} color={colors.gray400} />
          )}
        </View>
        <Text style={styles.medalDesc}>{m.def.description}</Text>
        <Text style={styles.medalCond}>
          <Text style={{ fontWeight: '700' }}>Como conseguir: </Text>
          {m.def.condition}
        </Text>
        {!m.unlocked && m.progress && (
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(m.progress.current / m.progress.target) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {m.progress.current}/{m.progress.target}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8} accessibilityLabel="Voltar">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Minhas conquistas</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.levelCard}>
            <View style={styles.levelTop}>
              <View>
                <Text style={styles.levelLabel}>Nível {lv.level}</Text>
                <Text style={styles.levelTitle}>{lv.title}</Text>
              </View>
              <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>{lv.xp} XP</Text>
              </View>
            </View>
            <View style={styles.bigTrack}>
              <View style={[styles.bigFill, { width: `${lv.progress * 100}%` }]} />
            </View>
            <Text style={styles.levelHint}>
              {next ? `Faltam ${next.xp - lv.xp} XP para o nível ${next.level} (${next.title}).` : 'Você está no nível máximo!'}
            </Text>
            {nextItems.length > 0 && (
              <Text style={styles.levelHint}>
                No próximo nível você libera: {nextItems.slice(0, 6).join(', ')}
                {nextItems.length > 6 ? '…' : ''}.
              </Text>
            )}
            <Text style={styles.levelHint}>
              Itens de avatar liberados: {freeOrUnlocked} de {avatarItems.length}
            </Text>
          </View>

          <Text style={styles.section}>Como ganhar XP</Text>
          <View style={styles.card}>
            {[
              ['Registrar uma transação', '+10 XP (até 5 por dia)'],
              ['Criar uma meta', '+25 XP (até 4 metas)'],
              ['Concluir uma meta', '+100 XP'],
              ['Criar uma categoria', '+15 XP (até 3)'],
              ['Salvar uma simulação', '+10 XP (até 5)'],
              ['Completar o perfil (telefone + avatar ou foto)', '+30 XP'],
            ].map(([a, b]) => (
              <View key={a} style={styles.xpRow}>
                <Text style={styles.xpRowLabel}>{a}</Text>
                <Text style={styles.xpRowValue}>{b}</Text>
              </View>
            ))}
            <Text style={styles.note}>
              O XP premia a constância na organização — não depende do seu saldo nem de quanto você gasta.
            </Text>
          </View>

          <Text style={styles.section}>
            Conquistadas ({unlocked.length}/{lv.medals.length})
          </Text>
          {unlocked.length === 0 ? (
            <Text style={styles.empty}>Você ainda não tem medalhas. Comece registrando uma transação!</Text>
          ) : (
            unlocked.map((m) => <MedalRow key={m.def.id} m={m} />)
          )}

          {locked.length > 0 && <Text style={styles.section}>Ainda não conquistadas</Text>}
          {locked.map((m) => (
            <MedalRow key={m.def.id} m={m} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 16, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center' },
  levelCard: { backgroundColor: brand.green, borderRadius: radii['2xl'], padding: 16 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  levelTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
  xpPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.full },
  xpPillText: { color: colors.white, fontWeight: '700' },
  bigTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 14, overflow: 'hidden' },
  bigFill: { height: '100%', borderRadius: 5, backgroundColor: '#bbf7d0' },
  levelHint: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 8, lineHeight: 17 },
  section: { marginTop: 22, marginBottom: 8, fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { backgroundColor: colors.white, borderRadius: radii['2xl'], padding: 14, borderWidth: 1, borderColor: colors.border },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  xpRowLabel: { flex: 1, fontSize: 13, color: colors.text },
  xpRowValue: { fontSize: 12, fontWeight: '700', color: brand.green },
  note: { fontSize: 11.5, color: colors.textMuted, marginTop: 10, lineHeight: 16 },
  empty: { fontSize: 13, color: colors.textMuted },
  medal: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: radii.xl, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  medalLocked: { backgroundColor: '#fafafa' },
  medalIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  medalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  medalName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  badgeOk: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: brand.green, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.full },
  badgeOkText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  medalDesc: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  medalCond: { fontSize: 12, color: colors.text, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.gray200, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: brand.green },
  progressText: { fontSize: 11, color: colors.textMuted },
});
