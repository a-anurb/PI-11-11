/** Firebase client configuration. EXPO_PUBLIC_ values are public project identifiers,
 * not admin credentials. Security comes from Firestore rules and Firebase Auth. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = !!(config.apiKey && config.projectId && config.appId);
// Permite abrir as telas antes de preencher o .env; login continua bloqueado.
const safeConfig = firebaseConfigured ? config : {
  apiKey: 'CONFIGURAR_FIREBASE', authDomain: 'configure.firebaseapp.com',
  projectId: 'configure-firebase', storageBucket: 'configure-firebase.appspot.com',
  messagingSenderId: '000000000', appId: '1:000000000:web:configure',
};
export const firebaseApp = getApps().length ? getApp() : initializeApp(safeConfig);

let instance: Auth;
if (Platform.OS === 'web') {
  instance = getAuth(firebaseApp);
} else {
  try {
    instance = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error: any) {
    // Expo Fast Refresh can initialize the same app more than once.
    if (error?.code !== 'auth/already-initialized') throw error;
    instance = getAuth(firebaseApp);
  }
}
export const firebaseAuth = instance;
export const db = getFirestore(firebaseApp);
