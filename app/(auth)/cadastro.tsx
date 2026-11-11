import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirm' | 'terms';

/** Formata o telefone enquanto digita: (54) 99999-9999 */
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Força da senha: 0 a 4 */
function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  else if (/\d/.test(pw)) score += 0.5;
  return Math.min(4, Math.floor(score));
}

const STRENGTH = [
  { label: 'Muito fraca', color: '#ef4444' },
  { label: 'Fraca', color: '#f97316' },
  { label: 'Razoável', color: '#eab308' },
  { label: 'Boa', color: '#2f8f57' },
  { label: 'Forte', color: '#1f6b3f' },
];

export default function Cadastro() {
  const router = useRouter();
  const { register, loginGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [errs, setErrs] = useState<Partial<Record<Field, string>>>({});

  const clear = (f: Field) => setErrs((e) => ({ ...e, [f]: undefined }));
  const strength = passwordStrength(password);

  const handleRegister = async () => {
    setError('');
    setInfo('');
    const e: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) e.name = 'Informe seu nome.';
    if (!email.trim()) e.email = 'Informe seu e-mail.';
    else if (!isValidEmail(email)) e.email = 'E-mail inválido.';
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length < 10) e.phone = 'Telefone incompleto.';
    if (password.length < 6) e.password = 'A senha precisa ter pelo menos 6 caracteres.';
    if (confirm !== password) e.confirm = 'As senhas não conferem.';
    if (!terms) e.terms = 'Você precisa aceitar os termos para continuar.';
    setErrs(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const createdEmail = await register({ name: name.trim(), email, phone, password });
      // Cadastro feito → vai para o LOGIN (não entra direto)
      router.replace({ pathname: '/login', params: { cadastro: 'ok', email: createdEmail } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader title="Crie sua conta" subtitle="Comece a organizar seu dinheiro com o MonY" />

      <AuthCard>
        {!!error && <AuthNotice text={error} />}
        {!!info && <AuthNotice text={info} kind="info" />}

        <AuthInput
          label="Nome completo"
          tone="yellow"
          icon="user"
          value={name}
          onChangeText={(v) => {
            setName(v);
            clear('name');
          }}
          placeholder="Seu nome"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errs.name}
        />

        <AuthInput
          label="E-mail"
          tone="mint"
          icon="mail"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clear('email');
          }}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errs.email}
        />

        <AuthInput
          label="Telefone (opcional)"
          tone="yellow"
          icon="phone"
          value={phone}
          onChangeText={(v) => {
            setPhone(maskPhone(v));
            clear('phone');
          }}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          error={errs.phone}
        />

        <AuthInput
          label="Senha"
          tone="mint"
          icon="lock"
          password
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clear('password');
          }}
          placeholder="Mínimo 6 caracteres"
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          error={errs.password}
        />

        {password.length > 0 && (
          <View style={styles.strengthWrap}>
            <View style={styles.strengthBars}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[styles.strengthBar, { backgroundColor: i < Math.max(1, strength) ? STRENGTH[strength].color : '#dfe7e2' }]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: STRENGTH[strength].color }]}>
              Senha {STRENGTH[strength].label.toLowerCase()}
            </Text>
          </View>
        )}

        <AuthInput
          label="Confirmar senha"
          tone="yellow"
          icon="lock"
          password
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            clear('confirm');
          }}
          placeholder="Repita a senha"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          error={errs.confirm}
        />

        <View style={styles.termsRow}>
          <Checkbox
            checked={terms}
            onToggle={() => {
              setTerms((t) => !t);
              clear('terms');
            }}
            label={
              <Text style={styles.termsText}>
                Li e aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text>
              </Text>
            }
          />
          {!!errs.terms && <Text style={styles.termsError}>{errs.terms}</Text>}
        </View>

        <GradientButton label="Criar conta" icon="user-plus" onPress={handleRegister} loading={loading} />

        <Divider label="ou cadastre-se com" />

        <SocialButtons
          verb="Cadastrar"
          onPress={async (provider) => {
            setError('');
            if (provider === 'Apple') {
              setInfo('Login com Apple será implementado futuramente.');
              return;
            }
            setLoading(true);
            try { await loginGoogle(); }
            catch (e) { setError(errorMessage(e)); }
            finally { setLoading(false); }
          }}
        />
      </AuthCard>

      <FooterLink
        question="Já tem uma conta?"
        action="Entrar"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      />
      <TrustBadges />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  strengthWrap: { marginTop: -8, marginBottom: 16 },
  strengthBars: { flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '600', marginTop: 5 },
  termsRow: { marginTop: 2, marginBottom: 20 },
  termsText: { flex: 1, fontSize: 13, color: auth.muted, lineHeight: 18 },
  termsLink: { color: auth.greenText, fontWeight: '700' },
  termsError: { color: auth.error, fontSize: 12, marginTop: 6 },
});
