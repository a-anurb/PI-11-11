import type { MedalId } from './levelUp';

// =============================================================================
// MonY — Catálogo do avatar personalizável (camadas SVG)
// O avatar é salvo como texto curto, ex.:
//   "b-b1.sk-s2.bd-m.h-short.hc-hc2.fh-none.o-hoodie.oc-oc1.g-none.hd-none.e-0.nk-none.bg-bg1"
// Regra de diversidade: tom de pele, formato de rosto e TIPO de cabelo
// (liso, ondulado, cacheado, crespo, tranças) são SEMPRE liberados.
// Só itens de estilo (acessórios, roupas especiais, cenários) dependem do Level Up.
// =============================================================================

export type Unlock = { kind: 'free' } | { kind: 'level'; level: number } | { kind: 'medal'; medal: MedalId };

export interface CatalogItem<V = string> {
  id: string;
  label: string;
  value: V;
  unlock: Unlock;
}

const free: Unlock = { kind: 'free' };
const lvl = (level: number): Unlock => ({ kind: 'level', level });
const medal = (m: MedalId): Unlock => ({ kind: 'medal', medal: m });

// ---- tons de pele
export const SKINS: CatalogItem[] = [
  { id: 's1', label: 'Muito claro', value: '#f7dcc6', unlock: free },
  { id: 's2', label: 'Claro', value: '#efc6a4', unlock: free },
  { id: 's3', label: 'Médio claro', value: '#e1ab82', unlock: free },
  { id: 's4', label: 'Médio', value: '#c98e64', unlock: free },
  { id: 's5', label: 'Pardo', value: '#a86f48', unlock: free },
  { id: 's6', label: 'Moreno', value: '#8a5636', unlock: free },
  { id: 's7', label: 'Escuro', value: '#6b4029', unlock: free },
  { id: 's8', label: 'Muito escuro', value: '#4a2b1c', unlock: free },
];

export type Body = 'm' | 'f';

// ---- bases de personagem (ponto de partida: tom, rosto, cabelo, expressão)
export interface BaseValue {
  skin: string; // id de SKINS
  body: Body;
  hair: string;
  hairColor: string;
  facial?: string;
  mouth: 'smile' | 'grin';
}
export const BASES: CatalogItem<BaseValue>[] = [
  { id: 'b1', label: 'Claro, curto', value: { skin: 's2', body: 'm', hair: 'sidepart', hairColor: 'hc2', mouth: 'grin' }, unlock: free },
  { id: 'b2', label: 'Médio, liso longo', value: { skin: 's4', body: 'f', hair: 'long', hairColor: 'hc1', mouth: 'smile' }, unlock: free },
  { id: 'b3', label: 'Moreno, cacheado', value: { skin: 's6', body: 'm', hair: 'curly', hairColor: 'hc1', mouth: 'grin' }, unlock: free },
  { id: 'b4', label: 'Muito claro, ruiva', value: { skin: 's1', body: 'f', hair: 'wavy', hairColor: 'hc3', mouth: 'grin' }, unlock: free },
  { id: 'b5', label: 'Pardo, barba', value: { skin: 's5', body: 'm', hair: 'buzz', hairColor: 'hc1', facial: 'full', mouth: 'smile' }, unlock: free },
  { id: 'b6', label: 'Muito escuro, black power', value: { skin: 's8', body: 'f', hair: 'afro', hairColor: 'hc1', mouth: 'grin' }, unlock: free },
  { id: 'b7', label: 'Médio claro, topete', value: { skin: 's3', body: 'm', hair: 'side', hairColor: 'hc4', mouth: 'grin' }, unlock: free },
  { id: 'b8', label: 'Pardo, cacheado longo', value: { skin: 's5', body: 'f', hair: 'longCurly', hairColor: 'hc2', mouth: 'grin' }, unlock: free },
  { id: 'b9', label: 'Escuro, twists', value: { skin: 's7', body: 'm', hair: 'twists', hairColor: 'hc1', facial: 'stubble', mouth: 'grin' }, unlock: free },
  { id: 'b10', label: 'Claro, chanel', value: { skin: 's2', body: 'f', hair: 'bob', hairColor: 'hc1', mouth: 'smile' }, unlock: free },
  { id: 'b11', label: 'Muito escuro, careca', value: { skin: 's8', body: 'm', hair: 'bald', hairColor: 'hc1', facial: 'goatee', mouth: 'grin' }, unlock: free },
  { id: 'b12', label: 'Escuro, tranças', value: { skin: 's7', body: 'f', hair: 'braids', hairColor: 'hc1', mouth: 'grin' }, unlock: free },
  { id: 'b13', label: 'Médio, coque', value: { skin: 's4', body: 'f', hair: 'bun', hairColor: 'hc2', mouth: 'grin' }, unlock: free },
  { id: 'b14', label: 'Claro, grisalho', value: { skin: 's2', body: 'm', hair: 'short', hairColor: 'hc5', facial: 'full', mouth: 'smile' }, unlock: free },
  { id: 'b15', label: 'Moreno, rabo de cavalo', value: { skin: 's6', body: 'f', hair: 'ponytail', hairColor: 'hc2', mouth: 'grin' }, unlock: free },
  { id: 'b16', label: 'Pardo, puff', value: { skin: 's5', body: 'f', hair: 'afropuff', hairColor: 'hc1', mouth: 'grin' }, unlock: free },
];

