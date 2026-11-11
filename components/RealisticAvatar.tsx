import { ReactNode } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  AvatarConfig,
  BACKGROUNDS,
  decodeConfig,
  HAIR_COLORS,
  mouthOf,
  OUTFIT_COLORS,
  SceneId,
  SKINS,
} from '../lib/avatarCatalog';
import { hairLayers } from './avatarHair';
import { NECK, Outfit, OutfitShowcase } from './avatarOutfit';

// =============================================================================
// MonY — avatar personalizável em estilo semi-realista (SVG em camadas)
// rosto com sombreado, olhos com íris e brilho, nariz e lábios com volume,
// cabelos com reflexo, roupas com dobras, acessórios e cenários de fundo.
// Tudo é vetor: funciona offline e em qualquer tamanho.
// =============================================================================

// ---------------------------------------------------------------- cores
function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const dark = (c: string, t: number) => mix(c, '#000000', t);
const light = (c: string, t: number) => mix(c, '#ffffff', t);

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const GOLD = '#d4a72c';

// ---------------------------------------------------------------- cenários
export function SceneLayer({ scene, id }: { scene: SceneId; id: string }) {
  const g = `${id}_sc`;
  const sky = (a: string, b: string) => (
    <>
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={a} />
          <Stop offset="1" stopColor={b} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={200} height={200} fill={`url(#${g})`} />
    </>
  );
  const pine = (x: number, base: number, h: number, c: string) => (
    <G key={`${x}-${base}`}>
      <Rect x={x - 2} y={base - 8} width={4} height={10} fill="#5b3b22" />
      <Path d={`M${x} ${base - h} L${x + h * 0.32} ${base - h * 0.45} L${x + h * 0.2} ${base - h * 0.45} L${x + h * 0.42} ${base - 6} L${x - h * 0.42} ${base - 6} L${x - h * 0.2} ${base - h * 0.45} L${x - h * 0.32} ${base - h * 0.45} Z`} fill={c} />
    </G>
  );
  switch (scene) {
    case 'forest':
      return (
        <G>
          {sky('#cde8f3', '#eef7ee')}
          <Circle cx={160} cy={38} r={14} fill="#fff4c2" />
          <Path d="M0 130 Q40 104 80 122 Q120 100 160 118 Q184 108 200 116 L200 200 L0 200 Z" fill="#a7d3ad" />
          {[14, 44, 150, 182].map((x, i) => pine(x, 140, 62 + (i % 2) * 14, '#3c8a55'))}
          {[0, 30, 168, 198].map((x, i) => pine(x, 168, 80 - (i % 2) * 12, '#24623b'))}
          <Rect x={0} y={164} width={200} height={36} fill="#3f8a50" />
        </G>
      );
    case 'beach':
      return (
        <G>
          {sky('#7ccbee', '#d8f1fb')}
          <Circle cx={158} cy={40} r={15} fill="#fde68a" />
          <Circle cx={158} cy={40} r={22} fill="#fde68a" opacity={0.25} />
          <Path d="M24 40 q6 -5 12 0 q6 -5 12 0" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.8} />
          <Rect x={0} y={118} width={200} height={50} fill="#2b9cc4" />
          <Path d="M0 130 q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke="#bfe9f7" strokeWidth={2} fill="none" />
          <Path d="M0 146 q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke="#9edcf1" strokeWidth={1.6} fill="none" />
          <Path d="M0 160 Q60 148 120 156 Q170 150 200 156 L200 200 L0 200 Z" fill="#f1d397" />
          <Path d="M22 170 C 22 140 28 110 40 88" stroke="#8b5a2b" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M40 88 Q20 80 6 92 Q24 86 40 90 Z M40 88 Q58 74 74 84 Q56 82 40 90 Z M40 88 Q34 66 18 66 Q34 72 40 90 Z M40 88 Q52 68 66 66 Q50 74 40 90 Z" fill="#2f8f57" stroke="#2f8f57" strokeWidth={4} strokeLinejoin="round" />
        </G>
      );
    case 'city':
      return (
        <G>
          {sky('#ffd7a3', '#c9b8ea')}
          <Circle cx={44} cy={44} r={12} fill="#fff1d6" opacity={0.9} />
          {[
            [0, 92, 30, '#6b7a99'],
            [26, 70, 26, '#55658a'],
            [50, 104, 22, '#7a88a8'],
            [128, 98, 24, '#7a88a8'],
            [150, 66, 28, '#55658a'],
            [176, 86, 26, '#6b7a99'],
          ].map(([x, y, w, c]) => (
            <G key={String(x)}>
              <Rect x={x as number} y={y as number} width={w as number} height={200} fill={c as string} />
              {Array.from({ length: 6 }).map((_, r) =>
                [0, 1].map((col) => (
                  <Rect
                    key={`${r}-${col}`}
                    x={(x as number) + 5 + col * ((w as number) / 2 - 2)}
                    y={(y as number) + 8 + r * 14}
                    width={6}
                    height={7}
                    fill={(r + col + (x as number)) % 3 === 0 ? '#fde68a' : '#c7d0e6'}
                    opacity={0.9}
                  />
                ))
              )}
            </G>
          ))}
          <Rect x={0} y={180} width={200} height={20} fill="#3b4663" />
        </G>
      );
    case 'desert':
      return (
        <G>
          {sky('#ffe6ad', '#f8c27c')}
          <Circle cx={150} cy={50} r={20} fill="#fff3cf" />
          <Path d="M0 140 Q50 112 110 136 Q160 120 200 132 L200 200 L0 200 Z" fill="#e9b463" />
          <Path d="M0 166 Q70 142 140 164 Q176 156 200 162 L200 200 L0 200 Z" fill="#d99a45" />
          <Path d="M28 160 L28 112 Q28 104 34 104 Q40 104 40 112 L40 160 Z M28 136 L20 136 Q14 136 14 128 L14 118 Q14 112 19 112 Q24 112 24 118 L24 130 L28 130 Z M40 128 L46 128 L46 116 Q46 110 51 110 Q56 110 56 116 L56 126 Q56 134 48 134 L40 134 Z" fill="#3f8f57" />
        </G>
      );
    case 'mountains':
      return (
        <G>
          {sky('#b9e0f5', '#eef8fc')}
          <Path d="M-10 150 L50 70 L90 120 L130 60 L210 150 Z" fill="#6f93ad" />
          <Path d="M50 70 L62 86 L54 84 L46 90 L40 84 Z M130 60 L144 78 L134 76 L126 84 L118 76 Z" fill="#ffffff" />
          <Path d="M-10 170 L40 118 L80 150 L120 112 L170 150 L210 128 L210 200 L-10 200 Z" fill="#4e7389" />
          <Path d="M0 176 Q60 160 120 172 Q170 164 200 170 L200 200 L0 200 Z" fill="#7fb77e" />
        </G>
      );
    case 'space':
      return (
        <G>
          {sky('#0b1030', '#2a1f5c')}
          {[
            [18, 22], [40, 60], [70, 18], [120, 30], [180, 24], [190, 90], [12, 120], [30, 160], [176, 150], [96, 12], [150, 100], [60, 96],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#ffffff" opacity={i % 2 ? 0.7 : 1} />
          ))}
          <Circle cx={156} cy={52} r={18} fill="#f59e0b" />
          <Path d="M146 46 Q156 42 168 48" stroke="#fbbf24" strokeWidth={3} fill="none" />
          <Ellipse cx={156} cy={54} rx={30} ry={7} stroke="#fde68a" strokeWidth={2.4} fill="none" transform="rotate(-14 156 54)" />
          <Circle cx={36} cy={44} r={9} fill="#cbd5e1" />
          <Circle cx={33} cy={41} r={2.2} fill="#94a3b8" />
          <Circle cx={39} cy={47} r={1.6} fill="#94a3b8" />
        </G>
      );
    case 'sunset':
    default:
      return (
        <G>
          {sky('#ff9a8b', '#ffd59e')}
          <Circle cx={100} cy={126} r={40} fill="#fff0b8" opacity={0.95} />
          <Path d="M0 140 Q60 112 120 136 Q170 118 200 128 L200 200 L0 200 Z" fill="#c45c7f" />
          <Path d="M0 168 Q80 140 150 162 Q180 156 200 160 L200 200 L0 200 Z" fill="#8a3a6b" />
        </G>
      );
  }
}

