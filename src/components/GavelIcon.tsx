interface Props { size?: number; color?: string; glow?: boolean; }

export function GavelIcon({ size = 24, color = "var(--gold)", glow = false }: Props) {
  const id = `gavel-glow-${Math.round(size)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 -4 36 36"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      {glow && (
        <defs>
          <filter id={id} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      )}
      <g transform="rotate(-32, 13, 14)" filter={glow ? `url(#${id})` : undefined}>
        {/* Gavel head */}
        <rect x="1" y="6" width="24" height="10" rx="2.5" fill={color}/>
        {/* Strike-plate band across middle of head */}
        <rect x="1" y="11" width="24" height="2.5" fill="rgba(0,0,0,0.22)"/>
        {/* Handle */}
        <rect x="16" y="16" width="7" height="15" rx="2.5" fill={color}/>
        {/* Grip notch */}
        <rect x="16" y="27" width="7" height="3" rx="1.5" fill="rgba(0,0,0,0.18)"/>
      </g>
    </svg>
  );
}