export type HairGroup = 'curto' | 'longo';
export const HAIRS: (CatalogItem & { group: HairGroup })[] = [
  { id: 'bald', label: 'Careca', value: 'bald', unlock: free, group: 'curto' },
  { id: 'buzz', label: 'Raspado', value: 'buzz', unlock: free, group: 'curto' },
  { id: 'short', label: 'Curto', value: 'short', unlock: free, group: 'curto' },
  { id: 'sidepart', label: 'Social', value: 'sidepart', unlock: free, group: 'curto' },
  { id: 'side', label: 'Topete', value: 'side', unlock: free, group: 'curto' },
  { id: 'curly', label: 'Cacheado', value: 'curly', unlock: free, group: 'curto' },
  { id: 'twists', label: 'Twists', value: 'twists', unlock: free, group: 'curto' },
  { id: 'afro', label: 'Black power', value: 'afro', unlock: free, group: 'curto' },
  { id: 'pixie', label: 'Pixie', value: 'pixie', unlock: free, group: 'curto' },
  { id: 'manbun', label: 'Coque baixo', value: 'manbun', unlock: free, group: 'curto' },
  { id: 'spiky', label: 'Espetado', value: 'spiky', unlock: lvl(3), group: 'curto' },
  { id: 'long', label: 'Liso longo', value: 'long', unlock: free, group: 'longo' },
  { id: 'wavy', label: 'Ondulado', value: 'wavy', unlock: free, group: 'longo' },
  { id: 'longCurly', label: 'Cacheado longo', value: 'longCurly', unlock: free, group: 'longo' },
  { id: 'braids', label: 'Tranças', value: 'braids', unlock: free, group: 'longo' },
  { id: 'bob', label: 'Chanel', value: 'bob', unlock: free, group: 'longo' },
  { id: 'bun', label: 'Coque', value: 'bun', unlock: free, group: 'longo' },
  { id: 'ponytail', label: 'Rabo de cavalo', value: 'ponytail', unlock: free, group: 'longo' },
  { id: 'afropuff', label: 'Puff', value: 'afropuff', unlock: free, group: 'longo' },
  { id: 'pigtails', label: 'Maria-chiquinha', value: 'pigtails', unlock: lvl(2), group: 'longo' },
];

export const HAIR_COLORS: CatalogItem[] = [
  { id: 'hc1', label: 'Preto', value: '#231914', unlock: free },
  { id: 'hc2', label: 'Castanho', value: '#5b3a24', unlock: free },
  { id: 'hc9', label: 'Castanho claro', value: '#8a5a35', unlock: free },
  { id: 'hc3', label: 'Ruivo', value: '#b4532a', unlock: free },
  { id: 'hc4', label: 'Loiro', value: '#d4a13a', unlock: free },
  { id: 'hc10', label: 'Platinado', value: '#e8dcc0', unlock: free },
  { id: 'hc5', label: 'Grisalho', value: '#a8adb3', unlock: free },
  { id: 'hc6', label: 'Roxo', value: '#7c3aed', unlock: lvl(3) },
  { id: 'hc7', label: 'Azul', value: '#2563eb', unlock: lvl(3) },
  { id: 'hc8', label: 'Rosa', value: '#ec4899', unlock: medal('organizer') },
];

export const FACIAL: CatalogItem[] = [
  { id: 'none', label: 'Sem barba', value: 'none', unlock: free },
  { id: 'stubble', label: 'Por fazer', value: 'stubble', unlock: free },
  { id: 'mustache', label: 'Bigode', value: 'mustache', unlock: free },
  { id: 'goatee', label: 'Cavanhaque', value: 'goatee', unlock: free },
  { id: 'full', label: 'Barba cheia', value: 'full', unlock: free },
];

