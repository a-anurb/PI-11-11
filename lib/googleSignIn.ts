// Contrato compartilhado para a resolução de módulos .web/.native no Expo.
// Este arquivo não é utilizado em Android/web, que resolvem suas variantes.
export async function signInWithGoogle(): Promise<void> {
  throw new Error('Plataforma não suportada para login Google.');
}
