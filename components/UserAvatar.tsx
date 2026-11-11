import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Avatar } from '../context/AuthContext';
import { fileUrl } from '../lib/api';
import { CustomAvatarSvg } from './RealisticAvatar';

// =============================================================================
// Avatares do MonY (todos desenhados em SVG, exclusivos do app)
//  • Personagens (20) — rosto com sobrancelha, nariz, brilho no olho,
//    cabelos variados e acessórios (boné, gorro, fone, brinco, laço, óculos)
//  • Bichinhos (8)
//  • Ilustrações (12)
//  • Iniciais do nome (16 cores)
//  • Foto enviada pelo usuário
// Os ids antigos (p1…p8, i_sprout…) continuam válidos.
// =============================================================================

type HairStyle =
  | 'short' | 'side' | 'long' | 'bun' | 'curly' | 'buzz' | 'longCurly'
  | 'afro' | 'bob' | 'spiky' | 'bald' | 'ponytail' | 'pigtails';
type Outfit = 'tee' | 'hoodie' | 'collar' | 'vneck';
type Mouth = 'smile' | 'grin' | 'smirk';

export interface Person {
  id: string;
  label: string;
  bg: [string, string];
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  outfit?: Outfit;
  mouth?: Mouth;
  glasses?: 'round' | 'square' | 'sun';
  beard?: 'full' | 'mustache';
  hat?: { type: 'cap' | 'beanie'; color: string };
  headphones?: string;
  earrings?: boolean;
  bow?: string;
  freckles?: boolean;
}

const PEOPLE: Person[] = [
  { id: 'p1', label: 'Lucas', bg: ['#d8f0e2', '#b9e3c9'], skin: '#f2c9a5', hair: '#5b3a24', hairStyle: 'short', shirt: '#1f6b3f', outfit: 'hoodie', mouth: 'grin' },
  { id: 'p2', label: 'Ana', bg: ['#dbe9f4', '#bdd6ec'], skin: '#d9a47c', hair: '#2a1d18', hairStyle: 'long', shirt: '#2b7088', outfit: 'vneck', earrings: true },
  { id: 'p3', label: 'Bruno', bg: ['#f3ead6', '#ead8b0'], skin: '#8d5a3b', hair: '#1b1412', hairStyle: 'curly', shirt: '#e2a93b', mouth: 'grin' },
  { id: 'p4', label: 'Júlia', bg: ['#fbe3d6', '#f6c9b1'], skin: '#f5d0b5', hair: '#b4532a', hairStyle: 'bun', shirt: '#334155', glasses: 'round', freckles: true },
  { id: 'p5', label: 'Rafael', bg: ['#e6e3f6', '#cfc9ef'], skin: '#b67a52', hair: '#2b211c', hairStyle: 'buzz', shirt: '#64748b', beard: 'full', outfit: 'collar' },
  { id: 'p6', label: 'Pedro', bg: ['#fbf3d0', '#f5e39b'], skin: '#f6d3b8', hair: '#d4a13a', hairStyle: 'side', shirt: '#e0675a', mouth: 'smirk' },
  { id: 'p7', label: 'Camila', bg: ['#f8e1ea', '#f1c3d5'], skin: '#6f4430', hair: '#1a1210', hairStyle: 'longCurly', shirt: '#7c5cc4', earrings: true, mouth: 'grin' },
  { id: 'p8', label: 'Sérgio', bg: ['#e1efe0', '#c6e0c3'], skin: '#e9bf9b', hair: '#a8adb3', hairStyle: 'side', shirt: '#7a5a3c', glasses: 'square', beard: 'full', outfit: 'collar' },
  { id: 'p9', label: 'Malu', bg: ['#ffe4ec', '#ffc2d4'], skin: '#f3cfb3', hair: '#3b2a20', hairStyle: 'pigtails', shirt: '#ec4899', bow: '#f43f5e', mouth: 'grin', freckles: true },
  { id: 'p10', label: 'Davi', bg: ['#dbeafe', '#bfdbfe'], skin: '#c68c5f', hair: '#1f1a17', hairStyle: 'short', shirt: '#1d4ed8', hat: { type: 'cap', color: '#ef4444' }, mouth: 'grin' },
  { id: 'p11', label: 'Bia', bg: ['#ede9fe', '#ddd6fe'], skin: '#f5d6c0', hair: '#7c3aed', hairStyle: 'bob', shirt: '#0f766e', headphones: '#111827', mouth: 'smile' },
  { id: 'p12', label: 'Thiago', bg: ['#fef3c7', '#fde68a'], skin: '#a86b45', hair: '#111111', hairStyle: 'afro', shirt: '#16a34a', outfit: 'tee', mouth: 'grin' },
  { id: 'p13', label: 'Lara', bg: ['#cffafe', '#a5f3fc'], skin: '#e8b48f', hair: '#e8a33d', hairStyle: 'ponytail', shirt: '#f97316', outfit: 'hoodie', mouth: 'smile', freckles: true },
  { id: 'p14', label: 'Gabriel', bg: ['#e0f2fe', '#bae6fd'], skin: '#f1c7a1', hair: '#2c2c2c', hairStyle: 'spiky', shirt: '#0ea5e9', glasses: 'sun', mouth: 'smirk' },
  { id: 'p15', label: 'Helena', bg: ['#fae8ff', '#f5d0fe'], skin: '#5a3726', hair: '#0f0b0a', hairStyle: 'bun', shirt: '#a21caf', earrings: true, outfit: 'vneck', mouth: 'grin' },
  { id: 'p16', label: 'Otávio', bg: ['#f1f5f9', '#e2e8f0'], skin: '#d9a47c', hair: '#6b7280', hairStyle: 'bald', shirt: '#334155', glasses: 'round', beard: 'mustache', outfit: 'collar' },
  { id: 'p17', label: 'Nina', bg: ['#dcfce7', '#bbf7d0'], skin: '#f6d5bd', hair: '#c2410c', hairStyle: 'long', shirt: '#15803d', hat: { type: 'beanie', color: '#facc15' }, mouth: 'grin', freckles: true },
  { id: 'p18', label: 'Caio', bg: ['#fee2e2', '#fecaca'], skin: '#7b4a30', hair: '#141010', hairStyle: 'buzz', shirt: '#b91c1c', headphones: '#e5e7eb', outfit: 'hoodie', mouth: 'grin' },
  { id: 'p19', label: 'Sofia', bg: ['#e0e7ff', '#c7d2fe'], skin: '#efc4a0', hair: '#1e1b4b', hairStyle: 'bob', shirt: '#4338ca', glasses: 'square', earrings: true, mouth: 'smile' },
  { id: 'p20', label: 'Enzo', bg: ['#ecfccb', '#d9f99d'], skin: '#f2c9a5', hair: '#7c4a1e', hairStyle: 'curly', shirt: '#65a30d', hat: { type: 'beanie', color: '#1f6b3f' }, outfit: 'hoodie', mouth: 'grin' },
];

