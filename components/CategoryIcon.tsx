import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Mapeia cada chave de ícone usada nas categorias para um ícone do
// @expo/vector-icons (Feather ou MaterialCommunityIcons).
type IconDef = { set: 'feather' | 'mci'; name: string };

const iconMap: Record<string, IconDef> = {
  shopping: { set: 'feather', name: 'shopping-bag' },
  shopping_cart: { set: 'feather', name: 'shopping-cart' },
  coffee: { set: 'feather', name: 'coffee' },
  snack: { set: 'feather', name: 'coffee' },
  transport: { set: 'mci', name: 'car' },
  home: { set: 'feather', name: 'home' },
  salary: { set: 'feather', name: 'briefcase' },
  investment: { set: 'feather', name: 'dollar-sign' },
  returns: { set: 'feather', name: 'trending-up' },
  freelance: { set: 'feather', name: 'monitor' },
  sales: { set: 'feather', name: 'tag' },
  phone: { set: 'feather', name: 'smartphone' },
  food: { set: 'mci', name: 'silverware-fork-knife' },
  entertainment: { set: 'feather', name: 'film' },
  health: { set: 'feather', name: 'heart' },
  heart: { set: 'feather', name: 'heart' },
  leisure: { set: 'mci', name: 'party-popper' },
  sparkles: { set: 'mci', name: 'party-popper' },
  education: { set: 'mci', name: 'school' },
  gifts: { set: 'feather', name: 'gift' },
  family: { set: 'feather', name: 'users' },
  bills: { set: 'feather', name: 'file-text' },
  pet: { set: 'mci', name: 'paw' },
  travel: { set: 'feather', name: 'map' },
  star: { set: 'feather', name: 'star' },
  tag: { set: 'feather', name: 'tag' },
};

interface CategoryIconProps {
  icon: string;
  size?: number;
  color: string;
}

export function CategoryIcon({ icon, size = 24, color }: CategoryIconProps) {
  const def = iconMap[icon] ?? { set: 'feather', name: 'dollar-sign' };
  if (def.set === 'mci') {
    return <MaterialCommunityIcons name={def.name as any} size={size} color={color} />;
  }
  return <Feather name={def.name as any} size={size} color={color} />;
}
