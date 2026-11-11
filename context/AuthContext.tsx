import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential,
  reload, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword,
  updateProfile, verifyBeforeUpdateEmail, setPersistence, browserLocalPersistence,
  browserSessionPersistence, inMemoryPersistence, getReactNativePersistence,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { firebaseAuth, db, firebaseConfigured } from '../lib/firebase';
import { signInWithGoogle } from '../lib/googleSignIn';

export type Avatar = { type: 'preset' | 'initials' | 'photo' | 'custom'; value: string };
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: Avatar | null;
  hasPreviousAvatar: boolean;
}
type UserProfileDoc = { name?: string; email?: string; phone?: string; avatar?: Avatar | null; previousAvatar?: Avatar | null };
interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  offline: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  loginGoogle: (remember?: boolean) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  setAvatar: (a: Avatar | { photoBase64: string; mime: string }) => Promise<void>;
  restorePreviousAvatar: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changePhone: (phone: string) => Promise<void>;
  requestEmailVerificationChange: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

function toAuthUser(uid: string, email: string, displayName: string, profile: UserProfileDoc): AuthUser {
  return {
    id: uid, email, name: profile.name || displayName || email.split('@')[0],
    phone: profile.phone || '', avatar: profile.avatar || null,
    hasPreviousAvatar: !!profile.previousAvatar,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const registering = useRef(false);

  // A sessão autenticada é restaurada pelo Firebase; não reutilizamos tokens do servidor antigo.
  useEffect(() => {
    let removeProfileListener: (() => void) | undefined;
    let generation = 0;
    if (!firebaseConfigured) {
      setLoaded(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
      // O Firebase autentica automaticamente após criar a conta; não navegamos
      // para a home durante esse cadastro porque o fluxo original pede login.
      if (authUser && registering.current) return;
      const version = ++generation;
      removeProfileListener?.();
      removeProfileListener = undefined;
      if (!authUser) {
        setUser(null);
        setOffline(false);
        setLoaded(true);
        return;
      }
      const profileRef = doc(db, 'users', authUser.uid);
      const fallback = () => toAuthUser(authUser.uid, authUser.email || '', authUser.displayName || '', {});
      try {
        const snapshot = await getDoc(profileRef);
        if (version !== generation) return;
        const profile = (snapshot.data() || {}) as UserProfileDoc;
        // Cria o perfil de usuários autenticados via Google, sem apagar dados antigos.
        if (!snapshot.exists()) {
          await setDoc(profileRef, {
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email || '', phone: '', avatar: null, previousAvatar: null,
          }, { merge: true });
        }
        if (version !== generation) return;
        setUser(toAuthUser(authUser.uid, authUser.email || '', authUser.displayName || '', profile));
        setOffline(false);
      } catch (e) {
        if (version !== generation) return;
        setUser(fallback());
        setOffline(true);
        console.warn('MonY: não foi possível ler o perfil no Firestore.', e);
      } finally {
        if (version === generation) setLoaded(true);
      }
      if (version !== generation) return;
      removeProfileListener = onSnapshot(profileRef, (snapshot) => {
        if (version !== generation || !firebaseAuth.currentUser) return;
        const current = firebaseAuth.currentUser;
        setUser(toAuthUser(current.uid, current.email || '', current.displayName || '', (snapshot.data() || {}) as UserProfileDoc));
        setOffline(false);
      }, (err) => {
        setOffline(true);
        console.warn('MonY: erro de sincronização do perfil.', err);
      });
    }, (err) => {
      console.error('MonY: erro ao restaurar a autenticação', err);
      setLoaded(true);
    });
    return () => { generation++; unsubscribe(); removeProfileListener?.(); };
  }, []);

  const requireUser = () => {
    const current = firebaseAuth.currentUser;
    if (!current) throw new Error('Entre na sua conta para continuar.');
    return current;
  };
  const patchProfile = async (partial: Partial<UserProfileDoc>) => {
    const current = requireUser();
    await setDoc(doc(db, 'users', current.uid), partial, { merge: true });
  };

  const setRememberPreference = async (remember: boolean) => {
    if (Platform.OS === 'web') {
      await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
    } else {
      await setPersistence(firebaseAuth, remember ? getReactNativePersistence(AsyncStorage) : inMemoryPersistence);
    }
  };
  const login = async (email: string, password: string, remember: boolean) => {
    if (!firebaseConfigured) throw new Error('Preencha o .env com os dados do seu projeto Firebase.');
    await setRememberPreference(remember);
    await signInWithEmailAndPassword(firebaseAuth, normalizeEmail(email), password);
  };
  const loginGoogle = async (remember = true) => {
    if (!firebaseConfigured) throw new Error('Preencha o .env com os dados do seu projeto Firebase.');
    await setRememberPreference(remember);
    await signInWithGoogle();
  };
  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    if (!firebaseConfigured) throw new Error('Preencha o .env com os dados do seu projeto Firebase.');
    const email = normalizeEmail(data.email);
    registering.current = true;
    try {
      const { user: created } = await createUserWithEmailAndPassword(firebaseAuth, email, data.password);
      await updateProfile(created, { displayName: data.name.trim() });
      await setDoc(doc(db, 'users', created.uid), {
        name: data.name.trim(), email, phone: data.phone || '', avatar: null, previousAvatar: null,
      }, { merge: true });
      return email;
    } finally {
      // Saímos mesmo se a gravação do perfil falhar; a conta Auth pode ser
      // recuperada mais tarde e o perfil pode ser reconstituído no login.
      if (firebaseAuth.currentUser) await signOut(firebaseAuth);
      registering.current = false;
    }
  };
  const logout = () => signOut(firebaseAuth);
  const refreshUser = async () => {
    const current = requireUser();
    await reload(current);
    const snapshot = await getDoc(doc(db, 'users', current.uid));
    setUser(toAuthUser(current.uid, current.email || '', current.displayName || '', (snapshot.data() || {}) as UserProfileDoc));
    setOffline(false);
  };
  const updateName = async (name: string) => {
    const current = requireUser();
    await updateProfile(current, { displayName: name.trim() });
    await patchProfile({ name: name.trim() });
  };
  const setAvatar: AuthContextType['setAvatar'] = async (candidate) => {
    const current = requireUser();
    let avatar: Avatar;
    if ('photoBase64' in candidate) {
      // A imagem fica APENAS no dispositivo/navegador atual. Não exige Storage/Blaze.
      // Firestore armazena somente um marcador, nunca o conteúdo base64.
      const imageKey = `mony:local-avatar:${current.uid}:${Date.now()}`;
      await AsyncStorage.setItem(imageKey, `data:${candidate.mime};base64,${candidate.photoBase64}`);
      avatar = { type: 'photo', value: `local:${imageKey}` };
    } else avatar = candidate;
    const existing = await getDoc(doc(db, 'users', current.uid));
    await patchProfile({ previousAvatar: ((existing.data() || {}) as UserProfileDoc).avatar || null, avatar });
  };
  const restorePreviousAvatar = async () => {
    const current = requireUser();
    const snapshot = await getDoc(doc(db, 'users', current.uid));
    const p = (snapshot.data() || {}) as UserProfileDoc;
    if (!p.previousAvatar) throw new Error('Não existe um avatar anterior.');
    await patchProfile({ avatar: p.previousAvatar, previousAvatar: p.avatar || null });
  };
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = requireUser();
    if (!current.email || !current.providerData.some((p) => p.providerId === 'password')) {
      throw new Error('Esta conta usa Google. Configure uma senha pelo fluxo de recuperação de senha do Firebase.');
    }
    await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, currentPassword));
    await updatePassword(current, newPassword);
  };
  const changePhone = async (phone: string) => { await patchProfile({ phone }); };
  const requestEmailVerificationChange = async (email: string) => {
    const current = requireUser();
    await verifyBeforeUpdateEmail(current, normalizeEmail(email));
    // O endereço só muda quando o usuário abre o link enviado pelo Firebase.
  };
  const requestPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, normalizeEmail(email));
  };

  return <AuthContext.Provider value={{
    user, isLoaded, offline, login, loginGoogle, register, logout, refreshUser, updateName,
    setAvatar, restorePreviousAvatar, changePassword, changePhone,
    requestEmailVerificationChange, requestPasswordReset,
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
export function useUserStorageKey(base: string): string {
  const { user } = useAuth();
  return user ? `${base}:${user.id}` : base;
}

const errorTranslations: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha é muito fraca.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique a internet.',
  'auth/requires-recent-login': 'Por segurança, saia e entre novamente antes de realizar esta alteração.',
  'auth/popup-closed-by-user': 'Login do Google cancelado.',
  'auth/unauthorized-domain': 'Domínio não autorizado no Firebase Authentication.',
  'auth/operation-not-allowed': 'Ative este método de login no Firebase Authentication.',
  'permission-denied': 'Acesso negado no Firebase. Verifique as regras do Firestore.',
};
export const errorMessage = (e: unknown) => {
  const err = e as { code?: string; message?: string } | null;
  return (err?.code && errorTranslations[err.code]) || err?.message || 'Algo deu errado. Tente novamente.';
};
