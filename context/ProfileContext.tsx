import { ReactNode } from 'react';
import { Avatar, useAuth } from './AuthContext';

// -----------------------------------------------------------------------------
// O perfil vem SEMPRE da conta autenticada (servidor). Não existe mais uma cópia
// separada no aparelho — por isso nome, e-mail, telefone e foto aparecem
// automaticamente logo após o login.
// -----------------------------------------------------------------------------

export interface Profile {
  name: string;
  email: string;
  phone: string;
  avatar: Avatar | null;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useProfile() {
  const { user, updateName } = useAuth();
  const profile: Profile = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    avatar: user?.avatar ?? null,
  };
  return { profile, updateName };
}
