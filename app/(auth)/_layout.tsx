import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const { user, isLoaded } = useAuth();
  // Já está logado → vai direto para a página principal
  if (isLoaded && user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
