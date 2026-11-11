import { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// =============================================================================
// Roupas do avatar MonY. Cada peça tem duas camadas:
//  • "under": o que fica atrás do pescoço (capuz, gola de trás)
//  • "over":  o tronco com a peça, desenhado depois do pescoço
// =============================================================================

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
const lum = (c: string) => {
  const [r, g, b] = rgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

export const TORSO = {
  m: 'M22 212 C 24 184 46 168 80 162 Q100 170 120 162 C 154 168 176 184 178 212 L182 260 L18 260 Z',
  f: 'M30 212 C 32 186 52 170 82 164 Q100 172 118 164 C 148 170 168 186 170 212 L174 260 L26 260 Z',
};
export const NECK = {
  m: 'M85 132 L85 168 Q100 178 115 168 L115 132 Z',
  f: 'M87 132 L87 169 Q100 178 113 169 L113 132 Z',
};

interface OutfitProps {
  type: string;
  color: string;
  /** cor da pele (decote, regata) */
  skin: string;
  fem: boolean;
  gid: string;
  layer: 'under' | 'over';
}

export function Outfit({ type, color, skin, fem, gid, layer }: OutfitProps) {
  const L = fem ? 82 : 80; // ponto esquerdo do decote
  const R = 200 - L;
  const Y = fem ? 164 : 162;
  const edge = dark(color, 0.28);
  const isLight = lum(color) > 0.75;
  const contrast = isLight ? '#1f2430' : '#ffffff';
  const torso = fem ? TORSO.f : TORSO.m;
  const cid = `${gid}_torso`;
  const cloth = `url(#${gid}_cloth)`;

  if (layer === 'under') {
    if (type === 'hoodie') {
      return (
        <G>
          <Path d={`M${L - 12} 170 C ${L - 14} 148 ${L + 2} 140 100 142 C ${R - 2} 140 ${R + 14} 148 ${R + 12} 170 Q100 160 ${L - 12} 170 Z`} fill={dark(color, 0.22)} />
          <Path d={`M${L - 6} 166 C ${L - 6} 152 ${L + 6} 146 100 148 C ${R - 6} 146 ${R + 6} 152 ${R + 6} 166`} stroke={dark(color, 0.4)} strokeWidth={1.4} fill="none" opacity={0.6} />
        </G>
      );
    }
    if (type === 'shirt' || type === 'flannel' || type === 'denim' || type === 'jacket') {
      // gola por trás do pescoço
      return <Path d={`M${L + 2} 166 C ${L + 2} 152 ${R - 2} 152 ${R - 2} 166 Z`} fill={type === 'jacket' ? dark(color, 0.3) : dark(color, 0.18)} />;
    }
    return null;
  }

  const fold = (d: string, k: string) => <Path key={k} d={d} stroke={dark(color, 0.25)} strokeWidth={1.4} fill="none" opacity={0.5} strokeLinecap="round" />;
  const folds = [fold(fem ? 'M62 182 Q66 196 64 210' : 'M56 180 Q61 195 58 210', 'a'), fold(fem ? 'M138 182 Q134 196 136 210' : 'M144 180 Q139 195 142 210', 'b')];
  const crew = (w = 4, c = dark(color, 0.2)) => <Path d={`M${L} ${Y} Q100 ${Y + 18} ${R} ${Y}`} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" />;
  const Body = ({ f = cloth }: { f?: string }) => (
    <>
      <Path d={torso} fill={f} />
      {folds}
    </>
  );
  const clipDefs = (
    <Defs>
      <ClipPath id={cid}>
        <Path d={torso} />
      </ClipPath>
    </Defs>
  );
  const innerTee = (c = '#f4f4f2', bottom = 260) => (
    <>
      <Path d={`M${L} ${Y} Q100 ${Y + 10} ${R} ${Y} L${R - 6} ${bottom} L${L + 6} ${bottom} Z`} fill={c} />
      <Path d={`M${L + 2} ${Y + 1} Q100 ${Y + 14} ${R - 2} ${Y + 1}`} stroke={dark(c, 0.12)} strokeWidth={2.4} fill="none" />
    </>
  );

  switch (type) {
    case 'vneck':
      return (
        <G>
          <Body />
          <Path d={`M${L + 2} ${Y} L100 ${Y + 28} L${R - 2} ${Y} Q100 ${Y + 8} ${L + 2} ${Y} Z`} fill={skin} />
          <Path d={`M${L + 2} ${Y} L100 ${Y + 28} L${R - 2} ${Y}`} stroke={dark(color, 0.22)} strokeWidth={3.4} fill="none" strokeLinejoin="round" />
        </G>
      );

    case 'stripes': {
      const stripe = isLight ? '#1e3a5f' : '#f6f6f4';
      return (
        <G>
          {clipDefs}
          <Body />
          <G clipPath={`url(#${cid})`}>
            {[170, 182, 194, 206, 218, 230].map((y) => (
              <Rect key={y} x={0} y={y} width={200} height={5} fill={stripe} opacity={0.85} />
            ))}
          </G>
          {crew()}
        </G>
      );
    }

    case 'tank': {
      const tank = fem
        ? `M64 260 C 64 194 68 178 76 168 L83 166 Q100 188 117 166 L124 168 C 132 178 136 194 136 260 Z`
        : `M60 260 C 60 192 64 176 72 166 L80 164 Q100 186 120 164 L128 166 C 136 176 140 192 140 260 Z`;
      return (
        <G>
          <Path d={torso} fill={skin} />
          <Path d={fem ? 'M44 188 Q52 176 70 172' : 'M38 186 Q46 174 64 170'} stroke={dark(skin, 0.18)} strokeWidth={1.4} fill="none" opacity={0.5} />
          <Path d={fem ? 'M156 188 Q148 176 130 172' : 'M162 186 Q154 174 136 170'} stroke={dark(skin, 0.18)} strokeWidth={1.4} fill="none" opacity={0.5} />
          <Path d={tank} fill={cloth} />
          <Path d={fem ? 'M83 166 Q100 188 117 166' : 'M80 164 Q100 186 120 164'} stroke={dark(color, 0.22)} strokeWidth={3} fill="none" />
        </G>
      );
    }

    case 'hoodie':
      return (
        <G>
          <Body />
          {crew(5, dark(color, 0.25))}
          <Path d="M92 178 L90 200 M108 178 L110 200" stroke={contrast} strokeWidth={2.2} strokeLinecap="round" opacity={0.9} />
          <Rect x={88.4} y={199} width={3.2} height={5} rx={1.4} fill={dark(contrast === '#ffffff' ? '#cccccc' : '#1f2430', 0.1)} />
          <Rect x={108.4} y={199} width={3.2} height={5} rx={1.4} fill={dark(contrast === '#ffffff' ? '#cccccc' : '#1f2430', 0.1)} />
          <Path d="M70 214 Q74 204 84 204 L116 204 Q126 204 130 214" stroke={dark(color, 0.25)} strokeWidth={1.4} fill="none" opacity={0.7} />
        </G>
      );

    case 'shirt':
      return (
        <G>
          <Body />
          <Path d={`M${L + 4} ${Y + 1} L100 ${Y + 18} L${R - 4} ${Y + 1} Q100 ${Y + 6} ${L + 4} ${Y + 1} Z`} fill={skin} />
          <Path d={`M${L - 2} ${Y - 4} L100 ${Y + 16} L90 ${Y + 24} L${L - 8} ${Y + 6} Z`} fill={light(color, 0.1)} stroke={edge} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d={`M${R + 2} ${Y - 4} L100 ${Y + 16} L110 ${Y + 24} L${R + 8} ${Y + 6} Z`} fill={light(color, 0.1)} stroke={edge} strokeWidth={1.1} strokeLinejoin="round" />
          <Line x1={100} y1={Y + 18} x2={100} y2={260} stroke={edge} strokeWidth={1.2} />
          {[Y + 26, Y + 37, Y + 48].map((y) => (
            <Circle key={y} cx={103} cy={y} r={1.6} fill={light(color, 0.5)} stroke={edge} strokeWidth={0.5} />
          ))}
          <Path d="M118 186 L134 186 L134 198 Q126 202 118 198 Z" stroke={edge} strokeWidth={1} fill="none" opacity={0.6} />
        </G>
      );

    case 'sport': {
      const accent = isLight ? '#1f6b3f' : '#ffffff';
      return (
        <G>
          {clipDefs}
          <Body />
          <G clipPath={`url(#${cid})`}>
            <Path d={fem ? 'M30 200 C 40 180 60 170 84 166 L88 172 C 66 176 48 186 40 204 Z' : 'M22 200 C 34 178 56 168 82 164 L86 170 C 62 174 42 186 32 204 Z'} fill={accent} opacity={0.9} />
            <Path d={fem ? 'M170 200 C 160 180 140 170 116 166 L112 172 C 134 176 152 186 160 204 Z' : 'M178 200 C 166 178 144 168 118 164 L114 170 C 138 174 158 186 168 204 Z'} fill={accent} opacity={0.9} />
          </G>
          <Path d={`M${L + 2} ${Y} L100 ${Y + 20} L${R - 2} ${Y} Q100 ${Y + 8} ${L + 2} ${Y} Z`} fill={skin} />
          <Path d={`M${L + 2} ${Y} L100 ${Y + 20} L${R - 2} ${Y}`} stroke={accent} strokeWidth={4} fill="none" strokeLinejoin="round" />
          <Circle cx={124} cy={190} r={5} fill={accent} opacity={0.9} />
          <Path d="M121 190 L124 193 L128 187" stroke={color} strokeWidth={1.6} fill="none" />
        </G>
      );
    }

    case 'sweater':
      return (
        <G>
          <Body />
          {crew(8, light(color, 0.12))}
          <Path d={`M${L} ${Y} Q100 ${Y + 18} ${R} ${Y}`} stroke={dark(color, 0.2)} strokeWidth={8} strokeDasharray="1 2.4" fill="none" opacity={0.6} />
          {[84, 100, 116].map((x) => (
            <Path key={x} d={`M${x} 186 l-4 5 l4 5 l-4 5 l4 5 l-4 5 M${x} 186 l4 5 l-4 5 l4 5 l-4 5 l4 5`} stroke={light(color, 0.2)} strokeWidth={1.3} fill="none" opacity={0.75} />
          ))}
          <Path d="M54 204 Q100 196 146 204" stroke={dark(color, 0.18)} strokeWidth={1} fill="none" opacity={0.4} />
        </G>
      );

    case 'turtleneck':
      return (
        <G>
          <Body />
          <Path d={`M${L + 3} 146 Q100 154 ${R - 3} 146 L${R + 1} ${Y + 4} Q100 ${Y + 16} ${L - 1} ${Y + 4} Z`} fill={cloth} />
          {[-12, -6, 0, 6, 12].map((d) => (
            <Line key={d} x1={100 + d * 1.25} y1={152} x2={100 + d * 1.4} y2={Y + 10} stroke={dark(color, 0.22)} strokeWidth={1.1} opacity={0.6} />
          ))}
          <Path d={`M${L + 3} 146 Q100 154 ${R - 3} 146`} stroke={dark(color, 0.3)} strokeWidth={2} fill="none" />
          <Path d={`M${L + 2} 156 Q100 164 ${R - 2} 156`} stroke={dark(color, 0.22)} strokeWidth={1.6} fill="none" opacity={0.7} />
        </G>
      );

    case 'collar':
      return (
        <G>
          <Body />
          <Path d={`M${L + 2} ${Y} Q100 ${Y + 10} ${R - 2} ${Y}`} stroke={edge} strokeWidth={2} fill="none" />
          <Path d={`M${L} ${Y - 2} L100 ${Y + 12} L92 ${Y + 24} L${L - 6} ${Y + 6} Z`} fill={light(color, 0.1)} stroke={edge} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d={`M${R} ${Y - 2} L100 ${Y + 12} L108 ${Y + 24} L${R + 6} ${Y + 6} Z`} fill={light(color, 0.1)} stroke={edge} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d={`M96 ${Y + 13} L96 ${Y + 38} L104 ${Y + 38} L104 ${Y + 13}`} stroke={edge} strokeWidth={1.1} fill="none" />
          <Circle cx={100} cy={Y + 22} r={1.6} fill="#f8fafc" />
          <Circle cx={100} cy={Y + 31} r={1.6} fill="#f8fafc" />
        </G>
      );

    case 'flannel': {
      const dk = dark(color, 0.4);
      return (
        <G>
          {clipDefs}
          {innerTee()}
          <Path d={torso} fill={cloth} />
          <G clipPath={`url(#${cid})`}>
            {[30, 54, 78, 102, 126, 150, 174].map((x) => (
              <Rect key={`v${x}`} x={x} y={150} width={9} height={110} fill={dk} opacity={0.32} />
            ))}
            {[168, 186, 204, 222].map((y) => (
              <Rect key={`h${y}`} x={0} y={y} width={200} height={8} fill={dk} opacity={0.32} />
            ))}
            {[42, 90, 138].map((x) => (
              <Line key={`l${x}`} x1={x} y1={150} x2={x} y2={260} stroke="#ffffff" strokeWidth={0.9} opacity={0.35} />
            ))}
            <Line x1={0} y1={198} x2={200} y2={198} stroke="#ffffff" strokeWidth={0.9} opacity={0.35} />
          </G>
          {/* camisa aberta sobre camiseta branca */}
          <Path d={`M${L} ${Y} Q100 ${Y + 10} ${R} ${Y} L${R - 8} 260 L${L + 8} 260 Z`} fill="#f4f4f2" />
          <Path d={`M${L + 2} ${Y + 1} Q100 ${Y + 14} ${R - 2} ${Y + 1}`} stroke="#d9d9d6" strokeWidth={2.4} fill="none" />
          <Path d={`M${L - 2} ${Y - 4} L${L + 12} ${Y + 24} L${L + 8} 260`} stroke={edge} strokeWidth={1.2} fill="none" />
          <Path d={`M${R + 2} ${Y - 4} L${R - 12} ${Y + 24} L${R - 8} 260`} stroke={edge} strokeWidth={1.2} fill="none" />
          <Path d={`M${L - 2} ${Y - 4} L${L + 12} ${Y + 24} L${L} ${Y + 18} L${L - 10} ${Y + 4} Z`} fill={light(color, 0.06)} stroke={edge} strokeWidth={1} />
          <Path d={`M${R + 2} ${Y - 4} L${R - 12} ${Y + 24} L${R} ${Y + 18} L${R + 10} ${Y + 4} Z`} fill={light(color, 0.06)} stroke={edge} strokeWidth={1} />
          {[Y + 32, Y + 44].map((y) => (
            <Circle key={y} cx={R - 13} cy={y} r={1.5} fill="#f8fafc" />
          ))}
        </G>
      );
    }

    case 'cardigan':
      return (
        <G>
          <Body />
          {innerTee(isLight ? '#3b4a5e' : '#f4f4f2')}
          <Path d={`M${L} ${Y} L${L + 12} 260`} stroke={dark(color, 0.3)} strokeWidth={4} />
          <Path d={`M${R} ${Y} L${R - 12} 260`} stroke={dark(color, 0.3)} strokeWidth={4} />
          <Path d={`M${L} ${Y} L${L + 12} 260`} stroke={light(color, 0.14)} strokeWidth={2.4} />
          <Path d={`M${R} ${Y} L${R - 12} 260`} stroke={light(color, 0.14)} strokeWidth={2.4} />
          {[Y + 16, Y + 30, Y + 44].map((y) => (
            <Circle key={y} cx={L + 2 + (y - Y) * 0.24 - 4} cy={y} r={2} fill={dark(color, 0.4)} stroke={light(color, 0.3)} strokeWidth={0.6} />
          ))}
          <Path d="M50 204 Q100 196 150 204" stroke={dark(color, 0.18)} strokeWidth={1} fill="none" opacity={0.4} />
        </G>
      );

    case 'jacket':
      return (
        <G>
          <Body />
          {innerTee()}
          <Path d={`M${L} ${Y - 2} L${L + 14} 260 L${L + 4} 260 L${L - 10} ${Y + 12} Z`} fill={dark(color, 0.14)} />
          <Path d={`M${R} ${Y - 2} L${R - 14} 260 L${R - 4} 260 L${R + 10} ${Y + 12} Z`} fill={dark(color, 0.14)} />
          <Path d={`M${L} ${Y - 2} L${L + 14} 260 M${R} ${Y - 2} L${R - 14} 260`} stroke={dark(color, 0.4)} strokeWidth={1.3} />
          <Rect x={fem ? 134 : 138} y={188} width={16} height={3} rx={1.5} fill={dark(color, 0.35)} />
          <Line x1={R - 13} y1={Y + 14} x2={R - 10} y2={260} stroke="#c7c9cc" strokeWidth={1.4} strokeDasharray="1.4 1.4" />
        </G>
      );

    case 'denim': {
      const stitch = light(color, 0.45);
      return (
        <G>
          <Body />
          {innerTee()}
          <Path d={`M${L} ${Y - 2} L${L + 12} 260 L${L} 260 L${L - 12} ${Y + 10} Z`} fill={dark(color, 0.1)} />
          <Path d={`M${R} ${Y - 2} L${R - 12} 260 L${R} 260 L${R + 12} ${Y + 10} Z`} fill={dark(color, 0.1)} />
          <Path d={`M${L} ${Y - 2} L${L + 12} 260 M${R} ${Y - 2} L${R - 12} 260`} stroke={stitch} strokeWidth={0.9} strokeDasharray="2 1.6" fill="none" />
          {[fem ? 56 : 50, fem ? 124 : 128].map((x) => (
            <G key={x}>
              <Path d={`M${x} 184 L${x + 22} 184 L${x + 22} 194 L${x + 11} 198 L${x} 194 Z`} fill={dark(color, 0.08)} stroke={stitch} strokeWidth={0.9} strokeDasharray="2 1.6" />
              <Circle cx={x + 11} cy={194} r={1.6} fill="#c9a24a" />
            </G>
          ))}
          <Path d="M40 202 Q100 194 160 202" stroke={stitch} strokeWidth={0.9} strokeDasharray="2 1.6" fill="none" />
        </G>
      );
    }

    case 'blazer':
      return (
        <G>
          <Body />
          <Path d={`M${L + 2} ${Y} Q100 ${Y + 8} ${R - 2} ${Y} L106 260 L94 260 Z`} fill="#f6f6f4" />
          <Path d={`M${L + 4} ${Y + 1} L100 ${Y + 18} L${R - 4} ${Y + 1}`} stroke="#d6d6d3" strokeWidth={2} fill="none" />
          <Path d={`M${L} ${Y - 2} L96 ${Y + 46} L${L + 6} ${Y + 28} L${L - 8} ${Y + 18} L${L - 4} ${Y + 8} Z`} fill={dark(color, 0.12)} stroke={dark(color, 0.35)} strokeWidth={1} strokeLinejoin="round" />
          <Path d={`M${R} ${Y - 2} L104 ${Y + 46} L${R - 6} ${Y + 28} L${R + 8} ${Y + 18} L${R + 4} ${Y + 8} Z`} fill={dark(color, 0.12)} stroke={dark(color, 0.35)} strokeWidth={1} strokeLinejoin="round" />
          <Path d={`M96 ${Y + 46} L94 260 M104 ${Y + 46} L106 260`} stroke={dark(color, 0.35)} strokeWidth={1.1} />
          <Circle cx={100} cy={204} r={2.2} fill={dark(color, 0.45)} />
          <Path d={`M${R - 4} 186 L${R + 12} 186`} stroke={dark(color, 0.35)} strokeWidth={1.4} />
        </G>
      );

    case 'tee':
    default:
      return (
        <G>
          <Body />
          {crew()}
        </G>
      );
  }
}

/** Peça de roupa sozinha (vitrine), num manequim neutro */
export function OutfitShowcase({ type, color, gid }: { type: string; color: string; gid: string }) {
  const skin = '#e6e1dc';
  return (
    <G>
      <Defs>
        <LinearGradient id={`${gid}_cloth`} x1="0.2" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={light(color, 0.14)} />
          <Stop offset="1" stopColor={dark(color, 0.2)} />
        </LinearGradient>
      </Defs>
      <Outfit type={type} color={color} skin={skin} fem={false} gid={gid} layer="under" />
      <Path d={NECK.m} fill={skin} />
      <Outfit type={type} color={color} skin={skin} fem={false} gid={gid} layer="over" />
    </G>
  );
}