// ---- roupas
export const OUTFITS: CatalogItem[] = [
  { id: 'tee', label: 'Camiseta', value: 'tee', unlock: free },
  { id: 'vneck', label: 'Gola V', value: 'vneck', unlock: free },
  { id: 'stripes', label: 'Listrada', value: 'stripes', unlock: free },
  { id: 'tank', label: 'Regata', value: 'tank', unlock: free },
  { id: 'hoodie', label: 'Moletom', value: 'hoodie', unlock: free },
  { id: 'shirt', label: 'Camisa social', value: 'shirt', unlock: free },
  { id: 'sport', label: 'Esportiva', value: 'sport', unlock: free },
  { id: 'sweater', label: 'Suéter', value: 'sweater', unlock: lvl(2) },
  { id: 'turtleneck', label: 'Gola alta', value: 'turtleneck', unlock: lvl(2) },
  { id: 'collar', label: 'Polo', value: 'collar', unlock: lvl(2) },
  { id: 'flannel', label: 'Xadrez', value: 'flannel', unlock: lvl(3) },
  { id: 'cardigan', label: 'Cardigã', value: 'cardigan', unlock: lvl(3) },
  { id: 'jacket', label: 'Jaqueta', value: 'jacket', unlock: lvl(4) },
  { id: 'denim', label: 'Jeans', value: 'denim', unlock: lvl(4) },
  { id: 'blazer', label: 'Blazer', value: 'blazer', unlock: lvl(5) },
];

export const OUTFIT_COLORS: CatalogItem[] = [
  { id: 'oc1', label: 'Verde', value: '#1f6b3f', unlock: free },
  { id: 'oc2', label: 'Azul', value: '#2b7088', unlock: free },
  { id: 'oc12', label: 'Marinho', value: '#1e3a5f', unlock: free },
  { id: 'oc13', label: 'Azul claro', value: '#7cb7e0', unlock: free },
  { id: 'oc14', label: 'Jeans', value: '#3f6c9e', unlock: free },
  { id: 'oc3', label: 'Mostarda', value: '#e2a93b', unlock: free },
  { id: 'oc9', label: 'Laranja', value: '#ea580c', unlock: free },
  { id: 'oc4', label: 'Coral', value: '#e0675a', unlock: free },
  { id: 'oc15', label: 'Vermelho', value: '#c62f37', unlock: free },
  { id: 'oc16', label: 'Vinho', value: '#7f1d3a', unlock: free },
  { id: 'oc8', label: 'Pink', value: '#db2777', unlock: free },
  { id: 'oc17', label: 'Rosa claro', value: '#f4a6c0', unlock: free },
  { id: 'oc6', label: 'Lilás', value: '#7c5cc4', unlock: free },
  { id: 'oc7', label: 'Turquesa', value: '#0f766e', unlock: free },
  { id: 'oc18', label: 'Oliva', value: '#6b7a3a', unlock: free },
  { id: 'oc19', label: 'Bege', value: '#d6c3a5', unlock: free },
  { id: 'oc20', label: 'Branco', value: '#f3f3f1', unlock: free },
  { id: 'oc21', label: 'Cinza', value: '#9aa3ad', unlock: free },
  { id: 'oc5', label: 'Grafite', value: '#334155', unlock: free },
  { id: 'oc10', label: 'Preto', value: '#1f2430', unlock: free },
  { id: 'oc11', label: 'Verde MonY', value: '#174f2f', unlock: medal('goal_done') },
];

// ---- acessórios
export const GLASSES: CatalogItem[] = [
  { id: 'none', label: 'Sem óculos', value: 'none', unlock: free },
  { id: 'round', label: 'Redondo', value: 'round', unlock: free },
  { id: 'square', label: 'Quadrado', value: 'square', unlock: lvl(2) },
  { id: 'sun', label: 'De sol', value: 'sun', unlock: lvl(4) },
];

export const HEADWEAR: CatalogItem[] = [
  { id: 'none', label: 'Nada', value: 'none', unlock: free },
  { id: 'headphones', label: 'Fone', value: 'headphones', unlock: lvl(2) },
  { id: 'cap', label: 'Boné', value: 'cap', unlock: lvl(2) },
  { id: 'beanie', label: 'Gorro', value: 'beanie', unlock: lvl(3) },
  { id: 'fedora', label: 'Chapéu', value: 'fedora', unlock: lvl(4) },
  { id: 'capMony', label: 'Boné MonY', value: 'capMony', unlock: medal('green_month') },
  { id: 'goldPhones', label: 'Fone dourado', value: 'goldPhones', unlock: lvl(5) },
];