/** Miniatura de um cenário (para as opções de fundo) */
export function SceneThumb({ scene, width, height }: { scene: SceneId; width: number; height: number }) {
  const id = `st_${scene}`;
  return (
    <Svg width={width} height={height} viewBox="20 40 160 120" preserveAspectRatio="xMidYMid slice">
      <SceneLayer scene={scene} id={id} />
    </Svg>
  );
}

// ---------------------------------------------------------------- acessórios
function Glasses({ kind }: { kind: string }) {
  if (kind === 'none') return null;
  const frame = kind === 'sun' ? '#111827' : '#2b2b2b';
  const lensFill = kind === 'sun' ? '#1f2937' : '#ffffff';
  const lensOp = kind === 'sun' ? 0.88 : 0.12;
  const lens = (cx: number) =>
    kind === 'round' ? (
      <Circle cx={cx} cy={101} r={12} stroke={frame} strokeWidth={2.4} fill={lensFill} fillOpacity={lensOp} />
    ) : (
      <Rect x={cx - 13} y={91} width={26} height={19} rx={kind === 'sun' ? 8 : 4} stroke={frame} strokeWidth={2.6} fill={lensFill} fillOpacity={lensOp} />
    );
  return (
    <G>
      {lens(82)}
      {lens(118)}
      <Path d="M94 99 Q100 95 106 99" stroke={frame} strokeWidth={2.2} fill="none" />
      <Line x1={69} y1={98} x2={59} y2={96} stroke={frame} strokeWidth={2.2} />
      <Line x1={131} y1={98} x2={141} y2={96} stroke={frame} strokeWidth={2.2} />
      {kind === 'sun' && (
        <>
          <Path d="M74 95 L80 95 L74 103 Z" fill="#ffffff" opacity={0.35} />
          <Path d="M110 95 L116 95 L110 103 Z" fill="#ffffff" opacity={0.35} />
        </>
      )}
    </G>
  );
}

