import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand, colors, radii } from '../constants/theme';
import { Avatar, errorMessage, useAuth } from '../context/AuthContext';
import { AVATAR_PRESETS, INITIALS_COLORS, UserAvatar } from './UserAvatar';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Candidate =
  | { kind: 'avatar'; avatar: Avatar }
  | { kind: 'photo'; uri: string; base64: string; mime: string };

const sameAvatar = (a?: Avatar | null, b?: Avatar | null) => !!a && !!b && a.type === b.type && a.value === b.value;

export function AvatarPickerModal({ isOpen, onClose }: AvatarPickerModalProps) {
  const { user, setAvatar, restorePreviousAvatar } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCandidate(null);
      setMessage(null);
    }
  }, [isOpen]);

  if (!user) return null;

  const current = user.avatar;
  const previewAvatar = candidate?.kind === 'avatar' ? candidate.avatar : current;
  const changed =
    candidate !== null && (candidate.kind === 'photo' || !sameAvatar(candidate.avatar, current));

  const pickFromGallery = async () => {
    setMessage(null);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setMessage({
            kind: 'error',
            text: 'Permita o acesso às fotos nas configurações do celular para escolher uma imagem.',
          });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      let base64 = asset.base64 ?? '';
      let mime = asset.mimeType ?? 'image/jpeg';
      if (!base64 && asset.uri.startsWith('data:')) {
        const m = asset.uri.match(/^data:([^;]+);base64,(.*)$/);
        if (m) {
          mime = m[1];
          base64 = m[2];
        }
      }
      if (!base64) {
        setMessage({ kind: 'error', text: 'Não foi possível ler essa imagem. Tente outra.' });
        return;
      }
      if (base64.length > 6_800_000) {
        setMessage({ kind: 'error', text: 'Essa imagem é muito grande (máx. 5 MB). Escolha outra ou recorte menor.' });
        return;
      }
      setCandidate({ kind: 'photo', uri: asset.uri, base64, mime });
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    }
  };

  const save = async () => {
    if (!candidate || !changed) return;
    setSaving(true);
    setMessage(null);
    try {
      if (candidate.kind === 'photo') await setAvatar({ photoBase64: candidate.base64, mime: candidate.mime });
      else await setAvatar(candidate.avatar);
      setCandidate(null);
      setMessage({ kind: 'success', text: 'Foto de perfil atualizada.' });
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await restorePreviousAvatar();
      setCandidate(null);
      setMessage({ kind: 'success', text: 'Voltamos para a sua foto anterior.' });
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (a: Avatar) => sameAvatar(previewAvatar, a) && candidate?.kind !== 'photo';

  const renderOption = (a: Avatar, key: string, label: string) => (
    <Pressable
      key={key}
      onPress={() => setCandidate({ kind: 'avatar', avatar: a })}
      style={styles.option}
      accessibilityLabel={label}
    >
      <View style={[styles.optionRing, isSelected(a) && styles.optionRingOn]}>
        <UserAvatar avatar={a} name={user.name} size={58} />
      </View>
      {isSelected(a) && (
        <View style={styles.optionCheck}>
          <Feather name="check" size={11} color={colors.white} />
        </View>
      )}
    </Pressable>
  );

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8} accessibilityLabel="Voltar">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Foto de perfil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* pré-visualização */}
          <View style={styles.previewBox}>
            <UserAvatar
              avatar={previewAvatar}
              name={user.name}
              size={124}
              previewUri={candidate?.kind === 'photo' ? candidate.uri : undefined}
            />
            <Text style={styles.previewName}>{user.name}</Text>
            <Text style={styles.previewHint}>
              {changed ? 'Pré-visualização — toque em Salvar para confirmar' : 'Foto atual'}
            </Text>
          </View>

          {!!message && (
            <View style={[styles.msg, message.kind === 'error' ? styles.msgError : styles.msgSuccess]}>
              <Feather
                name={message.kind === 'error' ? 'alert-circle' : 'check-circle'}
                size={15}
                color={message.kind === 'error' ? colors.red600 : brand.green}
              />
              <Text style={[styles.msgText, { color: message.kind === 'error' ? colors.red700 : brand.green }]}>
                {message.text}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={pickFromGallery}>
              <Feather name="image" size={17} color={brand.green} />
              <Text style={styles.actionLabel}>Escolher da galeria</Text>
            </Pressable>
            {user.hasPreviousAvatar && (
              <Pressable style={styles.actionBtn} onPress={restore} disabled={saving}>
                <Feather name="rotate-ccw" size={16} color={brand.green} />
                <Text style={styles.actionLabel}>Voltar ao anterior</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.section}>Personagens</Text>
          <View style={styles.grid}>
            {AVATAR_PRESETS.filter((p) => /^p\d+$/.test(p.id)).map((p) =>
              renderOption({ type: 'preset', value: p.id }, p.id, p.label)
            )}
          </View>

          <Text style={styles.section}>Bichinhos</Text>
          <View style={styles.grid}>
            {AVATAR_PRESETS.filter((p) => p.id.startsWith('a_')).map((p) =>
              renderOption({ type: 'preset', value: p.id }, p.id, p.label)
            )}
          </View>

          <Text style={styles.section}>Ilustrações</Text>
          <View style={styles.grid}>
            {AVATAR_PRESETS.filter((p) => p.id.startsWith('i_')).map((p) =>
              renderOption({ type: 'preset', value: p.id }, p.id, p.label)
            )}
          </View>

          <Text style={styles.section}>Suas iniciais</Text>
          <View style={styles.grid}>
            {INITIALS_COLORS.map((_, i) =>
              renderOption({ type: 'initials', value: String(i) }, `ini${i}`, `Iniciais, cor ${i + 1}`)
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={[styles.footerBtn, styles.cancelBtn]} onPress={changed ? () => setCandidate(null) : onClose}>
            <Text style={styles.cancelLabel}>{changed ? 'Descartar' : 'Fechar'}</Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtn, styles.saveBtn, (!changed || saving) && { opacity: 0.45 }]}
            onPress={save}
            disabled={!changed || saving}
          >
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveLabel}>Salvar</Text>}
          </Pressable>
        </View>
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
    padding: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 20, paddingBottom: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  previewBox: { alignItems: 'center', paddingVertical: 12 },
  previewName: { marginTop: 12, fontSize: 17, fontWeight: '700', color: colors.text },
  previewHint: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  msg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.xl,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  msgError: { backgroundColor: colors.red50, borderColor: colors.red100 },
  msgSuccess: { backgroundColor: brand.greenSoft, borderColor: brand.greenBorder },
  msgText: { flex: 1, fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: brand.greenBorder,
    backgroundColor: brand.greenSoft,
  },
  actionLabel: { color: brand.green, fontWeight: '600', fontSize: 14 },
  section: { marginTop: 22, marginBottom: 10, fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  option: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  optionRing: { padding: 2, borderRadius: 40, borderWidth: 2, borderColor: 'transparent' },
  optionRingOn: { borderColor: brand.green },
  optionCheck: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: brand.green,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  footerBtn: { flex: 1, height: 50, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: colors.gray100 },
  cancelLabel: { color: colors.text, fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: brand.green },
  saveLabel: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
