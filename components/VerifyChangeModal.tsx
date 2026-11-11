import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { brand, colors } from '../constants/theme';
import { errorMessage, isValidEmail, useAuth } from '../context/AuthContext';

/** Reutilizado pela janela de alteração de senha; mantém o botão original do projeto. */
export function PrimaryButton({ label, icon, onPress, loading, disabled }: {
  label: string; icon: keyof typeof Feather.glyphMap;
  onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable disabled={loading || disabled} onPress={onPress} style={[styles.button, (loading || disabled) && { opacity: 0.6 }]}>
      {loading ? <ActivityIndicator color="white" /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.buttonText}>{label}</Text>
        <Feather name={icon} size={16} color="white" />
      </View>}
    </Pressable>
  );
}

export type ChangeKind = 'phone' | 'email';
interface Props { kind: ChangeKind | null; onClose: () => void; }

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function VerifyChangeModal({ kind, onClose }: Props) {
  const { user, changePhone, requestEmailVerificationChange, refreshUser } = useAuth();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (kind) { setValue(''); setLoading(false); setMessage(''); setError(''); setDone(false); }
  }, [kind]);
  if (!kind || !user) return null;
  const isPhone = kind === 'phone';
  const save = async () => {
    if (isPhone && value.replace(/\D/g, '').length < 10) return setError('Informe um telefone com DDD.');
    if (!isPhone && !isValidEmail(value)) return setError('Informe um e-mail válido.');
    setLoading(true); setError('');
    try {
      if (isPhone) {
        await changePhone(value);
        setMessage('Telefone do perfil atualizado. Ele não foi verificado por SMS.');
      } else {
        await requestEmailVerificationChange(value);
        setMessage('Link enviado para o novo e-mail. Abra o link para confirmar a alteração e depois atualize o perfil.');
      }
      setDone(true);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={!!kind} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{isPhone ? 'Alterar telefone' : 'Alterar e-mail'}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Feather name="x" size={22} color={colors.text} /></Pressable>
          </View>
          {!done ? <>
            <Text style={styles.label}>{isPhone ? 'Telefone atual' : 'E-mail atual'}</Text>
            <Text style={styles.current}>{(isPhone ? user.phone : user.email) || 'Não informado'}</Text>
            <Text style={styles.label}>{isPhone ? 'Novo telefone' : 'Novo e-mail'}</Text>
            <TextInput value={value} onChangeText={(v) => { setValue(isPhone ? maskPhone(v) : v); setError(''); }}
              placeholder={isPhone ? '(00) 00000-0000' : 'novo@email.com'} keyboardType={isPhone ? 'phone-pad' : 'email-address'}
              autoCapitalize="none" style={styles.input} placeholderTextColor={colors.gray400} />
            <Text style={styles.help}>{isPhone ? 'O telefone é armazenado no seu perfil. Não será enviado SMS.' : 'Para sua segurança, o Firebase enviará um link de verificação ao novo endereço.'}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable disabled={loading} onPress={save} style={styles.button}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isPhone ? 'Salvar telefone' : 'Enviar link de verificação'}</Text>}
            </Pressable>
          </> : <>
            <Feather name="check-circle" size={32} color={brand.green} style={{ alignSelf: 'center', marginVertical: 10 }} />
            <Text style={styles.help}>{message}</Text>
            {!isPhone && <Pressable onPress={async () => { try { await refreshUser(); onClose(); } catch (e) { setError(errorMessage(e)); } }} style={styles.secondary}>
              <Text style={styles.secondaryText}>Atualizar perfil</Text>
            </Pressable>}
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Concluir</Text></Pressable>
          </>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 22, width: '100%', maxWidth: 450, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, color: colors.text, fontWeight: '800' },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  current: { color: colors.textMuted, fontSize: 14, marginBottom: 18 },
  input: { borderWidth: 1, borderColor: colors.gray300, color: colors.text, borderRadius: 14, padding: 12, fontSize: 15 },
  help: { color: colors.textMuted, lineHeight: 21, fontSize: 13, marginVertical: 14 },
  error: { color: colors.red600, fontSize: 13, marginVertical: 10 },
  button: { backgroundColor: brand.green, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: '700' },
  secondary: { alignItems: 'center', padding: 12 },
  secondaryText: { color: brand.green, fontWeight: '700' },
});
