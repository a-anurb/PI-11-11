import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Moldura discreta do avatar conforme o nível do Level Up:
 *  • níveis 1–2: borda branca simples
 *  • níveis 3–4: moldura prateada
 *  • nível 5: moldura dourada
 */
export function AvatarFrame({ level, size, children }: { level: number; size: number; children: ReactNode }) {
  const ring = Math.max(3, Math.round(size * 0.045));
  const colors: [string, string] =
    level >= 5 ? ['#fde68a', '#d97706'] : level >= 3 ? ['#f1f5f9', '#94a3b8'] : ['#ffffff', '#ffffff'];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size + ring * 2, height: size + ring * 2, borderRadius: (size + ring * 2) / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>{children}</View>
    </LinearGradient>
  );
}