export const EARRINGS: CatalogItem[] = [
  { id: '0', label: 'Sem brinco', value: '0', unlock: free },
  { id: '1', label: 'Ponto', value: 'studs', unlock: free },
  { id: 'hoops', label: 'Argola', value: 'hoops', unlock: lvl(2) },
  { id: 'drops', label: 'Gota', value: 'drops', unlock: lvl(3) },
];

export const NECKLACES: CatalogItem[] = [
  { id: 'none', label: 'Sem colar', value: 'none', unlock: free },
  { id: 'chain', label: 'Corrente', value: 'chain', unlock: lvl(3) },
  { id: 'pendant', label: 'Pingente', value: 'pendant', unlock: medal('goal_done') },
];

// ---- fundos (cores lisas, degradês e cenários)
export type BgValue = { kind: 'solid' | 'gradient'; colors: [string, string] } | { kind: 'scene'; scene: SceneId };
export type SceneId = 'forest' | 'beach' | 'city' | 'desert' | 'mountains' | 'space' | 'sunset';

export const BACKGROUNDS: CatalogItem<BgValue>[] = [
  { id: 'bg1', label: 'Menta', value: { kind: 'solid', colors: ['#d8f0e2', '#c3e7d1'] }, unlock: free },
  { id: 'bg2', label: 'Céu', value: { kind: 'solid', colors: ['#dbe9f4', '#c6dcee'] }, unlock: free },
  { id: 'bg3', label: 'Areia', value: { kind: 'solid', colors: ['#f3ead6', '#ead9b5'] }, unlock: free },
  { id: 'bg4', label: 'Pêssego', value: { kind: 'solid', colors: ['#fbe3d6', '#f6cdb6'] }, unlock: free },
  { id: 'bg5', label: 'Lavanda', value: { kind: 'solid', colors: ['#e6e3f6', '#d3cdee'] }, unlock: free },
  { id: 'bg6', label: 'Cinza', value: { kind: 'solid', colors: ['#eef0f3', '#dde1e7'] }, unlock: free },
  { id: 'bg9', label: 'Floresta', value: { kind: 'scene', scene: 'forest' }, unlock: lvl(2) },
  { id: 'bg8', label: 'Praia', value: { kind: 'scene', scene: 'beach' }, unlock: lvl(2) },
  { id: 'bg15', label: 'Montanhas', value: { kind: 'scene', scene: 'mountains' }, unlock: lvl(2) },
  { id: 'bg10', label: 'Cidade', value: { kind: 'scene', scene: 'city' }, unlock: lvl(3) },
  { id: 'bg14', label: 'Deserto', value: { kind: 'scene', scene: 'desert' }, unlock: lvl(3) },
  { id: 'bg7', label: 'Pôr do sol', value: { kind: 'scene', scene: 'sunset' }, unlock: lvl(3) },
  { id: 'bg16', label: 'Espaço', value: { kind: 'scene', scene: 'space' }, unlock: lvl(4) },
  { id: 'bg11', label: 'MonY', value: { kind: 'gradient', colors: ['#2f8f57', '#2b7088'] }, unlock: medal('simulator') },
  { id: 'bg12', label: 'Noite', value: { kind: 'gradient', colors: ['#144146', '#0c8a6d'] }, unlock: lvl(5) },
  { id: 'bg13', label: 'Dourado', value: { kind: 'gradient', colors: ['#fde68a', '#d97706'] }, unlock: lvl(5) },
];

// ---------------------------------------------------------------- configuração
export interface AvatarConfig {
  base: string;
  skin: string;
  body: string; // 'm' | 'f'
  hair: string;
  hairColor: string;
  facial: string;
  outfit: string;
  outfitColor: string;
  glasses: string;
  head: string;
  earrings: string;
  necklace: string;
  bg: string;
}

export const DEFAULT_CONFIG: AvatarConfig = {
  base: 'b1',
  skin: 's2',
  body: 'm',
  hair: 'short',
  hairColor: 'hc2',
  facial: 'none',
  outfit: 'hoodie',
  outfitColor: 'oc1',
  glasses: 'none',
  head: 'none',
  earrings: '0',
  necklace: 'none',
  bg: 'bg1',
};

