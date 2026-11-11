import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// =============================================================================
// Componentes visuais compartilhados pelas telas de Login e Cadastro.
// Estilo: fundo menta/amarelado, card "vidro" com gradiente amarelo → verde,
// campos com borda amarela/verde, botão verde com brilho, Google/Apple.
// =============================================================================

// Cores das telas de acesso — baseadas na logo do MonY
export const auth = {
  green: '#1f6b3f', // verde da logo
  greenDark: '#174f2f',
  greenText: '#1f6b3f',
  blue: '#2b7088', // azul do "mon"
  text: '#16241b',
  muted: '#55635a',
  yellowBorder: '#eadfb4',
  yellowFocus: '#c9a93a',
  mintBorder: '#bfdccb',
  mintFocus: '#2f8f57',
  error: '#dc2626',
};

/** Fundo da tela + rolagem + ajuste para o teclado nativo */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={['#fbf9f1', '#f3f8f1', '#e9f4ed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.inner}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Logo do MonY + título + subtítulo */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Image
        source={require('../../assets/images/mony-logo.png')}
        style={styles.logoImg}
        resizeMode="contain"
        accessibilityLabel="MonY"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

/** Card principal (efeito vidro com gradiente amarelo → verde) */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={['rgba(255, 252, 240, 0.95)', 'rgba(248, 252, 248, 0.97)', 'rgba(232, 245, 237, 0.95)']}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
        style={styles.card}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

interface AuthInputProps extends TextInputProps {
  label: string;
  /** cor da borda: amarela ou verde (alternando como no design) */
  tone?: 'yellow' | 'mint';
  icon?: keyof typeof Feather.glyphMap;
  password?: boolean;
  error?: string;
}

export function AuthInput({ label, tone = 'yellow', icon, password, error, style, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const border = error
    ? auth.error
    : focused
      ? tone === 'yellow' ? auth.yellowFocus : auth.mintFocus
      : tone === 'yellow' ? auth.yellowBorder : auth.mintBorder;
  const bg = tone === 'yellow' ? 'rgba(255, 253, 240, 0.9)' : 'rgba(240, 253, 244, 0.95)';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          { borderColor: border, backgroundColor: bg },
          focused && { shadowColor: border, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
        ]}
      >
        {icon && <Feather name={icon} size={16} color="#8a9a90" style={{ marginRight: 8 }} />}
        <TextInput
          {...rest}
          secureTextEntry={password && !visible}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor="#9aa59e"
          style={[styles.input, style]}
        />
        {password && (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
            <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={auth.greenText} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: ReactNode }) {
  return (
    <Pressable onPress={onToggle} style={styles.checkRow} hitSlop={6}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked && <Feather name="check" size={12} color="#ffffff" />}
      </View>
      {typeof label === 'string' ? <Text style={styles.checkLabel}>{label}</Text> : label}
    </Pressable>
  );
}

export function GradientButton({
  label,
  icon,
  onPress,
  loading,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => [styles.btnShadow, pressed && { transform: [{ scale: 0.98 }] }]}>
      <LinearGradient
        colors={['#2f8f57', '#1f6b3f', '#1a5c36']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btn, loading && { opacity: 0.7 }]}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.btnLabel}>{label}</Text>
            <Feather name={icon} size={17} color="#ffffff" />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function Divider({ label = 'ou continue com' }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerPill}>
        <Text style={styles.dividerText}>{label}</Text>
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </Svg>
  );
}

export function SocialButtons({ verb = 'Continuar', onPress }: { verb?: string; onPress: (provider: 'Google' | 'Apple') => void }) {
  return (
    <View style={{ gap: 12 }}>
      <Pressable onPress={() => onPress('Google')} style={({ pressed }) => [styles.googleBtn, pressed && { backgroundColor: '#f6f7f6' }]}>
        <GoogleLogo />
        <Text style={styles.googleLabel}>{verb} com Google</Text>
      </Pressable>
      <Pressable onPress={() => onPress('Apple')} style={({ pressed }) => [styles.appleBtn, pressed && { backgroundColor: '#1f2937' }]}>
        <MaterialCommunityIcons name="apple" size={20} color="#ffffff" />
        <Text style={styles.appleLabel}>{verb} com Apple</Text>
      </Pressable>
    </View>
  );
}

/** Mensagem de erro/aviso/sucesso dentro do card */
export function AuthNotice({ text, kind = 'error' }: { text: string; kind?: 'error' | 'info' | 'success' }) {
  const palette = {
    error: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', icon: 'alert-circle' as const },
    info: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: 'info' as const },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: 'check-circle' as const },
  }[kind];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Feather name={palette.icon} size={15} color={palette.color} />
      <Text style={[styles.noticeText, { color: palette.color }]}>{text}</Text>
    </View>
  );
}

/** "Ainda não tem conta? Criar conta grátis" */
export function FooterLink({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{question} </Text>
      <Pressable onPress={onPress} hitSlop={8} style={styles.footerLinkWrap}>
        <Text style={styles.footerLink}>{action}</Text>
      </Pressable>
    </View>
  );
}

/** Selos de confiança (escudo, cadeado, BR) */
export function TrustBadges() {
  const items = [
    { bg: '#2f8f57', label: 'Seguro', icon: <MaterialCommunityIcons name="shield-check" size={18} color="#fff" /> },
    { bg: '#2b7088', label: 'Privado', icon: <MaterialCommunityIcons name="lock" size={17} color="#fff" /> },
    { bg: '#174f2f', label: 'Nacional', icon: <Text style={styles.brText}>BR</Text> },
  ];
  return (
    <View style={styles.badgesRow}>
      {items.map((b) => (
        <View key={b.label} style={styles.badgeItem}>
          <View style={[styles.badge, { backgroundColor: b.bg, shadowColor: b.bg }]}>{b.icon}</View>
          <Text style={styles.badgeLabel}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  inner: { width: '100%', maxWidth: 420, alignSelf: 'center' },

  header: { alignItems: 'center', marginBottom: 20 },
  logoImg: { width: 96, height: 110, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: auth.text },
  subtitle: { fontSize: 14, color: auth.muted, marginTop: 4 },

  cardShadow: {
    borderRadius: 28,
    shadowColor: '#1f6b3f',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#e1e9e3',
    overflow: 'hidden',
  },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: auth.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 15, color: auth.text, height: '100%' },
  fieldError: { color: auth.error, fontSize: 12, marginTop: 5 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3f4a43',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: auth.green, borderColor: auth.green },
  checkLabel: { fontSize: 14, fontWeight: '600', color: auth.text },

  btnShadow: {
    borderRadius: 14,
    shadowColor: '#1f6b3f',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btn: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#d8e2db' },
  dividerPill: { paddingHorizontal: 12 },
  dividerText: { fontSize: 12, fontWeight: '600', color: auth.muted },

  googleBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d9dedb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleLabel: { fontSize: 15, fontWeight: '600', color: '#3c4043' },
  appleBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleLabel: { fontSize: 15, fontWeight: '700', color: '#ffffff' },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  noticeText: { flex: 1, fontSize: 13 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 24 },
  footerText: { fontSize: 15, color: auth.muted },
  footerLinkWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerLink: { fontSize: 15, fontWeight: '800', color: auth.greenText },

  badgesRow: { flexDirection: 'row', justifyContent: 'center', gap: 44, marginTop: 24 },
  badgeItem: { alignItems: 'center', gap: 6 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  brText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  badgeLabel: { fontSize: 11, color: auth.muted },
});
