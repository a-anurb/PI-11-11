import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand, colors, radii } from '../constants/theme';
import { errorMessage, useAuth } from '../context/AuthContext';
import { useLevelUp } from '../context/LevelUpContext';
import {
  applyBase,
  AvatarConfig,
  BACKGROUNDS,
  BASES,
  CatalogItem,
  DEFAULT_CONFIG,
  decodeConfig,
  EARRINGS,
  encodeConfig,
  FACIAL,
  GLASSES,
  HAIR_COLORS,
  HAIRS,
  HEADWEAR,
  isUnlocked,
  lockedItemsIn,
  NECKLACES,
  OUTFIT_COLORS,
  OUTFITS,
  randomConfig,
  SKINS,
  Unlock,
} from '../lib/avatarCatalog';
import { LEVELS, MEDALS } from '../lib/levelUp';
import { AvatarFrame } from './AvatarFrame';
import { AccessoryIcon, CustomAvatarSvg, GarmentIcon, SceneThumb } from './RealisticAvatar';

type Tab = 'base' | 'hair' | 'outfit' | 'acc' | 'bg';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'base', label: 'Personagem', icon: 'account-outline' },
  { key: 'hair', label: 'Cabelo', icon: 'content-cut' },
  { key: 'outfit', label: 'Roupa', icon: 'tshirt-crew-outline' },
  { key: 'acc', label: 'Acessórios', icon: 'sunglasses' },
  { key: 'bg', label: 'Fundo', icon: 'palette-outline' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function AvatarCustomizerModal({ isOpen, onClose, onSaved }: Props) {
  const { user, setAvatar } = useAuth();
  const lv = useLevelUp();
  const [cfg, setCfg] = useState<AvatarConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>('base');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCfg(user?.avatar?.type === 'custom' ? decodeConfig(user.avatar.value) : DEFAULT_CONFIG);
    setTab('base');
    setHint('');
    setError('');
  }, [isOpen]);

  if (!user) return null;

  const unlockText = (u: Unlock) => {
    if (u.kind === 'level') {
      const target = LEVELS.find((l) => l.level === u.level)!;
      const missing = Math.max(0, target.xp - lv.xp);
      return `Libera no nível ${u.level} (${target.title}) — faltam ${missing} XP.`;
    }
    if (u.kind === 'medal') {
      const m = MEDALS.find((x) => x.id === u.medal)!;
      return `Libera com a medalha "${m.name}": ${m.condition}`;
    }
    return '';
  };
  const lockBadge = (u: Unlock) =>
    u.kind === 'level' ? `Nível ${u.level}` : u.kind === 'medal' ? MEDALS.find((x) => x.id === u.medal)!.name : '';

  const pick = <K extends keyof AvatarConfig>(key: K, item: CatalogItem<any>) => {
    if (!isUnlocked(item.unlock, lv.level, lv.unlockedMedals)) {
      setHint(`${item.label} está bloqueado. ${unlockText(item.unlock)}`);
      return;
    }
    setHint('');
    setError('');
    setCfg((c) => (key === 'base' ? applyBase(c, item.id) : { ...c, [key]: item.id }));
  };
  const clearMsgs = () => {
    setHint('');
    setError('');
  };
  const outfitHex = (OUTFIT_COLORS.find((o) => o.id === cfg.outfitColor) ?? OUTFIT_COLORS[0]).value;

  const original = user.avatar?.type === 'custom' ? user.avatar.value : null;
  const encoded = encodeConfig(cfg);
  const changed = encoded !== original;

  const save = async () => {
    const locked = lockedItemsIn(cfg, lv.level, lv.unlockedMedals);
    if (locked.length) {
      setError(`Ainda bloqueado: ${locked.map((l) => l.label).join(', ')}.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setAvatar({ type: 'custom', value: encoded });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // miniatura do avatar com uma opção trocada
  const Thumb = ({ patch }: { patch: Partial<AvatarConfig> }) => (
    <CustomAvatarSvg config={encodeConfig({ ...cfg, ...patch })} size={58} plain />
  );

  const Tile = ({
    item,
    selected,
    onPress,
    children,
    extra,
    wide,
    noLabel,
  }: {
    item: CatalogItem<any>;
    selected: boolean;
    onPress: () => void;
    children: ReactNode;
    extra?: ReactNode;
    wide?: boolean;
    noLabel?: boolean;
  }) => {
    const locked = !isUnlocked(item.unlock, lv.level, lv.unlockedMedals);
    return (
      <Pressable onPress={onPress} style={[styles.tile, wide && styles.tileWide, selected && styles.tileOn]} accessibilityLabel={item.label}>
        <View style={[styles.tileArt, locked && { opacity: 0.35 }]}>{children}</View>
        {!noLabel && (
          <View style={styles.tileLabelRow}>
            <Text style={[styles.tileLabel, locked && { color: colors.gray400 }]} numberOfLines={1}>
              {item.label}
            </Text>
            {extra}
          </View>
        )}
        {locked && (
          <View style={styles.lock}>
            <Feather name="lock" size={11} color={colors.white} />
            <Text style={styles.lockText} numberOfLines={1}>
              {lockBadge(item.unlock)}
            </Text>
          </View>
        )}
        {selected && !locked && (
          <View style={styles.check}>
            <Feather name="check" size={11} color={colors.white} />
          </View>
        )}
      </Pressable>
    );
  };

  const Swatch = ({ item, selected, onPress, color }: { item: CatalogItem<any>; selected: boolean; onPress: () => void; color: string | [string, string] }) => {
    const locked = !isUnlocked(item.unlock, lv.level, lv.unlockedMedals);
    const pair = Array.isArray(color) ? color : [color, color];
    return (
      <Pressable onPress={onPress} style={styles.swatchWrap} accessibilityLabel={item.label}>
        <View style={[styles.swatchRing, selected && { borderColor: brand.green }]}>
          <LinearGradient colors={pair as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.swatch, locked && { opacity: 0.35 }]}>
            {locked && <Feather name="lock" size={13} color={colors.text} />}
            {selected && !locked && (
              <View style={styles.swatchCheck}>
                <Feather name="check" size={12} color={brand.green} />
              </View>
            )}
          </LinearGradient>
        </View>
        <Text style={[styles.swatchLabel, locked && { color: colors.gray400 }]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8} accessibilityLabel="Voltar sem salvar">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Personalizar avatar</Text>
          <View style={styles.levelChip}>
            <MaterialCommunityIcons name="star-circle" size={14} color={brand.green} />
            <Text style={styles.levelChipText}>Nível {lv.level}</Text>
          </View>
        </View>

        {/* pré-visualização */}
        <View style={styles.preview}>
          <AvatarFrame level={lv.level} size={150}>
            <CustomAvatarSvg config={encoded} size={150} />
          </AvatarFrame>
          <Text style={styles.previewHint}>{changed ? 'Pré-visualização — salve para aplicar' : 'Seu avatar atual'}</Text>
        </View>

        {/* abas */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => { setTab(t.key); setHint(''); }} style={[styles.tab, tab === t.key && styles.tabOn]}>
              <MaterialCommunityIcons name={t.icon as any} size={18} color={tab === t.key ? colors.white : brand.green} />
              <Text style={[styles.tabLabel, tab === t.key && { color: colors.white }]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {tab === 'base' && (
            <>
              <Section title="Escolha um personagem">
                {BASES.map((b) => (
                  <Tile key={b.id} item={b} selected={cfg.base === b.id} onPress={() => pick('base', b)} noLabel>
                    <CustomAvatarSvg config={encodeConfig(applyBase(cfg, b.id))} size={68} plain />
                  </Tile>
                ))}
              </Section>
              <Section title="Tom de pele">
                {SKINS.map((sk) => (
                  <Swatch key={sk.id} item={sk} color={sk.value} selected={cfg.skin === sk.id} onPress={() => pick('skin', sk)} />
                ))}
              </Section>
              <Text style={styles.sectionTitle}>Traços do rosto</Text>
              <View style={styles.segment}>
                {[
                  { v: 'm', label: 'Masculino', icon: 'gender-male' },
                  { v: 'f', label: 'Feminino', icon: 'gender-female' },
                ].map((o) => (
                  <Pressable
                    key={o.v}
                    onPress={() => {
                      clearMsgs();
                      setCfg((c) => ({ ...c, body: o.v }));
                    }}
                    style={[styles.segmentBtn, cfg.body === o.v && styles.segmentOn]}
                    accessibilityLabel={`Traços ${o.label}`}
                  >
                    <MaterialCommunityIcons name={o.icon as any} size={16} color={cfg.body === o.v ? colors.white : brand.green} />
                    <Text style={[styles.segmentText, cfg.body === o.v && { color: colors.white }]}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.note}>Tons de pele, traços e tipos de cabelo são sempre liberados. Itens de estilo liberam com o Level Up.</Text>
            </>
          )}

          {tab === 'hair' && (
            <>
              {(['curto', 'longo'] as const).map((g) => (
                <Section key={g} title={g === 'curto' ? 'Cabelos curtos' : 'Cabelos longos e presos'}>
                  {HAIRS.filter((h) => h.group === g).map((h) => (
                    <Tile key={h.id} item={h} selected={cfg.hair === h.id} onPress={() => pick('hair', h)}>
                      <Thumb patch={{ hair: h.id, head: 'none', glasses: 'none' }} />
                    </Tile>
                  ))}
                </Section>
              ))}
              <Section title="Cor do cabelo">
                {HAIR_COLORS.map((c) => (
                  <Swatch key={c.id} item={c} color={c.value} selected={cfg.hairColor === c.id} onPress={() => pick('hairColor', c)} />
                ))}
              </Section>
              <Section title="Barba">
                {FACIAL.map((f) => (
                  <Tile key={f.id} item={f} selected={cfg.facial === f.id} onPress={() => pick('facial', f)}>
                    <Thumb patch={{ facial: f.id }} />
                  </Tile>
                ))}
              </Section>
            </>
          )}

          {tab === 'outfit' && (
            <>
              <Section title="Cor da roupa">
                {OUTFIT_COLORS.map((c) => (
                  <Swatch key={c.id} item={c} color={c.value} selected={cfg.outfitColor === c.id} onPress={() => pick('outfitColor', c)} />
                ))}
              </Section>
              <Section title="Blusas e camisas">
                {OUTFITS.map((o) => (
                  <Tile key={o.id} item={o} selected={cfg.outfit === o.id} onPress={() => pick('outfit', o)} wide>
                    <GarmentIcon type={o.id} color={outfitHex} size={72} />
                  </Tile>
                ))}
              </Section>
            </>
          )}

          {tab === 'acc' && (
            <>
              <Section title="Óculos">
                {GLASSES.map((g) => (
                  <Tile key={g.id} item={g} selected={cfg.glasses === g.id} onPress={() => pick('glasses', g)}>
                    <AccessoryIcon group="glasses" value={g.id} size={58} />
                  </Tile>
                ))}
              </Section>
              <Section title="Bonés, chapéus e fones">
                {HEADWEAR.map((h) => (
                  <Tile key={h.id} item={h} selected={cfg.head === h.id} onPress={() => pick('head', h)}>
                    <AccessoryIcon group="head" value={h.id} size={58} />
                  </Tile>
                ))}
              </Section>
              <Section title="Brincos">
                {EARRINGS.map((e) => (
                  <Tile key={e.id} item={e} selected={cfg.earrings === e.id} onPress={() => pick('earrings', e)}>
                    <AccessoryIcon group="earrings" value={e.id} size={58} />
                  </Tile>
                ))}
              </Section>
              <Section title="Colares">
                {NECKLACES.map((n) => (
                  <Tile key={n.id} item={n} selected={cfg.necklace === n.id} onPress={() => pick('necklace', n)}>
                    <AccessoryIcon group="necklace" value={n.id} size={58} />
                  </Tile>
                ))}
              </Section>
            </>
          )}

          {tab === 'bg' && (
            <>
              <Section title="Cenários">
                {BACKGROUNDS.filter((b) => b.value.kind === 'scene').map((b) => (
                  <Tile key={b.id} item={b} selected={cfg.bg === b.id} onPress={() => pick('bg', b)} wide>
                    <View style={styles.sceneBox}>
                      {b.value.kind === 'scene' && <SceneThumb scene={b.value.scene} width={96} height={64} />}
                    </View>
                  </Tile>
                ))}
              </Section>
              <Section title="Cores">
                {BACKGROUNDS.filter((b) => b.value.kind !== 'scene').map((b) => (
                  <Swatch key={b.id} item={b} color={b.value.kind !== 'scene' ? b.value.colors : '#fff'} selected={cfg.bg === b.id} onPress={() => pick('bg', b)} />
                ))}
              </Section>
            </>
          )}
        </ScrollView>

        {!!hint && (
          <View style={styles.hint}>
            <Feather name="lock" size={14} color={brand.blue} />
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        )}
        {!!error && (
          <View style={[styles.hint, { backgroundColor: colors.red50, borderColor: colors.red100 }]}>
            <Feather name="alert-circle" size={14} color={colors.red600} />
            <Text style={[styles.hintText, { color: colors.red700 }]}>{error}</Text>
          </View>
        )}

        <View style={styles.toolbar}>
          {[
            { label: 'Restaurar padrão', icon: 'restore', on: () => setCfg(DEFAULT_CONFIG) },
            { label: cfg.body === 'f' ? 'Traços ♀' : 'Traços ♂', a11y: 'Trocar traços', icon: 'gender-male-female', on: () => setCfg((c) => ({ ...c, body: c.body === 'f' ? 'm' : 'f' })) },
            { label: 'Surpresa', icon: 'palette', on: () => setCfg((c) => randomConfig(lv.level, lv.unlockedMedals, c)) },
            { label: 'Restaurar base', icon: 'account-convert', on: () => setCfg((c) => applyBase(c, c.base)) },
          ].map((t) => (
            <Pressable
              key={t.icon}
              onPress={() => {
                clearMsgs();
                t.on();
              }}
              style={styles.toolBtn}
              accessibilityLabel={t.a11y ?? t.label}
            >
              <MaterialCommunityIcons name={t.icon as any} size={19} color={brand.green} />
              <Text style={styles.toolText} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable style={[styles.footerBtn, styles.cancelBtn]} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
          <Pressable style={[styles.footerBtn, styles.saveBtn, (saving || !changed) && { opacity: 0.5 }]} onPress={save} disabled={saving || !changed}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveLabel}>Salvar alterações</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: colors.text },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full, backgroundColor: brand.greenSoft },
  levelChipText: { color: brand.green, fontWeight: '700', fontSize: 12 },
  preview: { alignItems: 'center', paddingBottom: 10 },
  previewHint: { marginTop: 8, fontSize: 12, color: colors.textMuted },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, maxWidth: 520, width: '100%', alignSelf: 'center', marginBottom: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: radii.xl, backgroundColor: brand.greenSoft },
  tabOn: { backgroundColor: brand.green },
  tabLabel: { fontSize: 10.5, fontWeight: '600', color: brand.green },
  body: { padding: 16, paddingBottom: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: 82, alignItems: 'center', paddingVertical: 8, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white },
  tileWide: { width: 112, paddingHorizontal: 4 },
  tileArt: { borderRadius: 12, overflow: 'hidden' },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4, paddingHorizontal: 2, maxWidth: '100%' },
  sceneBox: { width: 96, height: 64, borderRadius: 10, overflow: 'hidden' },
  segment: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radii.xl, backgroundColor: brand.greenSoft, borderWidth: 1, borderColor: brand.greenBorder },
  segmentOn: { backgroundColor: brand.green, borderColor: brand.green },
  segmentText: { fontSize: 13, fontWeight: '600', color: brand.green },
  note: { fontSize: 11.5, color: colors.textMuted, lineHeight: 16, marginBottom: 6 },
  toolbar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, maxWidth: 520, width: '100%', alignSelf: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  toolBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 7, borderRadius: radii.xl, backgroundColor: brand.greenSoft },
  toolText: { fontSize: 10, fontWeight: '600', color: brand.green },
  tileOn: { borderColor: brand.green, backgroundColor: brand.greenSoft },
  tileLabel: { fontSize: 10.5, color: colors.text, flexShrink: 1 },
  lock: { position: 'absolute', top: 4, left: 4, right: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: 'rgba(17,24,39,0.75)', borderRadius: radii.full, paddingVertical: 2, paddingHorizontal: 4 },
  lockText: { color: colors.white, fontSize: 9, fontWeight: '700', flexShrink: 1 },
  check: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: brand.green, alignItems: 'center', justifyContent: 'center' },
  swatchWrap: { width: 62, alignItems: 'center' },
  swatchRing: { padding: 2, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  swatchCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 10, color: colors.text, marginTop: 3 },
  restore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  restoreText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  hint: { flexDirection: 'row', gap: 8, alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: radii.xl, backgroundColor: brand.blueSoft, borderWidth: 1, borderColor: '#cfe2e8', maxWidth: 488, alignSelf: 'center' },
  hintText: { flex: 1, fontSize: 12.5, color: '#21576b', lineHeight: 17 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 10, maxWidth: 520, width: '100%', alignSelf: 'center' },
  footerBtn: { flex: 1, height: 50, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: colors.gray100 },
  cancelLabel: { color: colors.text, fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: brand.green },
  saveLabel: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
