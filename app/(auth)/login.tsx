import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  auth,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthNotice,
  AuthScreen,
  Checkbox,
  Divider,
  FooterLink,
  GradientButton,
  SocialButtons,
  TrustBadges,
} from '../../components/auth/AuthUI';
import { errorMessage, isValidEmail, useAuth } from '../../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cadastro?: string; email?: string }>();
  const { login, loginGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showReset, setShowReset] = useState(false);

  // Vindo do cadastro: confirma e já preenche o e-mail
  useEffect(() => {
    if (params.cadastro === 'ok') {
      setSuccess('Conta criada com sucesso! Entre com seu e-mail e senha.');
      if (params.email) setEmail(String(params.email));
    }
  }, [params.cadastro, params.email]);

  const handleLogin = async () => {
    setError('');
    setInfo('');
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = 'Informe seu e-mail.';
    else if (!isValidEmail(email)) errs.email = 'E-mail inválido.';
    if (!password) errs.password = 'Informe sua senha.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(email, password, remember);
      // sucesso: o layout de autenticação redireciona para a página principal
    } catch (e) {
      setSuccess('');
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader title="Bem-vindo de volta" subtitle="Entre na sua carteira digital" />

      <AuthCard>
        {!!success && <AuthNotice text={success} kind="success" />}
        {!!error && <AuthNotice text={error} />}
        {!!info && <AuthNotice text={info} kind="info" />}

        <AuthInput
          label="E-mail"
          tone="yellow"
          icon="mail"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setFieldErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          error={fieldErrors.email}
        />

        <AuthInput
          label="Senha"
          tone="mint"
          icon="lock"
          password
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setFieldErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Sua senha"
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          error={fieldErrors.password}
        />

        <View style={styles.row}>
          <Checkbox checked={remember} onToggle={() => setRemember((r) => !r)} label="Lembrar-me" />
          <Pressable onPress={() => setShowReset(true)} hitSlop={8}>
            <Text style={styles.forgot}>Esqueceu a senha?</Text>
          </Pressable>
        </View>

        <GradientButton label="Entrar" icon="log-in" onPress={handleLogin} loading={loading} />

        <Divider />

        <SocialButtons
          onPress={async (provider) => {
            setError('');
            if (provider === 'Apple') {
              setInfo('Login com Apple será implementado futuramente.');
              return;
            }
            setLoading(true);
            try { await loginGoogle(remember); }
            catch (e) { setError(errorMessage(e)); }
            finally { setLoading(false); }
          }}
        />
      </AuthCard>

      <FooterLink question="Ainda não tem conta?" action="Criar conta grátis" onPress={() => router.push('/cadastro')} />
      <TrustBadges />

      <ResetPasswordModal
        isOpen={showReset}
        initialEmail={email}
        onClose={() => setShowReset(false)}
        onDone={(msg) => {
          setError('');
          setInfo('');
          setSuccess(msg);
        }}
      />
    </AuthScreen>
  );
}

/** Firebase envia um link seguro por e-mail; nunca exibimos códigos de redefinição localmente. */
function ResetPasswordModal({
  isOpen, initialEmail, onClose, onDone,
}: { isOpen: boolean; initialEmail: string; onClose: () => void; onDone: (msg: string) => void }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sendLink = async () => {
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.');
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(email);
      onClose();
      onDone('Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={isOpen} transparent animationType="fade" onShow={() => { setEmail(initialEmail); setError(''); }} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Redefinir senha</Text>
          <Text style={styles.modalText}>Informe o e-mail da sua conta. O Firebase enviará um link para criar uma nova senha.</Text>
          {!!error && <AuthNotice text={error} />}
          <AuthInput label="E-mail" tone="yellow" icon="mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
          <GradientButton label="Enviar link" icon="send" onPress={sendLink} loading={loading} />
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 20,
  },
  forgot: { fontSize: 14, fontWeight: '700', color: auth.greenText },
  overlay: { flex: 1, backgroundColor: 'rgba(15,30,22,0.45)', justifyContent: 'center', padding: 20 },
  modal: {
    backgroundColor: '#fbfcf8',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: auth.text, marginBottom: 4 },
  modalText: { fontSize: 13, color: auth.muted, marginBottom: 16 },
  cancel: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  cancelText: { color: auth.muted, fontWeight: '600' },
  linkText: { color: auth.greenText, fontWeight: '600', fontSize: 13 },
});
