// =============================================================================
// TEMA CLARO (fundo branco)
// Paleta baseada nas classes Tailwind do projeto original (emerald, red...).
// Para fundo de tela, cartões e textos, use os tokens semânticos:
//   colors.bg, colors.surface, colors.card, colors.cardAlt, colors.text …
// =============================================================================

export const colors = {
  // ---- Tokens semânticos do tema (claro, fundo branco) ----
  bg: '#ffffff', // fundo das telas
  bgAlt: '#f9fafb', // fundo secundário (gradiente das telas)
  surface: '#ecfdf5', // fundo de modais (verde bem clarinho, como no original)
  card: '#ffffff', // cartões, inputs, itens de lista
  cardAlt: '#f3f4f6', // cartão destacado / chips
  border: '#e5e7eb', // bordas e divisórias
  text: '#111827', // texto principal
  textMuted: '#6b7280', // texto secundário

  // Emerald
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  emerald900: '#064e3b',
  emerald950: '#022c22',

  // Teal
  teal50: '#f0fdfa',
  teal200: '#99f6e4',
  teal400: '#2dd4bf',
  teal600: '#0d9488',
  teal700: '#0f766e',

  // Red
  red50: '#fef2f2',
  red100: '#fee2e2',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  red900: '#7f1d1d',
  red950: '#450a0a',

  // Yellow
  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow400: '#facc15',
  yellow600: '#ca8a04',

  // Blue
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',

  // Purple
  purple100: '#f3e8ff',
  purple500: '#a855f7',
  purple600: '#9333ea',

  // Pink
  pink100: '#fce7f3',
  pink400: '#f472b6',
  pink500: '#ec4899',

  // Cyan
  cyan100: '#cffafe',
  cyan500: '#06b6d4',

  // Amber
  amber100: '#fef3c7',
  amber500: '#f59e0b',

  // Orange
  orange100: '#ffedd5',
  orange600: '#ea580c',

  // Green
  green100: '#dcfce7',
  green600: '#16a34a',

  // Neutros
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
} as const;

// Cores da marca MonY (tiradas da logo oficial)
export const brand = {
  green: '#1f6b3f', // verde da logo
  greenDark: '#174f2f',
  greenBright: '#2f8f57',
  greenSoft: '#eef7f1',
  greenBorder: '#cfe6d8',
  blue: '#2b7088', // azul do "mon"
  blueSoft: '#e6f1f4',
};

// Opacidades de preto usadas no projeto original (text-black/60 etc.)
export const blackAlpha = (opacity: number) => `rgba(0, 0, 0, ${opacity})`;
export const whiteAlpha = (opacity: number) => `rgba(255, 255, 255, ${opacity})`;

export const radii = {
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
};