type AnimalKind = 'cat' | 'dog' | 'panda' | 'fox' | 'bear' | 'bunny' | 'frog' | 'penguin';
const ANIMALS: { id: string; label: string; kind: AnimalKind; bg: [string, string] }[] = [
  { id: 'a_cat', label: 'Gatinho', kind: 'cat', bg: ['#fff1e0', '#ffd9ad'] },
  { id: 'a_dog', label: 'Cachorrinho', kind: 'dog', bg: ['#e0f2fe', '#bae6fd'] },
  { id: 'a_panda', label: 'Panda', kind: 'panda', bg: ['#dcfce7', '#a7f3d0'] },
  { id: 'a_fox', label: 'Raposa', kind: 'fox', bg: ['#fef3c7', '#fde68a'] },
  { id: 'a_bear', label: 'Ursinho', kind: 'bear', bg: ['#fae8ff', '#f5d0fe'] },
  { id: 'a_bunny', label: 'Coelhinho', kind: 'bunny', bg: ['#ffe4ec', '#fecdd3'] },
  { id: 'a_frog', label: 'Sapinho', kind: 'frog', bg: ['#e0f7fa', '#b2ebf2'] },
  { id: 'a_penguin', label: 'Pinguim', kind: 'penguin', bg: ['#e0e7ff', '#c7d2fe'] },
];