function Headwear({ kind }: { kind: string }) {
  switch (kind) {
    case 'cap':
    case 'capMony': {
      const c = kind === 'cap' ? '#e04848' : '#1f6b3f';
      return (
        <G>
          <Path d="M56 86 C 56 52 76 36 100 36 C 124 36 144 52 144 86 Q100 74 56 86 Z" fill={c} />
          <Path d="M72 46 Q100 36 128 46" stroke={light(c, 0.25)} strokeWidth={3} fill="none" opacity={0.6} />
          <Path d="M100 36 L100 80" stroke={dark(c, 0.2)} strokeWidth={1.2} />
          <Circle cx={100} cy={37} r={3.5} fill={dark(c, 0.2)} />
          <Path d="M56 86 Q100 74 150 84 Q162 90 148 96 Q100 86 56 94 Z" fill={dark(c, 0.22)} />
          {kind === 'capMony' && (
            <G>
              <Circle cx={100} cy={62} r={8} fill="#ffffff" />
              <Path d="M95 66 L95 58 L100 63 L105 58 L105 66" stroke="#1f6b3f" strokeWidth={2} fill="none" strokeLinejoin="round" />
            </G>
          )}
        </G>
      );
    }
    case 'beanie':
      return (
        <G>
          <Circle cx={100} cy={30} r={9} fill="#e2e8f0" />
          <Path d="M56 86 C 54 50 76 34 100 34 C 124 34 146 50 144 86 Z" fill="#2b7088" />
          {[70, 82, 94, 106, 118, 130].map((x) => (
            <Path key={x} d={`M${x} 46 Q${x + 2} 60 ${x} 74`} stroke={dark('#2b7088', 0.2)} strokeWidth={1.4} fill="none" opacity={0.6} />
          ))}
          <Rect x={54} y={74} width={92} height={16} rx={7} fill={dark('#2b7088', 0.15)} />
          {[62, 72, 82, 92, 102, 112, 122, 132].map((x) => (
            <Line key={x} x1={x} y1={76} x2={x} y2={88} stroke={dark('#2b7088', 0.32)} strokeWidth={1.2} />
          ))}
        </G>
      );
    case 'fedora':
      return (
        <G>
          <Ellipse cx={100} cy={78} rx={60} ry={11} fill="#4b3a2b" />
          <Path d="M66 78 C 64 46 80 34 100 38 C 120 34 136 46 134 78 Z" fill="#6b5340" />
          <Path d="M88 40 Q100 48 112 40" stroke="#4b3a2b" strokeWidth={2} fill="none" />
          <Path d="M66 66 L134 66 L134 76 L66 76 Z" fill="#2a211a" />
        </G>
      );
    case 'headphones':
    case 'goldPhones': {
      const c = kind === 'headphones' ? '#1f2430' : GOLD;
      return (
        <G>
          <Path d="M54 102 C 50 44 150 44 146 102" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M54 102 C 50 44 150 44 146 102" stroke={light(c, 0.3)} strokeWidth={2} fill="none" opacity={0.5} />
          <Rect x={44} y={90} width={18} height={30} rx={8} fill={c} />
          <Rect x={138} y={90} width={18} height={30} rx={8} fill={c} />
          <Rect x={57} y={94} width={6} height={22} rx={3} fill={dark(c, 0.3)} />
          <Rect x={137} y={94} width={6} height={22} rx={3} fill={dark(c, 0.3)} />
        </G>
      );
    }
    default:
      return null;
  }
}

