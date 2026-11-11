import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand, colors, radii } from '../constants/theme';
import { errorMessage, useAuth } from '../context/AuthContext';
import { AvatarPickerModal } from './AvatarPickerModal';
import { UserAvatar } from './UserAvatar';
import { ChangeKind, PrimaryButton, VerifyChangeModal } from './VerifyChangeModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** abre direto a troca de e-mail/telefone/senha */
  initialAction?: 'email' | 'phone' | 'password' | null;
}

export function EditProfileModal({ isOpen, onClose, initialAction = null }: EditProfileModalProps) {
  const { user, updateName } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [verify, setVerify] = useState<ChangeKind | null>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name);
    setMsg(null);
    if (initialAction === 'email' || initialAction === 'phone') setVerify(initialAction);
    if (initialAction === 'password') setShowPassword(true);
  }, [isOpen]);

  if (!user) return null;

  const nameChanged = name.trim() !== user.name;

  const saveName = async () => {
    if (name.trim().length < 2) return setMsg({ kind: 'error', text: 'Informe seu nome.' });
    setSaving(true);
    setMsg(null);
    try {
      await updateName(name.trim());
      setMsg({ kind: 'success', text: 'Nome atualizado.' });
    } catch (e) {
      setMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const Row = ({
    icon,
    label,
    value,
    action,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    action: string;
    onPress: () => void;
  }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={17} color={brand.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, !value && { color: colors.gray400 }]} numberOfLines={1}>
          {value || 'Não informado'}
        </Text>
      </View>
      <Pressable onPress={onPress} style={styles.rowAction} hitSlop={6}>
        <Text style={styles.rowActionText}>{action}</Text>
      </Pressable>
    </View>
  );

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8} accessibilityLabel="Voltar">
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Editar perfil</Text>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarBox}>
              <Pressable onPress={() => setShowAvatar(true)} accessibilityLabel="Alterar foto">
                <UserAvatar avatar={user.avatar} name={user.name} size={104} />
                <View style={styles.cameraBadge}>
                  <Feather name="camera" size={15} color={colors.white} />
                </View>
              </Pressable>
              <Pressable onPress={() => setShowAvatar(true)} hitSlop={6}>
                <Text style={styles.changePhoto}>Alterar foto</Text>
              </Pressable>
            </View>

            {!!msg && (
              <View style={[styles.msg, msg.kind === 'error' ? styles.msgError : styles.msgSuccess]}>
                <Feather name={msg.kind === 'error' ? 'alert-circle' : 'check-circle'} size={15} color={msg.kind === 'error' ? colors.red600 : brand.green} />
                <Text style={[styles.msgText, { color: msg.kind === 'error' ? colors.red700 : brand.green }]}>{msg.text}</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Dados pessoais</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setMsg(null);
                }}
                placeholder="Seu nome"
                placeholderTextColor={colors.gray400}
                style={styles.input}
                autoCapitalize="words"
              />
              {nameChanged && (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.ghostBtn} onPress={() => setName(user.name)}>
                    <Text style={styles.ghostLabel}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={styles.saveBtn} onPress={saveName} disabled={saving}>
                    {saving ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.saveLabel}>Salvar nome</Text>}
                  </Pressable>
                </View>
              )}
            </View>

            <Text style={styles.sectionLabel}>Contato</Text>
            <View style={styles.card}>
              <Row icon="mail" label="E-mail" value={user.email} action="Alterar" onPress={() => setVerify('email')} />
              <View style={styles.divider} />
              <Row
                icon="phone"
                label="Telefone"
                value={user.phone}
                action={user.phone ? 'Alterar' : 'Adicionar'}
                onPress={() => setVerify('phone')}
              />
            </View>
            <Text style={styles.help}>
              A troca de e-mail exige um link de verificação do Firebase. O telefone é apenas uma informação do perfil, sem validação por SMS.
            </Text>

            <Text style={styles.sectionLabel}>Segurança</Text>
            <View style={styles.card}>
              <Row icon="lock" label="Senha" value="••••••••" action="Alterar" onPress={() => setShowPassword(true)} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <VerifyChangeModal kind={verify} onClose={() => setVerify(null)} />
        <AvatarPickerModal isOpen={showAvatar} onClose={() => setShowAvatar(false)} />
        <ChangePasswordModal isOpen={showPassword} onClose={() => setShowPassword(false)} />
      </SafeAreaView>
    </Modal>
  );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setError('');
      setDone(false);
    }
  }, [isOpen]);

  const save = async () => {
    if (!current) return setError('Informe a senha atual.');
    if (next.length < 6) return setError('A nova senha precisa ter pelo menos 6 caracteres.');
    if (next !== confirm) return setError('As senhas não conferem.');
    setLoading(true);
    setError('');
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, value: string, set: (v: string) => void) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v) => {
          set(v);
          setError('');
        }}
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={colors.gray400}
      />
    </View>
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Alterar senha</Text>
          {done ? (
            <>
              <Text style={styles.help}>Senha alterada com sucesso.</Text>
              <PrimaryButton label="Concluir" icon="check" onPress={onClose} />
            </>
          ) : (
            <>
              {field('Senha atual', current, setCurrent)}
              {field('Nova senha', next, setNext)}
              {field('Confirmar nova senha', confirm, setConfirm)}
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              <PrimaryButton label="Salvar nova senha" icon="check" onPress={save} loading={loading} />
              <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={styles.ghostLabel}>Cancelar</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 16, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center' },
  avatarBox: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.green,
    borderWidth: 3,
    borderColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: { color: brand.green, fontWeight: '700', fontSize: 14 },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radii.xl, padding: 12, marginTop: 12, borderWidth: 1 },
  msgError: { backgroundColor: colors.red50, borderColor: colors.red100 },
  msgSuccess: { backgroundColor: brand.greenSoft, borderColor: brand.greenBorder },
  msgText: { flex: 1, fontSize: 13 },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: { backgroundColor: colors.white, borderRadius: radii['2xl'], padding: 14, borderWidth: 1, borderColor: colors.border },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.gray50,
  },
  inlineActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  ghostBtn: { paddingHorizontal: 14, height: 40, justifyContent: 'center' },
  ghostLabel: { color: colors.textMuted, fontWeight: '600' },
  saveBtn: { paddingHorizontal: 18, height: 40, borderRadius: radii.xl, backgroundColor: brand.green, justifyContent: 'center', minWidth: 110, alignItems: 'center' },
  saveLabel: { color: colors.white, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  rowIcon: { width: 38, height: 38, borderRadius: radii.xl, backgroundColor: brand.greenSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 15, color: colors.text, marginTop: 1 },
  rowAction: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.full, backgroundColor: brand.greenSoft },
  rowActionText: { color: brand.green, fontWeight: '700', fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  help: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginHorizontal: 4, lineHeight: 17 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 30, 22, 0.45)', justifyContent: 'center', padding: 16 },
  dialog: { backgroundColor: colors.white, borderRadius: radii['3xl'], padding: 20, width: '100%', maxWidth: 440, alignSelf: 'center' },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  errorText: { color: colors.red600, fontSize: 13, marginBottom: 4 },
});