const ILLUSTRATIONS = [
  { id: 'i_sprout', label: 'Broto', icon: 'sprout', bg: ['#e3f3e8', '#1f6b3f'] },
  { id: 'i_growth', label: 'Crescimento', icon: 'chart-line-variant', bg: ['#dcedf2', '#2b7088'] },
  { id: 'i_piggy', label: 'Cofrinho', icon: 'piggy-bank-outline', bg: ['#fbe7ea', '#c2566b'] },
  { id: 'i_wallet', label: 'Carteira', icon: 'wallet-outline', bg: ['#f4eedb', '#9a7417'] },
  { id: 'i_coins', label: 'Moedas', icon: 'hand-coin-outline', bg: ['#fef3c7', '#b45309'] },
  { id: 'i_target', label: 'Meta', icon: 'bullseye-arrow', bg: ['#fee2e2', '#dc2626'] },
  { id: 'i_rocket', label: 'Foguete', icon: 'rocket-launch-outline', bg: ['#ede9fe', '#6d28d9'] },
  { id: 'i_plane', label: 'Viagem', icon: 'airplane', bg: ['#e0f2fe', '#0369a1'] },
  { id: 'i_coffee', label: 'Café', icon: 'coffee-outline', bg: ['#f5ebe0', '#7c4a1e'] },
  { id: 'i_music', label: 'Música', icon: 'music-note', bg: ['#fce7f3', '#be185d'] },
  { id: 'i_game', label: 'Games', icon: 'gamepad-variant-outline', bg: ['#e0e7ff', '#4338ca'] },
  { id: 'i_ball', label: 'Esporte', icon: 'basketball', bg: ['#ffedd5', '#c2410c'] },
] as const;

export const INITIALS_COLORS = [
  ['#1f6b3f', '#ffffff'],
  ['#2b7088', '#ffffff'],
  ['#d8f0e2', '#1f6b3f'],
  ['#dcedf2', '#21576b'],
  ['#7c5cc4', '#ffffff'],
  ['#e0675a', '#ffffff'],
  ['#f4eedb', '#7a5c12'],
  ['#334155', '#ffffff'],
  ['#0f766e', '#ffffff'],
  ['#1d4ed8', '#ffffff'],
  ['#be185d', '#ffffff'],
  ['#ea580c', '#ffffff'],
  ['#fde68a', '#92400e'],
  ['#fbcfe8', '#9d174d'],
  ['#c7d2fe', '#3730a3'],
  ['#bbf7d0', '#166534'],
] as const;

export const AVATAR_PRESETS = [
  ...PEOPLE.map((p) => ({ id: p.id, label: p.label })),
  ...ANIMALS.map((a) => ({ id: a.id, label: a.label })),
  ...ILLUSTRATIONS.map((i) => ({ id: i.id, label: i.label })),
];

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `#${[c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function Bg({ id, colors }: { id: string; colors: [string, string] }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`bg_${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
        <ClipPath id={`clip_${id}`}>
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#bg_${id})`} />
    </>
  );
}