function Earrings({ kind }: { kind: string }) {
  if (kind === '0') return null;
  const at = [57, 143];
  return (
    <G>
      {at.map((x) =>
        kind === '1' ? (
          <Circle key={x} cx={x} cy={113} r={2.6} fill={GOLD} />
        ) : kind === 'hoops' ? (
          <Circle key={x} cx={x} cy={118} r={5.5} stroke={GOLD} strokeWidth={1.8} fill="none" />
        ) : (
          <G key={x}>
            <Line x1={x} y1={112} x2={x} y2={118} stroke={GOLD} strokeWidth={1.2} />
            <Path d={`M${x} 117 Q${x + 4} 123 ${x} 127 Q${x - 4} 123 ${x} 117 Z`} fill="#2f8f57" stroke={GOLD} strokeWidth={0.8} />
          </G>
        )
      )}
    </G>
  );
}

function Necklace({ kind }: { kind: string }) {
  if (kind === 'none') return null;
  return (
    <G>
      <Path d="M84 164 Q100 186 116 164" stroke={GOLD} strokeWidth={1.8} fill="none" />
      <Path d="M84 164 Q100 186 116 164" stroke="#fff3c4" strokeWidth={0.6} fill="none" strokeDasharray="2 2" />
      {kind === 'pendant' && (
        <G>
          <Circle cx={100} cy={181} r={4.6} fill={GOLD} />
          <Circle cx={100} cy={181} r={2.4} fill="#2f8f57" />
        </G>
      )}
    </G>
  );
}

// ---------------------------------------------------------------- rosto
const FACE = {
  m: 'M100 46 C 128 46 142 66 142 96 C 142 118 136 134 125 145 C 116 153 108 157 100 157 C 92 157 84 153 75 145 C 64 134 58 118 58 96 C 58 66 72 46 100 46 Z',
  f: 'M100 47 C 127 47 141 66 141 96 C 141 116 134 131 123 142 C 114 151 107 155 100 155 C 93 155 86 151 77 142 C 66 131 59 116 59 96 C 59 66 73 47 100 47 Z',
};

