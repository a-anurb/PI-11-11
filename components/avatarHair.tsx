import { ReactNode } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';

// =============================================================================
// Cabelos do avatar MonY (camadas: "back" fica atrás da cabeça e do corpo,
// "front" fica por cima da testa). Cada penteado tem volume (degradê),
// mechas (linhas escuras) e brilho (linhas claras).
// Geometria: rosto entre x 58–142, topo da cabeça y≈46, orelhas em y≈104.
// =============================================================================

export type HairLayers = { back?: ReactNode; front?: ReactNode };

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const dark = (c: string, t: number) => mix(c, '#000000', t);
const light = (c: string, t: number) => mix(c, '#ffffff', t);

/** espelha um desenho do lado esquerdo para o direito */
const Mirror = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <G transform="matrix(-1 0 0 1 200 0)">{children}</G>
  </>
);

function lines(ds: string[], color: string, w = 1.3, op = 0.5) {
  return ds.map((d, i) => <Path key={i} d={d} stroke={color} strokeWidth={w} fill="none" opacity={op} strokeLinecap="round" />);
}

/** um cacho: bolinha com sombra e brilho */
function curl(x: number, y: number, r: number, fill: string, base: string, k: string) {
  return (
    <G key={k}>
      <Circle cx={x} cy={y} r={r} fill={fill} />
      <Path d={`M${x - r * 0.62} ${y + r * 0.1} A ${r * 0.66} ${r * 0.66} 0 0 1 ${x + r * 0.35} ${y - r * 0.58}`} stroke={light(base, 0.32)} strokeWidth={r * 0.22} fill="none" opacity={0.55} strokeLinecap="round" />
      <Path d={`M${x + r * 0.2} ${y + r * 0.75} A ${r * 0.8} ${r * 0.8} 0 0 0 ${x + r * 0.8} ${y + r * 0.1}`} stroke={dark(base, 0.35)} strokeWidth={r * 0.18} fill="none" opacity={0.5} strokeLinecap="round" />
    </G>
  );
}
function curlArc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number, r: number, fill: string, base: string, k: string) {
  return Array.from({ length: n }).map((_, i) => {
    const a = ((from + ((to - from) * i) / Math.max(1, n - 1)) * Math.PI) / 180;
    return curl(cx + rx * Math.cos(a), cy + ry * Math.sin(a), r + ((i * 7) % 3) * 0.6, fill, base, `${k}${i}`);
  });
}

/** trança: corda grossa + gomos claros */
function braid(d: string, fill: string, base: string, w = 6.5, k = '') {
  return (
    <G key={k}>
      <Path d={d} stroke={dark(base, 0.25)} strokeWidth={w + 1.4} fill="none" strokeLinecap="round" />
      <Path d={d} stroke={fill} strokeWidth={w} fill="none" strokeLinecap="round" />
      <Path d={d} stroke={light(base, 0.3)} strokeWidth={w * 0.7} strokeDasharray="2.2 2.6" fill="none" opacity={0.45} />
    </G>
  );
}

// formas reaproveitadas
const TIGHT = 'M57 100 C 54 60 76 38 100 38 C 124 38 146 60 143 100 L140 100 C 138 84 128 70 100 68 C 72 70 62 84 60 100 Z';
const LONG_TOP = 'M56 104 C 50 60 72 32 100 32 C 128 32 150 60 144 104 C 140 86 132 72 118 62 C 108 56 98 52 90 46 C 82 58 70 76 60 104 Z';