// ------------------------------------------------------------- personagens
export function PersonSvg({ p, size }: { p: Person; size: number }) {
  const ink = '#2a2420';
  const skinShade = shade(p.skin, -22);
  const hairDark = shade(p.hair, -25);
  const outfit = p.outfit ?? 'tee';
  const mouth = p.mouth ?? 'smile';

  // ---- cabelo de trás
  const backHair: ReactNode = (() => {
    switch (p.hairStyle) {
      case 'long':
        return <Path d="M30 44 C29 25 40 19 50 19 C60 19 71 25 70 44 L72 76 C64 78 58 73 58 66 L42 66 C42 73 36 78 28 76 Z" fill={p.hair} />;
      case 'longCurly':
        return (
          <G fill={p.hair}>
            {[[32, 50, 9], [68, 50, 9], [30, 62, 9], [70, 62, 9], [33, 73, 8], [67, 73, 8], [36, 36, 9], [64, 36, 9]].map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} />
            ))}
          </G>
        );
      case 'afro':
        return (
          <G fill={p.hair}>
            <Circle cx={50} cy={38} r={25} />
            {[[28, 42, 9], [72, 42, 9], [32, 26, 9], [68, 26, 9], [50, 15, 10]].map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} />
            ))}
          </G>
        );
      case 'bob':
        return <Path d="M30 46 C29 26 40 20 50 20 C60 20 71 26 70 46 L70 60 C66 63 62 61 62 57 L38 57 C38 61 34 63 30 60 Z" fill={p.hair} />;
      case 'ponytail':
        return <Path d="M63 30 C78 32 82 52 74 66 C72 56 70 44 62 40 Z" fill={p.hair} />;
      case 'pigtails':
        return (
          <G fill={p.hair}>
            <Circle cx={29} cy={52} r={8} />
            <Circle cx={71} cy={52} r={8} />
            <Circle cx={27} cy={62} r={6} />
            <Circle cx={73} cy={62} r={6} />
          </G>
        );
      default:
        return null;
    }
  })();

  // ---- roupa
  const body = (
    <G>
      <Path d="M16 100 C16 80 31 72 50 72 C69 72 84 80 84 100 Z" fill={p.shirt} />
      {outfit === 'tee' && <Path d="M42 72 Q50 80 58 72" stroke={shade(p.shirt, -30)} strokeWidth={2.5} fill="none" />}
      {outfit === 'vneck' && <Path d="M43 72 L50 83 L57 72 Z" fill={skinShade} />}
      {outfit === 'collar' && (
        <G>
          <Path d="M43 72 L50 81 L57 72 Z" fill={skinShade} />
          <Path d="M41 71 L50 81 L45 84 Z" fill="#ffffff" />
          <Path d="M59 71 L50 81 L55 84 Z" fill="#ffffff" />
          <Circle cx={50} cy={88} r={1.3} fill={shade(p.shirt, -40)} />
          <Circle cx={50} cy={94} r={1.3} fill={shade(p.shirt, -40)} />
        </G>
      )}
      {outfit === 'hoodie' && (
        <G>
          <Path d="M33 75 Q50 90 67 75 Q63 70 58 72 Q50 80 42 72 Q37 70 33 75 Z" fill={shade(p.shirt, 25)} />
          <Line x1={46} y1={81} x2={46} y2={91} stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
          <Line x1={54} y1={81} x2={54} y2={91} stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
        </G>
      )}
    </G>
  );

  // ---- cabelo da frente
  const frontHair: ReactNode = (() => {
    switch (p.hairStyle) {
      case 'short':
        return <Path d="M33 43 C31 27 41 21 50 21 C60 21 69 27 67 43 C64 34 58 30 50 30 C42 30 36 34 33 43 Z" fill={p.hair} />;
      case 'side':
        return <Path d="M33 43 C30 27 42 20 52 21 C63 22 70 30 67 43 C63 34 55 29 45 32 C40 34 36 38 33 43 Z" fill={p.hair} />;
      case 'buzz':
        return <Path d="M34 40 C34 29 42 24 50 24 C58 24 66 29 66 40 C62 34 56 32 50 32 C44 32 38 34 34 40 Z" fill={p.hair} opacity={0.9} />;
      case 'long':
      case 'bun':
      case 'ponytail':
      case 'pigtails':
        return <Path d="M33 41 C34 29 42 24 50 24 C58 24 66 29 67 41 C60 33 51 31 45 33 C40 35 36 37 33 41 Z" fill={p.hair} />;
      case 'bob':
        return <Path d="M33 42 C33 29 41 23 50 23 C59 23 67 29 67 42 C60 37 40 37 33 42 Z" fill={p.hair} />;
      case 'spiky':
        return <Path d="M33 42 L33 30 L39 33 L40 23 L46 29 L50 19 L54 29 L60 23 L61 33 L67 30 L67 42 C62 35 56 32 50 32 C44 32 38 35 33 42 Z" fill={p.hair} />;
      case 'curly':
      case 'longCurly':
        return (
          <G fill={p.hair}>
            {[[36, 35, 7], [42, 28, 7.5], [50, 25, 8], [58, 28, 7.5], [64, 35, 7], [34, 42, 4.5], [66, 42, 4.5]].map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} />
            ))}
          </G>
        );
      case 'afro':
        return (
          <G fill={p.hair}>
            {[[38, 31, 6], [46, 28, 6], [54, 28, 6], [62, 31, 6]].map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} />
            ))}
          </G>
        );
      case 'bald':
        return <Ellipse cx={44} cy={31} rx={5} ry={2.5} fill="#ffffff" opacity={0.35} />;
      default:
        return null;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Bg id={p.id} colors={p.bg} />
      <G clipPath={`url(#clip_${p.id})`}>
      {backHair}
      {body}
      <Rect x={43} y={57} width={14} height={16} rx={6} fill={skinShade} />
      {/* orelhas */}
      <Circle cx={33} cy={46} r={4} fill={shade(p.skin, -10)} />
      <Circle cx={67} cy={46} r={4} fill={shade(p.skin, -10)} />
      {p.earrings && (
        <G fill="#f5b301">
          <Circle cx={33} cy={52} r={1.8} />
          <Circle cx={67} cy={52} r={1.8} />
        </G>
      )}
      {/* rosto */}
      <Ellipse cx={50} cy={44} rx={17} ry={19} fill={p.skin} />
      {p.beard === 'full' && <Path d="M33 45 C34 60 41 66 50 66 C59 66 66 60 67 45 C64 54 58 57 50 57 C42 57 36 54 33 45 Z" fill={p.hair} />}
      {/* sobrancelhas */}
      {p.glasses !== 'sun' && (
        <G stroke={hairDark} strokeWidth={1.6} strokeLinecap="round" fill="none">
          <Path d="M39.5 40.5 Q43 38.4 46.5 40" />
          <Path d="M53.5 40 Q57 38.4 60.5 40.5" />
        </G>
      )}
      {/* olhos com brilho */}
      <Ellipse cx={43} cy={46.2} rx={2} ry={2.5} fill={ink} />
      <Ellipse cx={57} cy={46.2} rx={2} ry={2.5} fill={ink} />
      <Circle cx={43.7} cy={45.3} r={0.75} fill="#ffffff" />
      <Circle cx={57.7} cy={45.3} r={0.75} fill="#ffffff" />
      {/* nariz */}
      <Path d="M49.6 48.5 Q48.6 51.6 50.6 52" stroke={shade(p.skin, -45)} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      {/* bochechas / sardas */}
      <Circle cx={38.5} cy={52} r={2.8} fill="#ff7a7a" opacity={0.22} />
      <Circle cx={61.5} cy={52} r={2.8} fill="#ff7a7a" opacity={0.22} />
      {p.freckles && (
        <G fill={shade(p.skin, -60)} opacity={0.55}>
          <Circle cx={37} cy={50} r={0.6} />
          <Circle cx={39.5} cy={51} r={0.6} />
          <Circle cx={38} cy={52.6} r={0.6} />
          <Circle cx={63} cy={50} r={0.6} />
          <Circle cx={60.5} cy={51} r={0.6} />
          <Circle cx={62} cy={52.6} r={0.6} />
        </G>
      )}
      {/* boca */}
      {p.beard === 'mustache' && <Path d="M43.5 53 Q47 50.6 50 52.3 Q53 50.6 56.5 53 Q53 54.6 50 53.6 Q47 54.6 43.5 53 Z" fill={p.hair} />}
      {mouth === 'smile' && <Path d="M44.5 55 Q50 59.5 55.5 55" stroke={p.beard === 'full' ? '#f5efe8' : ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />}
      {mouth === 'smirk' && <Path d="M45.5 56.2 Q51.5 58.6 55.5 54.6" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />}
      {mouth === 'grin' && (
        <G>
          <Path d="M44 54.5 Q50 62 56 54.5 Z" fill="#7a2e2e" />
          <Path d="M45 54.8 Q50 56.4 55 54.8 L54.4 56 Q50 57.3 45.6 56 Z" fill="#ffffff" />
        </G>
      )}
      {/* óculos */}
      {p.glasses === 'round' && (
        <G stroke="#1f2937" strokeWidth={1.6} fill="none">
          <Circle cx={43} cy={46} r={5} />
          <Circle cx={57} cy={46} r={5} />
          <Path d="M48 46 L52 46" />
        </G>
      )}
      {p.glasses === 'square' && (
        <G stroke="#1f2937" strokeWidth={1.6} fill="none">
          <Rect x={37.5} y={42} width={11} height={8.5} rx={2} />
          <Rect x={51.5} y={42} width={11} height={8.5} rx={2} />
          <Path d="M48.5 46 L51.5 46" />
        </G>
      )}
      {p.glasses === 'sun' && (
        <G>
          <Path d="M36.5 42 H48.5 V46 Q48.5 50.5 43 50.5 Q36.5 50.5 36.5 46 Z" fill="#111827" />
          <Path d="M51.5 42 H63.5 V46 Q63.5 50.5 58 50.5 Q51.5 50.5 51.5 46 Z" fill="#111827" />
          <Path d="M48.5 43.5 L51.5 43.5" stroke="#111827" strokeWidth={1.6} />
          <Path d="M39 44 L42 44" stroke="#ffffff" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
          <Path d="M54 44 L57 44" stroke="#ffffff" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
        </G>
      )}
      {frontHair}
      {p.hairStyle === 'bun' && <Circle cx={50} cy={19} r={7.5} fill={p.hair} />}
      {p.hairStyle === 'ponytail' && <Rect x={61} y={33} width={4} height={6} rx={1.5} fill="#f43f5e" />}
      {p.hairStyle === 'pigtails' && (
        <G fill={p.bow ?? '#f43f5e'}>
          <Circle cx={34} cy={45} r={2} />
          <Circle cx={66} cy={45} r={2} />
        </G>
      )}
      {/* chapéus */}
      {p.hat?.type === 'cap' && (
        <G>
          <Path d="M31 40 C31 24 41 19 50 19 C59 19 69 24 69 40 Z" fill={p.hat.color} />
          <Path d="M29 39 Q50 33 71 39 L73 42 Q50 37 27 42 Z" fill={shade(p.hat.color, -35)} />
          <Circle cx={50} cy={19.5} r={2} fill={shade(p.hat.color, -35)} />
          <Path d="M46 25 Q50 22 54 25" stroke="#ffffff" strokeWidth={1.5} fill="none" opacity={0.7} />
        </G>
      )}
      {p.hat?.type === 'beanie' && (
        <G>
          <Path d="M31 40 C30 22 41 17 50 17 C59 17 70 22 69 40 Z" fill={p.hat.color} />
          <Rect x={29.5} y={35} width={41} height={7} rx={3} fill={shade(p.hat.color, -30)} />
          <Circle cx={50} cy={15} r={4.5} fill={shade(p.hat.color, -30)} />
        </G>
      )}
      {p.headphones && (
        <G>
          <Path d="M30 46 C29 22 71 22 70 46" stroke={p.headphones} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <Rect x={26} y={40} width={8} height={13} rx={3.5} fill={p.headphones} />
          <Rect x={66} y={40} width={8} height={13} rx={3.5} fill={p.headphones} />
          <Rect x={27.5} y={42.5} width={2.5} height={8} rx={1.2} fill={p.shirt} opacity={0.9} />
          <Rect x={70} y={42.5} width={2.5} height={8} rx={1.2} fill={p.shirt} opacity={0.9} />
        </G>
      )}
      {p.bow && p.hairStyle !== 'pigtails' && (
        <G fill={p.bow}>
          <Path d="M58 24 L65 20 L64 28 Z" />
          <Path d="M72 24 L65 20 L66 28 Z" />
          <Circle cx={65} cy={24} r={2} />
        </G>
      )}
      {p.bow && p.hairStyle === 'pigtails' && (
        <G fill={p.bow}>
          <Path d="M58 23 L64 19.5 L63.5 26.5 Z" />
          <Path d="M70 23 L64 19.5 L64.5 26.5 Z" />
          <Circle cx={64} cy={23} r={1.8} />
        </G>
      )}
      </G>
    </Svg>
  );
}

