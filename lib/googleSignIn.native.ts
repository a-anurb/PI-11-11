import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { firebaseAuth } from './firebase';

export async function signInWithGoogle(): Promise<void> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error('Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no arquivo .env.');
  // Exige development build com plugin nativo (não funciona no Expo Go).
  GoogleSignin.configure({ webClientId });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return;
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('O Google não forneceu um token de autenticação.');
    await signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(idToken));
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return;
    throw error;
  }
}