export function hairLayers(style: string, fill: string, backFill: string, base: string, hatted: boolean): HairLayers {
  const dk = dark(base, 0.38);
  const hl = light(base, 0.38);
  const pulledBack = lines(['M68 84 Q76 58 96 42', 'M82 72 Q90 54 100 40', 'M118 72 Q110 54 100 40', 'M132 84 Q124 58 104 42'], dk, 1.2, 0.45);

  switch (style) {
    case 'bald':
      return {};

    case 'buzz':
      return {
        front: (
          <G>
            <Path d="M58 102 C 56 64 74 40 100 40 C 126 40 144 64 142 102 L139 102 C 138 90 135 82 130 77 C 120 71 110 70 100 70 C 90 70 80 71 70 77 C 65 82 62 90 61 102 Z" fill={fill} opacity={0.88} />
            <Path d="M64 94 C 64 62 80 46 100 46 C 120 46 136 62 136 94" stroke={dk} strokeWidth={1.5} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.55} />
            <Path d="M70 82 C 72 60 86 52 100 52 C 114 52 128 60 130 82" stroke={dk} strokeWidth={1.5} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.55} />
            {lines(['M82 48 Q100 42 118 48'], hl, 2, 0.35)}
          </G>
        ),
      };

    case 'short':
      return {
        front: (
          <G>
            <Path d="M56 102 C 52 64 70 34 100 33 C 130 34 148 64 144 102 L140 102 C 140 92 138 84 134 79 L127 81 L122 73 L115 80 L109 72 L102 79 L95 72 L89 80 L82 73 L75 81 L66 79 C 62 84 60 92 60 102 Z" fill={fill} />
            {lines(['M75 81 Q74 62 84 50', 'M82 73 Q86 56 96 44', 'M95 72 Q98 56 106 42', 'M109 72 Q112 58 118 46', 'M122 73 Q126 62 128 54', 'M62 96 Q60 80 66 70', 'M138 96 Q140 80 134 70'], dk, 1.3, 0.5)}
            {lines(['M80 48 Q100 36 122 46', 'M90 58 Q100 52 112 56'], hl, 2.2, 0.4)}
          </G>
        ),
      };

    case 'sidepart':
      return {
        front: (
          <G>
            <Path d="M56 104 C 52 64 72 33 104 33 C 134 35 150 64 144 104 L140 104 C 140 90 136 80 128 74 C 114 66 96 66 80 70 C 72 72 66 78 63 86 C 61 92 60 98 60 104 Z" fill={fill} />
            {lines(['M80 38 Q76 54 79 70'], dk, 1.8, 0.7)}
            {lines(['M84 44 Q110 36 134 56', 'M82 54 Q110 46 138 68', 'M84 63 Q108 58 128 72', 'M76 44 Q66 54 62 76'], dk, 1.2, 0.45)}
            {lines(['M92 41 Q114 36 132 50'], hl, 2.4, 0.45)}
          </G>
        ),
      };

    case 'side': {
      const quiff = hatted ? null : (
        <G>
          <Path d="M64 80 C 58 58 72 32 102 30 C 128 28 146 44 142 66 C 134 58 124 57 114 60 C 100 64 84 70 64 80 Z" fill={fill} />
          {lines(['M70 74 C 68 56 82 38 104 34', 'M84 69 C 86 52 100 40 122 37', 'M100 64 C 106 52 118 46 136 50'], dk, 1.3, 0.5)}
          {lines(['M86 40 Q106 32 126 38'], hl, 2.6, 0.45)}
        </G>
      );
      return {
        front: (
          <G>
            <Path d="M57 104 C 54 70 68 44 100 42 C 132 44 146 70 143 104 L139 104 C 138 92 136 84 131 78 C 120 72 110 72 100 72 C 90 72 80 72 69 78 C 64 84 62 92 61 104 Z" fill={fill} />
            <Path d="M60 100 C 60 84 62 76 66 70" stroke={dk} strokeWidth={1.5} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.5} />
            <Path d="M140 100 C 140 84 138 76 134 70" stroke={dk} strokeWidth={1.5} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.5} />
            {quiff}
          </G>
        ),
      };
    }

    case 'spiky':
      if (hatted) return hairLayers('short', fill, backFill, base, hatted);
      return {
        front: (
          <G>
            <Path d="M57 100 L52 64 L68 72 L64 40 L82 58 L88 26 L100 52 L112 26 L118 58 L136 40 L132 72 L148 64 L143 100 C 138 82 122 70 100 70 C 78 70 62 82 57 100 Z" fill={fill} />
            {lines(['M66 46 L78 64', 'M88 32 L96 54', 'M112 32 L105 54', 'M134 46 L122 64'], hl, 2, 0.45)}
            {lines(['M60 70 L70 78', 'M140 70 L130 78'], dk, 1.3, 0.5)}
          </G>
        ),
      };

    case 'curly':
      return {
        front: (
          <G>
            <Path d="M56 100 C 52 62 72 36 100 36 C 128 36 148 62 144 100 L140 100 C 138 88 132 80 124 76 C 112 72 88 72 76 76 C 68 80 62 88 60 100 Z" fill={fill} />
            {curlArc(100, 62, 26, 24, 200, 340, 6, 9, fill, base, 'c3')}
            {curlArc(100, 76, 40, 32, 185, 355, 10, 9, fill, base, 'c2')}
            {curlArc(100, 94, 38, 24, 192, 348, 9, 8, fill, base, 'c1')}
          </G>
        ),
      };

    case 'twists': {
      const xs = [64, 136, 72, 128, 80, 120, 88, 112, 96, 104];
      return {
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {xs.map((x) => {
              const off = Math.abs(x - 100);
              const top = 34 + (off * off) / 70;
              const bottom = 74 + off * 0.42;
              return (
                <G key={x}>
                  <Path d={`M${x} ${top} Q${x + (x < 100 ? -3 : 3)} ${(top + bottom) / 2} ${x + (x < 100 ? -2 : 2)} ${bottom}`} stroke={dk} strokeWidth={8} strokeLinecap="round" fill="none" />
                  <Path d={`M${x} ${top} Q${x + (x < 100 ? -3 : 3)} ${(top + bottom) / 2} ${x + (x < 100 ? -2 : 2)} ${bottom}`} stroke={fill} strokeWidth={6.6} strokeLinecap="round" fill="none" />
                  <Path d={`M${x} ${top} Q${x + (x < 100 ? -3 : 3)} ${(top + bottom) / 2} ${x + (x < 100 ? -2 : 2)} ${bottom}`} stroke={hl} strokeWidth={5} strokeDasharray="1.6 3" fill="none" opacity={0.4} />
                </G>
              );
            })}
          </G>
        ),
      };
    }

    case 'afro': {
      const dots = [[70, 40], [90, 30], [118, 34], [136, 48], [60, 64], [148, 70], [80, 52], [122, 52], [100, 44], [54, 90], [150, 94]];
      return {
        back: (
          <G>
            <Ellipse cx={100} cy={76} rx={56} ry={50} fill={backFill} />
            {curlArc(100, 78, 54, 48, 0, 345, 24, 13, backFill, base, 'ab')}
            {curlArc(100, 46, 30, 14, 200, 340, 6, 11, backFill, base, 'am')}
            {dots.map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={2.2} fill={dk} opacity={0.35} />
            ))}
          </G>
        ),
        front: (
          <G>
            <Path d="M58 102 C 54 70 70 40 100 38 C 130 40 146 70 142 102 L139 102 C 136 86 126 74 100 72 C 74 74 64 86 61 102 Z" fill={backFill} />
            {curlArc(100, 52, 38, 14, 195, 345, 8, 10, backFill, base, 'af')}
          </G>
        ),
      };
    }

    case 'pixie':
      return {
        front: (
          <G>
            <Path d="M56 104 C 52 64 72 33 102 33 C 132 35 148 62 144 100 L141 100 C 140 88 136 80 130 74 C 116 76 96 84 76 92 C 68 96 62 100 60 106 Z" fill={fill} />
            <Path d="M128 74 C 110 74 90 84 70 96 C 64 100 60 104 58 110 C 58 100 60 92 66 86 C 84 74 106 66 128 74 Z" fill={light(base, 0.08)} />
            {lines(['M120 42 Q96 58 72 88', 'M134 54 Q110 70 84 88', 'M108 38 Q84 50 64 82', 'M140 86 Q136 70 126 60'], dk, 1.2, 0.5)}
            {lines(['M90 42 Q110 36 128 46'], hl, 2.4, 0.45)}
          </G>
        ),
      };

    case 'manbun':
      return {
        back: hatted ? undefined : (
          <G>
            <Ellipse cx={100} cy={34} rx={13} ry={11} fill={fill} />
            {lines(['M90 34 Q100 26 110 34', 'M92 38 Q100 32 108 38'], dk, 1.1, 0.5)}
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {pulledBack}
            {lines(['M78 50 Q100 40 122 50'], hl, 2.2, 0.4)}
          </G>
        ),
      };

    case 'long':
      return {
        back: <Path d="M54 100 C 46 54 72 30 100 30 C 128 30 154 54 146 100 C 148 130 150 162 154 194 L46 194 C 50 162 52 130 54 100 Z" fill={backFill} />,
        front: (
          <G>
            <Path d={LONG_TOP} fill={fill} />
            <Path d="M60 92 C 56 120 56 152 52 186 Q61 193 71 186 C 68 160 66 132 66 106 C 66 90 72 78 84 64 C 72 70 64 80 60 92 Z" fill={fill} />
            <Path d="M140 92 C 144 120 146 152 148 186 Q139 193 129 186 C 132 160 134 132 134 106 C 134 88 128 76 114 62 C 128 70 136 80 140 92 Z" fill={fill} />
            {lines(['M90 44 Q72 52 62 82', 'M90 44 Q114 48 134 74', 'M96 50 Q116 58 130 82', 'M58 112 Q56 150 56 182', 'M63 106 Q61 150 63 184', 'M142 112 Q144 150 144 182', 'M137 106 Q139 150 137 184'], dk, 1.2, 0.45)}
            {lines(['M72 52 Q86 40 104 38', 'M140 120 Q142 140 141 156'], hl, 2.4, 0.4)}
          </G>
        ),
      };

    case 'wavy':
      return {
        back: <Path d="M54 100 C 44 56 72 30 100 30 C 128 30 156 56 146 100 C 158 120 144 140 156 160 C 164 176 152 188 156 196 L44 196 C 48 188 36 176 44 160 C 56 140 42 120 54 100 Z" fill={backFill} />,
        front: (
          <G>
            <Path d={LONG_TOP} fill={fill} />
            <Mirror>
              <Path d="M60 92 C 52 110 64 124 56 140 C 50 154 60 168 54 186 Q64 193 72 184 C 66 168 74 156 68 140 C 64 128 70 116 66 104 C 66 90 72 78 84 64 C 72 70 64 80 60 92 Z" fill={fill} />
              {lines(['M60 106 C 56 120 64 134 58 150 C 54 162 60 172 58 182'], dk, 1.2, 0.5)}
              {lines(['M64 120 C 66 128 62 136 62 142'], hl, 2.2, 0.4)}
            </Mirror>
            {lines(['M90 44 Q72 52 62 82', 'M90 44 Q114 48 134 74'], dk, 1.2, 0.45)}
            {lines(['M72 52 Q86 40 104 38'], hl, 2.4, 0.4)}
          </G>
        ),
      };

    case 'longCurly': {
      const side = (sx: number) =>
        [92, 106, 120, 134, 148, 162, 176].map((y, i) => curl(sx + (i % 2 ? -3 : 3) - (y - 92) * 0.04, y, 9.5, fill, base, `lc${sx}${y}`));
      return {
        back: (
          <G>
            <Path d="M48 100 C 38 50 72 24 100 24 C 128 24 162 50 152 100 C 162 130 162 170 158 198 L42 198 C 38 170 38 130 48 100 Z" fill={backFill} />
            {[60, 76, 92, 108, 124, 140, 156, 172, 188].map((y, i) => (
              <G key={y}>
                {curl(44 + (i % 2) * 4, y, 11, backFill, base, `bl${y}`)}
                {curl(156 - (i % 2) * 4, y, 11, backFill, base, `br${y}`)}
              </G>
            ))}
            {curlArc(100, 52, 46, 28, 190, 350, 8, 12, backFill, base, 'bt')}
          </G>
        ),
        front: (
          <G>
            <Path d={LONG_TOP} fill={fill} />
            {curlArc(100, 58, 36, 22, 195, 345, 7, 9, fill, base, 'ft')}
            {curlArc(94, 70, 26, 16, 190, 300, 4, 8, fill, base, 'fp')}
            {side(62)}
            {[92, 106, 120, 134, 148, 162, 176].map((y, i) => curl(138 + (i % 2 ? 3 : -3) + (y - 92) * 0.04, y, 9.5, fill, base, `rc${y}`))}
          </G>
        ),
      };
    }

    case 'braids': {
      const backXs = [50, 58, 66, 74, 126, 134, 142, 150];
      return {
        back: (
          <G>
            <Path d="M54 100 C 48 56 74 32 100 32 C 126 32 152 56 146 100 L150 198 L50 198 Z" fill={backFill} />
            {backXs.map((x) => braid(`M${x} 96 C ${x - 1} 130 ${x + 1} 160 ${x} 198`, backFill, base, 6, `bb${x}`))}
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {lines(['M100 38 L100 68', 'M78 44 Q84 58 82 72', 'M122 44 Q116 58 118 72', 'M64 64 Q72 70 74 80', 'M136 64 Q128 70 126 80', 'M70 54 Q100 46 130 54', 'M62 76 Q100 60 138 76'], dk, 1.2, 0.55)}
            {lines(['M84 46 Q100 40 116 46'], hl, 2, 0.35)}
            <Mirror>
              {braid('M62 84 C 56 110 54 150 55 194', fill, base, 6.5, 'f1')}
              {braid('M67 90 C 61 116 60 152 63 196', fill, base, 6.5, 'f2')}
              {braid('M58 80 C 50 104 48 146 47 190', fill, base, 6.5, 'f3')}
              <Circle cx={55} cy={192} r={3} fill="#d4a72c" />
            </Mirror>
          </G>
        ),
      };
    }

    case 'bob':
      return {
        back: <Path d="M52 100 C 44 54 72 32 100 32 C 128 32 156 54 148 100 C 150 120 152 140 148 152 Q140 160 128 156 L72 156 Q60 160 52 152 C 48 140 50 120 52 100 Z" fill={backFill} />,
        front: (
          <G>
            <Path d="M56 104 C 50 60 74 34 100 34 C 126 34 150 60 144 104 C 142 90 138 80 132 74 C 118 72 98 76 80 84 C 70 88 62 96 60 108 Z" fill={fill} />
            <Mirror>
              <Path d="M58 96 C 54 116 53 136 54 150 Q62 160 74 154 C 67 140 64 120 66 102 Z" fill={fill} />
              {lines(['M60 106 Q58 130 62 150'], dk, 1.2, 0.45)}
            </Mirror>
            {lines(['M128 44 Q104 54 80 82', 'M140 60 Q118 66 96 80', 'M110 38 Q88 48 66 80'], dk, 1.2, 0.45)}
            {lines(['M80 46 Q100 36 122 44'], hl, 2.4, 0.42)}
          </G>
        ),
      };

    case 'bun':
      return {
        back: hatted ? undefined : (
          <G>
            <Circle cx={100} cy={28} r={17} fill={fill} />
            {lines(['M88 28 A 12 10 0 1 1 112 26', 'M93 32 A 7 6 0 1 1 108 30'], dk, 1.3, 0.55)}
            {lines(['M90 20 Q100 14 110 20'], hl, 2.2, 0.45)}
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {pulledBack}
            <Ellipse cx={100} cy={42} rx={9} ry={3} fill={dark(base, 0.5)} />
            {lines(['M78 50 Q100 42 122 50'], hl, 2.2, 0.4)}
          </G>
        ),
      };

    case 'ponytail':
      return {
        back: (
          <G>
            <Path d="M122 50 C 160 50 174 88 168 126 C 164 152 172 174 160 198 Q146 204 138 190 C 146 168 136 148 138 124 C 140 98 136 78 118 64 Z" fill={backFill} />
            {lines(['M138 66 C 156 88 158 120 152 150', 'M148 86 C 160 116 156 160 150 188', 'M156 96 C 166 120 164 150 160 176'], dk, 1.2, 0.5)}
            {lines(['M152 100 C 156 116 156 132 154 144'], hl, 2.4, 0.4)}
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {pulledBack}
            <Circle cx={128} cy={56} r={4.5} fill="#db2777" />
            {lines(['M78 50 Q100 42 122 50'], hl, 2.2, 0.4)}
          </G>
        ),
      };

    case 'afropuff':
      return {
        back: hatted ? undefined : (
          <G>
            <Circle cx={100} cy={26} r={24} fill={backFill} />
            {curlArc(100, 26, 22, 20, 0, 340, 14, 9, backFill, base, 'pf')}
            {curlArc(100, 24, 10, 8, 0, 300, 5, 8, fill, base, 'pi')}
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            <Path d="M64 94 C 64 62 80 46 100 46 C 120 46 136 62 136 94" stroke={dk} strokeWidth={1.6} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.5} />
            <Path d="M70 80 C 72 60 86 52 100 52 C 114 52 128 60 130 80" stroke={dk} strokeWidth={1.6} strokeDasharray="0.1 3" strokeLinecap="round" fill="none" opacity={0.5} />
            {!hatted && <Path d="M88 46 Q100 40 112 46 L112 50 Q100 45 88 50 Z" fill="#2f8f57" />}
          </G>
        ),
      };

    case 'pigtails':
      return {
        back: (
          <G>
            <Mirror>
              <Path d="M58 72 C 36 74 30 100 36 124 C 40 140 34 152 38 160 Q46 158 48 146 C 52 126 50 104 62 86 Z" fill={backFill} />
              {lines(['M48 86 C 40 104 42 126 42 146'], dk, 1.2, 0.5)}
            </Mirror>
          </G>
        ),
        front: (
          <G>
            <Path d={TIGHT} fill={fill} />
            {lines(['M100 38 L100 68'], dk, 1.4, 0.6)}
            {lines(['M96 44 Q78 52 66 80', 'M104 44 Q122 52 134 80'], dk, 1.2, 0.45)}
            <Mirror>
              <Circle cx={58} cy={78} r={4.5} fill="#db2777" />
            </Mirror>
          </G>
        ),
      };

    default:
      return hairLayers('short', fill, backFill, base, hatted);
  }
}
