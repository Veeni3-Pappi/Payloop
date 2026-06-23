// ═══════════════════════════════════════════════════════════
// Brand logos — official MetaMask fox + Polygon mark
// Kept as standalone SVGs because lucide-react carries no brand
// (trademarked) logos. Sized via the `size` prop.
// ═══════════════════════════════════════════════════════════

interface BrandIconProps {
  size?: number;
  className?: string;
}

/** Official MetaMask fox logo. */
export function MetaMaskLogo({ size = 20, className }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 318.6 318.6"
      className={className}
      aria-hidden="true"
    >
      <polygon
        fill="#E2761B"
        stroke="#E2761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="274.1,35.5 174.6,109.4 193,65.8"
      />
      <g fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="44.4,35.5 143.1,110.1 125.6,65.8" />
        <polygon points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" />
        <polygon points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" />
        <polygon points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1" />
        <polygon points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1" />
        <polygon points="106.8,247.4 140.6,230.9 111.4,208.1" />
        <polygon points="177.9,230.9 211.8,247.4 207.1,208.1" />
      </g>
      <g fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3" />
        <polygon points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9" />
      </g>
      <polygon
        fill="#233447"
        stroke="#233447"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="138.8,193.5 110.6,185.2 130.5,176.1"
      />
      <polygon
        fill="#233447"
        stroke="#233447"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="179.7,193.5 188,176.1 208,185.2"
      />
      <g fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="106.8,247.4 111.6,206.8 80.3,207.7" />
        <polygon points="207,206.8 211.8,247.4 238.3,207.7" />
        <polygon points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2" />
        <polygon points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1" />
      </g>
      <g fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="87.8,162.1 111.4,208.1 110.6,185.2" />
        <polygon points="208.1,185.2 207.1,208.1 230.8,162.1" />
        <polygon points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7" />
        <polygon points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5" />
      </g>
      <polygon
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"
      />
      <polygon
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"
      />
      <polygon
        fill="#C0AD9E"
        stroke="#C0AD9E"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"
      />
      <polygon
        fill="#161616"
        stroke="#161616"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"
      />
      <g fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2" />
        <polygon points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5" />
      </g>
      <polygon
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"
      />
      <polygon
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"
      />
      <polygon
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"
      />
    </svg>
  );
}

/** Polygon (POL) network mark. */
export function PolygonLogo({ size = 20, className }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38.4 33.5"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#8247E5"
        d="M29 10.2c-.7-.4-1.6-.4-2.4 0L21 13.5l-3.9 2.2-5.6 3.3c-.7.4-1.6.4-2.3 0L4.3 16c-.7-.4-1.2-1.2-1.2-2.1V7.5c0-.8.4-1.6 1.2-2.1l4.8-2.8c.7-.4 1.6-.4 2.3 0l4.8 2.8c.7.4 1.2 1.2 1.2 2.1v4.4l3.9-2.3V5.2c0-.8-.4-1.6-1.2-2.1L11.7.1c-.7-.4-1.6-.4-2.3 0L1.2 5C.4 5.4 0 6.2 0 7v9.9c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.3 0l5.6-3.2 3.9-2.3 5.6-3.2c.7-.4 1.6-.4 2.3 0l4.8 2.8c.7.4 1.2 1.2 1.2 2.1v5.6c0 .8-.4 1.6-1.2 2.1l-4.8 2.8c-.7.4-1.6.4-2.3 0l-4.8-2.8c-.7-.4-1.2-1.2-1.2-2.1v-4.4l-3.9 2.3v4.4c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.3 0l8.1-4.7c.7-.4 1.2-1.2 1.2-2.1V17c0-.8-.4-1.6-1.2-2.1L29 10.2z"
      />
    </svg>
  );
}
