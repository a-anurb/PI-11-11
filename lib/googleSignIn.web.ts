import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from './firebase';

export async function signInWithGoogle(): Promise<void> {
  // Autorize o domínio do site em Firebase Authentication > Settings > Authorized domains.
  await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
}