// ------------------------------------------------------------- bichinhos
function AnimalEyes({ y = 54, dx = 9, color = '#1f1a17' }: { y?: number; dx?: number; color?: string }) {
  return (
    <G>
      <Ellipse cx={50 - dx} cy={y} rx={2.6} ry={3.1} fill={color} />
      <Ellipse cx={50 + dx} cy={y} rx={2.6} ry={3.1} fill={color} />
      <Circle cx={50 - dx + 0.9} cy={y - 1.2} r={0.95} fill="#ffffff" />
      <Circle cx={50 + dx + 0.9} cy={y - 1.2} r={0.95} fill="#ffffff" />
    </G>
  );
}
const Blush = ({ y = 61, dx = 15 }: { y?: number; dx?: number }) => (
  <G fill="#ff7a8a" opacity={0.35}>
    <Ellipse cx={50 - dx} cy={y} rx={3.5} ry={2.2} />
    <Ellipse cx={50 + dx} cy={y} rx={3.5} ry={2.2} />
  </G>
);

function AnimalSvg({ id, kind, bg, size }: { id: string; kind: AnimalKind; bg: [string, string]; size: number }) {
  const ink = '#1f1a17';
  let art: ReactNode = null;
  switch (kind) {
    case 'cat':
      art = (
        <G>
          <Path d="M28 46 L31 20 L47 34 Z" fill="#f2a65a" />
          <Path d="M72 46 L69 20 L53 34 Z" fill="#f2a65a" />
          <Path d="M32 40 L33.5 26 L42 34 Z" fill="#ffc8c8" />
          <Path d="M68 40 L66.5 26 L58 34 Z" fill="#ffc8c8" />
          <Circle cx={50} cy={57} r={25} fill="#f2a65a" />
          <Path d="M44 34 L47 42 M50 33 L50 42 M56 34 L53 42" stroke="#d9823a" strokeWidth={2} strokeLinecap="round" />
          <Ellipse cx={50} cy={66} rx={11} ry={8} fill="#fde6cf" />
          <AnimalEyes />
          <Path d="M47.5 61 H52.5 L50 64 Z" fill="#f08a9a" />
          <Path d="M50 64 Q48 67.5 44.5 66.5 M50 64 Q52 67.5 55.5 66.5" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <G stroke="#8a5a2b" strokeWidth={1} strokeLinecap="round">
            <Line x1={33} y1={62} x2={22} y2={60} />
            <Line x1={33} y1={65} x2={22} y2={66} />
            <Line x1={67} y1={62} x2={78} y2={60} />
            <Line x1={67} y1={65} x2={78} y2={66} />
          </G>
        </G>
      );
      break;
    case 'dog':
      art = (
        <G>
          <Circle cx={50} cy={56} r={24} fill="#e0b07a" />
          <Path d="M29 38 C18 44 18 66 28 70 C33 62 34 48 34 40 Z" fill="#8d5a34" />
          <Path d="M71 38 C82 44 82 66 72 70 C67 62 66 48 66 40 Z" fill="#8d5a34" />
          <Ellipse cx={58} cy={46} rx={7} ry={6} fill="#c08a55" />
          <Ellipse cx={50} cy={66} rx={11} ry={8.5} fill="#f6e3cc" />
          <AnimalEyes y={52} />
          <Ellipse cx={50} cy={61} rx={4} ry={3} fill={ink} />
          <Path d="M50 64 L50 66.5 M50 66.5 Q47 69 44.5 67 M50 66.5 Q53 69 55.5 67" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Path d="M48 68.5 Q50 74 52 68.5 Z" fill="#f2707f" />
        </G>
      );
      break;
    case 'panda':
      art = (
        <G>
          <Circle cx={30} cy={35} r={8} fill="#2b2b2b" />
          <Circle cx={70} cy={35} r={8} fill="#2b2b2b" />
          <Circle cx={50} cy={56} r={25} fill="#fafafa" />
          <Ellipse cx={40} cy={54} rx={6.5} ry={8} fill="#2b2b2b" transform="rotate(-20 40 54)" />
          <Ellipse cx={60} cy={54} rx={6.5} ry={8} fill="#2b2b2b" transform="rotate(20 60 54)" />
          <Circle cx={40.6} cy={53} r={2.3} fill="#ffffff" />
          <Circle cx={59.4} cy={53} r={2.3} fill="#ffffff" />
          <Circle cx={40.8} cy={53.3} r={1.2} fill={ink} />
          <Circle cx={59.2} cy={53.3} r={1.2} fill={ink} />
          <Ellipse cx={50} cy={63} rx={3.5} ry={2.5} fill="#2b2b2b" />
          <Path d="M50 65 Q47.5 68 45 66.5 M50 65 Q52.5 68 55 66.5" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Blush y={64} dx={17} />
        </G>
      );
      break;
    case 'fox':
      art = (
        <G>
          <Path d="M27 48 L30 18 L47 36 Z" fill="#f07b3f" />
          <Path d="M73 48 L70 18 L53 36 Z" fill="#f07b3f" />
          <Path d="M31 41 L32.5 26 L41 35 Z" fill="#3a2418" />
          <Path d="M69 41 L67.5 26 L59 35 Z" fill="#3a2418" />
          <Circle cx={50} cy={57} r={25} fill="#f07b3f" />
          <Path d="M26 58 C33 75 45 81 50 81 C55 81 67 75 74 58 C64 63 56 61 50 70 C44 61 36 63 26 58 Z" fill="#ffffff" />
          <AnimalEyes y={53} dx={10} />
          <Ellipse cx={50} cy={68.5} rx={3.3} ry={2.4} fill={ink} />
          <Path d="M50 71 Q48.5 73 46.5 72.3 M50 71 Q51.5 73 53.5 72.3" stroke={ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </G>
      );
      break;
    case 'bear':
      art = (
        <G>
          <Circle cx={30} cy={36} r={9} fill="#a86b45" />
          <Circle cx={70} cy={36} r={9} fill="#a86b45" />
          <Circle cx={30} cy={36} r={4.5} fill="#e7b48f" />
          <Circle cx={70} cy={36} r={4.5} fill="#e7b48f" />
          <Circle cx={50} cy={56} r={25} fill="#a86b45" />
          <Ellipse cx={50} cy={65} rx={11.5} ry={9} fill="#e7c09b" />
          <AnimalEyes y={52} />
          <Ellipse cx={50} cy={61} rx={4} ry={3} fill={ink} />
          <Path d="M50 64 L50 66 M50 66 Q47 69 44.5 67.3 M50 66 Q53 69 55.5 67.3" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Blush y={60} dx={17} />
        </G>
      );
      break;
    case 'bunny':
      art = (
        <G>
          <Ellipse cx={40} cy={26} rx={7} ry={18} fill="#f7eef0" />
          <Ellipse cx={60} cy={26} rx={7} ry={18} fill="#f7eef0" />
          <Ellipse cx={40} cy={27} rx={3.5} ry={13} fill="#ffc4d0" />
          <Ellipse cx={60} cy={27} rx={3.5} ry={13} fill="#ffc4d0" />
          <Circle cx={50} cy={60} r={23} fill="#f7eef0" />
          <AnimalEyes y={57} />
          <Path d="M47.5 63 H52.5 L50 66 Z" fill="#f08a9a" />
          <Path d="M50 66 Q47.5 69 45 67.5 M50 66 Q52.5 69 55 67.5" stroke={ink} strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <Rect x={48} y={67.5} width={4} height={4} rx={1} fill="#ffffff" stroke="#e5d5d9" strokeWidth={0.6} />
          <Blush y={64} dx={14} />
        </G>
      );
      break;
    case 'frog':
      art = (
        <G>
          <Circle cx={36} cy={40} r={10} fill="#7cc96b" />
          <Circle cx={64} cy={40} r={10} fill="#7cc96b" />
          <Ellipse cx={50} cy={62} rx={27} ry={21} fill="#7cc96b" />
          <Circle cx={36} cy={40} r={6} fill="#ffffff" />
          <Circle cx={64} cy={40} r={6} fill="#ffffff" />
          <Circle cx={37} cy={41} r={3.2} fill={ink} />
          <Circle cx={63} cy={41} r={3.2} fill={ink} />
          <Circle cx={38} cy={39.8} r={1} fill="#ffffff" />
          <Circle cx={64} cy={39.8} r={1} fill="#ffffff" />
          <Path d="M36 64 Q50 76 64 64" stroke="#2f6b2a" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Circle cx={46} cy={57} r={1} fill="#2f6b2a" />
          <Circle cx={54} cy={57} r={1} fill="#2f6b2a" />
          <Blush y={66} dx={19} />
        </G>
      );
      break;
    case 'penguin':
      art = (
        <G>
          <Circle cx={50} cy={56} r={26} fill="#2f3b4c" />
          <Path d="M50 46 C42 36 28 42 29 56 C30 70 40 79 50 79 C60 79 70 70 71 56 C72 42 58 36 50 46 Z" fill="#ffffff" />
          <AnimalEyes y={55} dx={9} />
          <Path d="M45 61 L55 61 L50 67 Z" fill="#f59e0b" />
          <Blush y={64} dx={14} />
        </G>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Bg id={id} colors={bg} />
      <G clipPath={`url(#clip_${id})`}>{art}</G>
    </Svg>
  );
}


/** Lê apenas a imagem local deste navegador/dispositivo, sem Cloud Storage. */
function LocalProfilePhoto({ storageKey, size, name }: { storageKey: string; size: number; name: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUri(null);
    AsyncStorage.getItem(storageKey).then((value) => { if (active) setUri(value); }).catch(() => {});
    return () => { active = false; };
  }, [storageKey]);
  if (!uri) {
    return <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe' }}><Text style={{ fontSize: size * 0.4, color: '#1e40af' }}>{(name || '?')[0].toUpperCase()}</Text></View>;
  }
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

// ------------------------------------------------------------- componente
interface UserAvatarProps {
  avatar: Avatar | null | undefined;
  name: string;
  size?: number;
  /** foto local ainda não enviada (pré-visualização) */
  previewUri?: string;
}

export function UserAvatar({ avatar, name, size = 64, previewUri }: UserAvatarProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (previewUri) {
    return <Image source={{ uri: previewUri }} style={[round, styles.photo]} />;
  }

  if (avatar?.type === 'photo') {
    if (avatar.value.startsWith('local:')) {
      return <LocalProfilePhoto storageKey={avatar.value.slice(6)} size={size} name={name} />;
    }
    // Fotos remotas antigas continuam funcionando caso já existam.
    return <Image source={{ uri: fileUrl(avatar.value) }} style={[round, styles.photo]} />;
  }

  if (avatar?.type === 'custom') {
    return <CustomAvatarSvg config={avatar.value} size={size} />;
  }

  if (avatar?.type === 'preset') {
    const person = PEOPLE.find((p) => p.id === avatar.value);
    if (person) return <PersonSvg p={person} size={size} />;
    const animal = ANIMALS.find((a) => a.id === avatar.value);
    if (animal) return <AnimalSvg id={animal.id} kind={animal.kind} bg={animal.bg} size={size} />;
    const ill = ILLUSTRATIONS.find((i) => i.id === avatar.value);
    if (ill) {
      return (
        <View style={[round, styles.center, { backgroundColor: ill.bg[0] }]}>
          <MaterialCommunityIcons name={ill.icon as any} size={size * 0.52} color={ill.bg[1]} />
        </View>
      );
    }
  }

  // iniciais (padrão)
  const idx = avatar?.type === 'initials' ? Number(avatar.value) || 0 : 0;
  const [bg, fg] = INITIALS_COLORS[idx % INITIALS_COLORS.length];
  return (
    <View style={[round, styles.center, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: size * 0.38, fontWeight: '700', letterSpacing: 0.5 }}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { backgroundColor: '#e5e7eb' },
});