function Eye({ cx, gid, skin, fem, side }: { cx: number; gid: string; skin: string; fem: boolean; side: 'l' | 'r' }) {
  const cid = `${gid}_eye${side}`;
  const d = side === 'l' ? -1 : 1; // direção do canto de fora
  const o = cx + d * 11.5; // canto de fora
  const i = cx - d * 10.5; // canto de dentro
  const white = `M${i} 101.5 Q${cx - d * 2} 91 ${o} 99.5 Q${cx + d * 2} 108.5 ${i} 101.5 Z`;
  const lineCol = dark(skin, 0.68);
  return (
    <G>
      <Defs>
        <ClipPath id={cid}>
          <Path d={white} />
        </ClipPath>
      </Defs>
      <Path d={`M${i + d * 1} 95 Q${cx} 88.5 ${o - d * 0.5} 93.5`} stroke={dark(skin, 0.3)} strokeWidth={1.1} fill="none" opacity={0.5} />
      <Path d={white} fill="#fbf8f4" />
      <G clipPath={`url(#${cid})`}>
        <Circle cx={cx} cy={100.6} r={6.3} fill={`url(#${gid}_iris)`} />
        <Circle cx={cx} cy={100.6} r={6.3} stroke="#1a100a" strokeWidth={0.7} fill="none" opacity={0.7} />
        <Circle cx={cx} cy={100.6} r={2.8} fill="#120a06" />
        <Circle cx={cx + 2} cy={98.4} r={1.8} fill="#ffffff" />
        <Circle cx={cx - 2.2} cy={103} r={0.8} fill="#ffffff" opacity={0.8} />
        <Path d={`M${i} 97 Q${cx} 91 ${o} 96 L${o} 94 L${i} 94 Z`} fill={dark(skin, 0.4)} opacity={0.22} />
      </G>
      <Path d={`M${i - d * 0.5} 101.5 Q${cx - d * 2} 90.2 ${o + d * 0.6} 99.4`} stroke={lineCol} strokeWidth={fem ? 2.6 : 2} fill="none" strokeLinecap="round" />
      <Path d={`M${i + d * 1.5} 103.5 Q${cx + d * 2} 108 ${o - d * 1.5} 101.5`} stroke={dark(skin, 0.3)} strokeWidth={0.8} fill="none" opacity={0.5} />
      {fem && (
        <Path
          d={`M${o} 99.4 l${d * 3.2} -2.4 M${o - d * 2.6} 96.4 l${d * 2.6} -3 M${o - d * 5.6} 94.4 l${d * 1.6} -3`}
          stroke={lineCol}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      )}
    </G>
  );
}

function Brow({ side, fem, color }: { side: 'l' | 'r'; fem: boolean; color: string }) {
  const d = fem ? 'M70 90.5 C 74 85 84 82.5 94 86.5 L93.6 88.4 C 85 85.6 76 87.2 71 92 Z' : 'M69 90 C 73 85 84 82.5 94.5 85.5 L94 89.6 C 85 87.4 76 88.4 70 92.6 Z';
  return (
    <G transform={side === 'r' ? 'matrix(-1 0 0 1 200 0)' : undefined}>
      <Path d={d} fill={color} />
      <Path d="M74 88 L77 85.8 M79 87 L82 84.8 M84 86.4 L87 84.6" stroke={color} strokeWidth={0.9} opacity={0.6} strokeLinecap="round" />
    </G>
  );
}

function Mouth({ kind, skin, fem }: { kind: 'smile' | 'grin'; skin: string; fem: boolean }) {
  const lip = mix(skin, fem ? '#b8434e' : '#a8403b', fem ? 0.45 : 0.36);
  const lipDark = dark(lip, 0.16);
  if (kind === 'grin') {
    return (
      <G>
        <Path d="M85 130 Q100 134.5 115 130 Q111 145.5 100 146 Q89 145.5 85 130 Z" fill="#4a1717" />
        <Path d="M87 131 Q100 135.6 113 131 L112.2 134.8 Q100 138.4 87.8 134.8 Z" fill="#fbfbfa" />
        <Ellipse cx={100} cy={142.2} rx={7.4} ry={2.8} fill="#d6646a" />
        <Path d="M85 130 Q100 134.5 115 130 Q111 145.5 100 146 Q89 145.5 85 130 Z" stroke={lip} strokeWidth={fem ? 2.8 : 2.2} fill="none" strokeLinejoin="round" />
        <Path d="M84 128.6 Q83 131 84.6 132 M116 128.6 Q117 131 115.4 132" stroke={dark(skin, 0.3)} strokeWidth={1} fill="none" opacity={0.5} />
      </G>
    );
  }
  const low = fem ? 141.5 : 139.5;
  return (
    <G>
      <Path d="M86 131 Q91 128 96 128.6 Q98.5 127.4 100 129 Q101.5 127.4 104 128.6 Q109 128 114 131 Q100 133.6 86 131 Z" fill={lipDark} />
      <Path d={`M86 131 Q100 133.6 114 131 Q109 ${low} 100 ${low + 0.5} Q91 ${low} 86 131 Z`} fill={lip} />
      <Path d="M85 130.4 Q100 134.6 115 130.4" stroke={dark(lip, 0.42)} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M85 130.4 Q83.6 129 84 127.6 M115 130.4 Q116.4 129 116 127.6" stroke={dark(skin, 0.3)} strokeWidth={1} fill="none" opacity={0.55} strokeLinecap="round" />
      <Ellipse cx={100} cy={low - 4} rx={5} ry={1.4} fill="#ffffff" opacity={0.28} />
    </G>
  );
}

