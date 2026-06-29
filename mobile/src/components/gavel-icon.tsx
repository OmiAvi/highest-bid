import Svg, { G, Rect } from "react-native-svg";

import { Palette } from "@/constants/theme";

interface Props {
  size?: number;
  color?: string;
}

/** The Highest Bid wordmark gavel, ported from the web SVG. */
export function GavelIcon({ size = 24, color = Palette.gold }: Props) {
  return (
    <Svg width={size} height={size} viewBox="-4 -4 36 36">
      <G origin="13, 14" rotation={-32}>
        {/* Gavel head */}
        <Rect x={1} y={6} width={24} height={10} rx={2.5} fill={color} />
        {/* Strike-plate band */}
        <Rect x={1} y={11} width={24} height={2.5} fill="rgba(0,0,0,0.22)" />
        {/* Handle */}
        <Rect x={16} y={16} width={7} height={15} rx={2.5} fill={color} />
        {/* Grip notch */}
        <Rect x={16} y={27} width={7} height={3} rx={1.5} fill="rgba(0,0,0,0.18)" />
      </G>
    </Svg>
  );
}