const KEYS: [keyof AvatarConfig, string][] = [
  ['base', 'b'],
  ['skin', 'sk'],
  ['body', 'bd'],
  ['hair', 'h'],
  ['hairColor', 'hc'],
  ['facial', 'fh'],
  ['outfit', 'o'],
  ['outfitColor', 'oc'],
  ['glasses', 'g'],
  ['head', 'hd'],
  ['earrings', 'e'],
  ['necklace', 'nk'],
  ['bg', 'bg'],
];

export function encodeConfig(c: AvatarConfig): string {
  return KEYS.map(([k, short]) => `${short}-${c[k]}`).join('.');
}

/** Aplica uma base (tom, rosto, cabelo, barba) mantendo roupa, acessórios e fundo */
export function applyBase(c: AvatarConfig, baseId: string): AvatarConfig {
  const b = BASES.find((x) => x.id === baseId);
  if (!b) return c;
  return {
    ...c,
    base: b.id,
    skin: b.value.skin,
    body: b.value.body,
    hair: b.value.hair,
    hairColor: b.value.hairColor,
    facial: b.value.facial ?? 'none',
  };
}

export function decodeConfig(s: string): AvatarConfig {
  const parsed: Partial<AvatarConfig> = {};
  s.split('.').forEach((part) => {
    const i = part.indexOf('-');
    if (i < 0) return;
    const short = part.slice(0, i);
    const val = part.slice(i + 1);
    const entry = KEYS.find(([, sh]) => sh === short);
    if (entry) parsed[entry[0]] = val;
  });
  // versões antigas (sem tom de pele/rosto): completa a partir da base
  const fromBase = applyBase(DEFAULT_CONFIG, parsed.base ?? DEFAULT_CONFIG.base);
  return { ...fromBase, ...parsed } as AvatarConfig;
}

export function mouthOf(c: AvatarConfig): 'smile' | 'grin' {
  return BASES.find((b) => b.id === c.base)?.value.mouth ?? 'smile';
}

// ---------------------------------------------------------------- desbloqueio
export function isUnlocked(u: Unlock, level: number, medals: MedalId[]): boolean {
  if (u.kind === 'free') return true;
  if (u.kind === 'level') return level >= u.level;
  return medals.includes(u.medal);
}

export const CATALOG: Partial<Record<keyof AvatarConfig, CatalogItem<any>[]>> = {
  base: BASES,
  skin: SKINS,
  hair: HAIRS,
  hairColor: HAIR_COLORS,
  facial: FACIAL,
  outfit: OUTFITS,
  outfitColor: OUTFIT_COLORS,
  glasses: GLASSES,
  head: HEADWEAR,
  earrings: EARRINGS,
  necklace: NECKLACES,
  bg: BACKGROUNDS,
};

/** Itens da configuração que o usuário AINDA NÃO desbloqueou (validação antes de salvar) */
export function lockedItemsIn(c: AvatarConfig, level: number, medals: MedalId[]): CatalogItem<any>[] {
  return (Object.keys(CATALOG) as (keyof AvatarConfig)[])
    .map((k) => CATALOG[k]!.find((it) => it.id === c[k]))
    .filter((it): it is CatalogItem<any> => !!it && !isUnlocked(it.unlock, level, medals));
}

export function countUnlocked(level: number, medals: MedalId[]) {
  const all = Object.values(CATALOG).flat() as CatalogItem<any>[];
  return { unlocked: all.filter((i) => isUnlocked(i.unlock, level, medals)).length, total: all.length };
}

/** Combinação aleatória só com itens liberados (botão "surpresa") */
export function randomConfig(level: number, medals: MedalId[], keep: AvatarConfig): AvatarConfig {
  const pick = (list: CatalogItem<any>[]) => {
    const ok = list.filter((i) => isUnlocked(i.unlock, level, medals));
    return ok[Math.floor(Math.random() * ok.length)].id;
  };
  return {
    ...keep,
    hair: pick(HAIRS),
    hairColor: pick(HAIR_COLORS),
    facial: keep.body === 'm' ? pick(FACIAL) : 'none',
    outfit: pick(OUTFITS),
    outfitColor: pick(OUTFIT_COLORS),
    glasses: pick(GLASSES),
    head: pick(HEADWEAR),
    earrings: pick(EARRINGS),
    necklace: pick(NECKLACES),
    bg: pick(BACKGROUNDS),
  };
}