function FacialHair({ kind, color }: { kind: string; color: string }) {
  const mustache = <Path d="M85 129.5 Q90 122.5 100 125.6 Q110 122.5 115 129.5 Q108 127.6 100 127.8 Q92 127.6 85 129.5 Z" fill={color} />;
  switch (kind) {
    case 'stubble':
      return (
        <Path
          d="M64 118 C 68 142 86 158 100 158 C 114 158 132 142 136 118 C 130 132 118 128 112 126 C 106 124 94 124 88 126 C 82 128 70 132 64 118 Z"
          fill={color}
          opacity={0.26}
        />
      );
    case 'mustache':
      return mustache;
    case 'goatee':
      return (
        <G>
          {mustache}
          <Path d="M91 143 Q100 140.5 109 143 Q108 155 100 157 Q92 155 91 143 Z" fill={color} />
        </G>
      );
    case 'full':
      return (
        <G>
          <Path d="M59 104 C 59 142 82 164 100 164 C 118 164 141 142 141 104 C 136 122 126 130 114 127 C 108 125 92 125 86 127 C 74 130 64 122 59 104 Z" fill={color} />
          <Path d="M70 132 Q76 146 86 152 M130 132 Q124 146 114 152 M92 152 Q100 158 108 152" stroke={light(color, 0.3)} strokeWidth={1.3} fill="none" opacity={0.45} />
          {mustache}
        </G>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------- avatar completo
interface Props {
  /** configuração codificada (ex.: "b-b1.sk-s2...") */
  config: string;
  size: number;
  /** fundo neutro (usado nas miniaturas) */
  plain?: boolean;
}

export function CustomAvatarSvg({ config, size, plain }: Props) {
  const c: AvatarConfig = decodeConfig(config);
  const gid = `ra${hash(config + (plain ? 'p' : ''))}`;
  const skin = (SKINS.find((s) => s.id === c.skin) ?? SKINS[1]).value;
  const hairBase = (HAIR_COLORS.find((h) => h.id === c.hairColor) ?? HAIR_COLORS[1]).value;
  const cloth = (OUTFIT_COLORS.find((o) => o.id === c.outfitColor) ?? OUTFIT_COLORS[0]).value;
  const bg = (BACKGROUNDS.find((b) => b.id === c.bg) ?? BACKGROUNDS[0]).value;
  const fem = c.body === 'f';
  const hatted = ['cap', 'capMony', 'beanie', 'fedora'].includes(c.head);
  const hair = hairLayers(c.hair, `url(#${gid}_hair)`, `url(#${gid}_hairb)`, hairBase, hatted);
  const brow = mix(hairBase, '#24170f', ['hc4', 'hc5', 'hc10'].includes(c.hairColor) ? 0.25 : 0.45);
  const face = fem ? FACE.f : FACE.m;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <ClipPath id={`${gid}_clip`}>
          <Circle cx={100} cy={100} r={100} />
        </ClipPath>
        <ClipPath id={`${gid}_face`}>
          <Path d={face} />
        </ClipPath>
        <LinearGradient id={`${gid}_bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={plain ? '#f1f5f3' : bg.kind === 'scene' ? '#fff' : bg.colors[0]} />
          <Stop offset="1" stopColor={plain ? '#e2ebe6' : bg.kind === 'scene' ? '#fff' : bg.colors[1]} />
        </LinearGradient>
        <RadialGradient id={`${gid}_skin`} cx="0.44" cy="0.38" rx="0.66" ry="0.68" fx="0.44" fy="0.34">
          <Stop offset="0" stopColor={light(skin, 0.16)} />
          <Stop offset="0.55" stopColor={skin} />
          <Stop offset="1" stopColor={dark(skin, 0.16)} />
        </RadialGradient>
        <LinearGradient id={`${gid}_side`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={dark(skin, 0.5)} stopOpacity={0.22} />
          <Stop offset="0.22" stopColor={dark(skin, 0.5)} stopOpacity={0} />
          <Stop offset="0.78" stopColor={dark(skin, 0.5)} stopOpacity={0} />
          <Stop offset="1" stopColor={dark(skin, 0.5)} stopOpacity={0.26} />
        </LinearGradient>
        <LinearGradient id={`${gid}_neck`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={dark(skin, 0.32)} />
          <Stop offset="0.55" stopColor={dark(skin, 0.1)} />
          <Stop offset="1" stopColor={skin} />
        </LinearGradient>
        <LinearGradient id={`${gid}_hair`} x1="60" y1="24" x2="110" y2="200" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={light(hairBase, 0.2)} />
          <Stop offset="0.5" stopColor={hairBase} />
          <Stop offset="1" stopColor={dark(hairBase, 0.22)} />
        </LinearGradient>
        <LinearGradient id={`${gid}_hairb`} x1="0" y1="30" x2="0" y2="200" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={dark(hairBase, 0.08)} />
          <Stop offset="1" stopColor={dark(hairBase, 0.3)} />
        </LinearGradient>
        <LinearGradient id={`${gid}_cloth`} x1="0.2" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={light(cloth, 0.14)} />
          <Stop offset="1" stopColor={dark(cloth, 0.2)} />
        </LinearGradient>
        <RadialGradient id={`${gid}_iris`} cx="0.5" cy="0.5" rx="0.5" ry="0.5" fx="0.5" fy="0.6">
          <Stop offset="0" stopColor="#9a6a3c" />
          <Stop offset="0.65" stopColor="#57351d" />
          <Stop offset="1" stopColor="#2d1a0e" />
        </RadialGradient>
      </Defs>

      <G clipPath={`url(#${gid}_clip)`}>
        {/* fundo */}
        {!plain && bg.kind === 'scene' ? <SceneLayer scene={bg.scene} id={gid} /> : <Rect x={0} y={0} width={200} height={200} fill={`url(#${gid}_bg)`} />}

        {/* personagem um pouco menor, para mostrar o peito e a roupa */}
        <G transform="translate(16 10) scale(0.84)">
        {/* cabelo de trás, gola/capuz de trás */}
        {hair.back}
        <Outfit type={c.outfit} color={cloth} skin={dark(skin, 0.12)} fem={fem} gid={gid} layer="under" />

        {/* pescoço e roupa */}
        <Path d={fem ? NECK.f : NECK.m} fill={`url(#${gid}_neck)`} />
        <Outfit type={c.outfit} color={cloth} skin={dark(skin, 0.12)} fem={fem} gid={gid} layer="over" />
        <Necklace kind={c.necklace} />

        {/* orelhas */}
        {[58, 142].map((x) => (
          <G key={x}>
            <Ellipse cx={x} cy={104} rx={7.5} ry={11.5} fill={dark(skin, 0.06)} />
            <Path d={x < 100 ? 'M60 97 Q53 103 58 112' : 'M140 97 Q147 103 142 112'} stroke={dark(skin, 0.3)} strokeWidth={1.6} fill="none" />
          </G>
        ))}

        {/* cabeça com sombreado */}
        <Path d={face} fill={`url(#${gid}_skin)`} />
        <G clipPath={`url(#${gid}_face)`}>
          <Rect x={56} y={44} width={88} height={116} fill={`url(#${gid}_side)`} />
          <Path d="M66 140 Q100 168 134 140 L134 160 L66 160 Z" fill={dark(skin, 0.3)} opacity={0.12} />
        </G>
        {c.hair === 'bald' && <Ellipse cx={88} cy={60} rx={14} ry={7} fill="#ffffff" opacity={0.18} />}
        <Ellipse cx={77} cy={118} rx={9} ry={5.5} fill="#e5736a" opacity={fem ? 0.22 : 0.1} />
        <Ellipse cx={123} cy={118} rx={9} ry={5.5} fill="#e5736a" opacity={fem ? 0.22 : 0.1} />
        <Ellipse cx={100} cy={72} rx={18} ry={7} fill="#ffffff" opacity={0.1} />
        <Ellipse cx={100} cy={150} rx={7} ry={3} fill="#ffffff" opacity={0.1} />

        {/* barba (por baixo da boca) */}
        <FacialHair kind={c.facial} color={mix(hairBase, '#000000', 0.12)} />

        {/* olhos e sobrancelhas */}
        <Eye cx={82} gid={gid} skin={skin} fem={fem} side="l" />
        <Eye cx={118} gid={gid} skin={skin} fem={fem} side="r" />
        <Brow side="l" fem={fem} color={brow} />
        <Brow side="r" fem={fem} color={brow} />

        {/* nariz */}
        <Path d="M100.5 99 L100.5 114" stroke={light(skin, 0.35)} strokeWidth={2.6} opacity={0.3} strokeLinecap="round" />
        <Path d="M97 103 Q95.4 113 93.6 118.6" stroke={dark(skin, 0.3)} strokeWidth={1.4} fill="none" opacity={0.55} strokeLinecap="round" />
        <Path d="M93 119.6 Q96 123.8 100 123.4 Q104 123.8 107 119.6" stroke={dark(skin, 0.32)} strokeWidth={1.4} fill="none" opacity={0.7} strokeLinecap="round" />
        <Ellipse cx={96} cy={121.4} rx={2} ry={1.2} fill={dark(skin, 0.5)} opacity={0.55} />
        <Ellipse cx={104} cy={121.4} rx={2} ry={1.2} fill={dark(skin, 0.5)} opacity={0.55} />
        <Ellipse cx={100.6} cy={117.4} rx={3} ry={2.1} fill="#ffffff" opacity={0.22} />

        <Mouth kind={mouthOf(c)} skin={skin} fem={fem} />

        {/* cabelo da frente e acessórios */}
        {hair.front}
        <Earrings kind={c.earrings} />
        <Glasses kind={c.glasses} />
        <Headwear kind={c.head} />
        </G>
      </G>
    </Svg>
  );
}

// ---------------------------------------------------------------- ícones das opções
/** Peça de roupa sozinha (vitrine), na cor escolhida */
export function GarmentIcon({ type, color, size }: { type: string; color: string; size: number }) {
  return (
    <Svg width={size * 1.25} height={size * 0.72} viewBox="20 130 160 100">
      <OutfitShowcase type={type} color={color} gid={`gi_${type}_${color.slice(1)}`} />
    </Svg>
  );
}

/** Acessório solto (óculos, chapéus, brincos, colares) */
export function AccessoryIcon({ group, value, size }: { group: 'glasses' | 'head' | 'earrings' | 'necklace'; value: string; size: number }) {
  const none = value === 'none' || value === '0';
  return (
    <Svg width={size} height={size} viewBox={group === 'glasses' ? '52 76 96 50' : group === 'head' ? '38 18 124 104' : group === 'earrings' ? '44 96 112 40' : '70 150 60 46'}>
      {none ? (
        <G>
          <Circle cx={group === 'glasses' ? 100 : group === 'head' ? 100 : group === 'earrings' ? 100 : 100} cy={group === 'glasses' ? 101 : group === 'head' ? 70 : group === 'earrings' ? 116 : 173} r={group === 'head' ? 26 : 13} stroke="#9ca3af" strokeWidth={group === 'head' ? 5 : 2.6} fill="none" />
          <Line
            x1={100 - (group === 'head' ? 18 : 9)}
            y1={(group === 'glasses' ? 101 : group === 'head' ? 70 : group === 'earrings' ? 116 : 173) + (group === 'head' ? 18 : 9)}
            x2={100 + (group === 'head' ? 18 : 9)}
            y2={(group === 'glasses' ? 101 : group === 'head' ? 70 : group === 'earrings' ? 116 : 173) - (group === 'head' ? 18 : 9)}
            stroke="#9ca3af"
            strokeWidth={group === 'head' ? 5 : 2.6}
          />
        </G>
      ) : group === 'glasses' ? (
        <Glasses kind={value} />
      ) : group === 'head' ? (
        <G>
          <Path d="M58 104 C 56 66 76 46 100 46 C 124 46 144 66 142 104 Z" fill="#e5e7eb" />
          <Headwear kind={value} />
        </G>
      ) : group === 'earrings' ? (
        <G transform="translate(0 4) scale(1)">
          <Ellipse cx={57} cy={110} rx={6} ry={10} fill="#f1d3bd" />
          <Ellipse cx={143} cy={110} rx={6} ry={10} fill="#f1d3bd" />
          <Earrings kind={value} />
        </G>
      ) : (
        <G>
          <Path d="M76 150 Q100 200 124 150" fill="#f1d3bd" opacity={0.6} />
          <Necklace kind={value} />
        </G>
      )}
    </Svg>
  );
}
