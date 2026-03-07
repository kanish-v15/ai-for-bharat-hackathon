export default function Logo({ size = 32, className = '' }) {
  const id = `logo-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Tricolor gradient for heart — saffron top, white mid, green bottom */}
        <linearGradient id={`${id}-heart`} x1="32" y1="10" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="38%" stopColor="#F97316" />
          <stop offset="42%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#FFFFFF" />
          <stop offset="62%" stopColor="#138808" />
          <stop offset="100%" stopColor="#138808" />
        </linearGradient>
        <linearGradient id={`${id}-pulse`} x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#138808" />
          <stop offset="0.5" stopColor="#1a1a2e" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Heart shape — tricolor filled */}
      <path
        d="M32 54 C32 54 8 38 8 22 C8 14 14 8 22 8 C26.5 8 30 10.5 32 14 C34 10.5 37.5 8 42 8 C50 8 56 14 56 22 C56 38 32 54 32 54Z"
        fill={`url(#${id}-heart)`}
        filter={`url(#${id}-shadow)`}
      />

      {/* Heart outline for definition */}
      <path
        d="M32 54 C32 54 8 38 8 22 C8 14 14 8 22 8 C26.5 8 30 10.5 32 14 C34 10.5 37.5 8 42 8 C50 8 56 14 56 22 C56 38 32 54 32 54Z"
        stroke="#c2410c"
        strokeWidth="0.8"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* ECG/Pulse line across the heart */}
      <path
        d="M6 30 L18 30 L22 30 L25 22 L29 38 L33 18 L37 36 L40 30 L44 30 L58 30"
        stroke={`url(#${id}-pulse)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Microphone in center-bottom of heart */}
      {/* Mic body */}
      <rect x="28.5" y="36" width="7" height="11" rx="3.5" fill="#1a1a2e" />
      {/* Mic grille lines */}
      <line x1="30" y1="39" x2="34" y2="39" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="30" y1="41" x2="34" y2="41" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="30" y1="43" x2="34" y2="43" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.5" />
      {/* Mic arc */}
      <path d="M26 44 C26 48 29 50 32 50 C35 50 38 48 38 44" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Mic stand */}
      <line x1="32" y1="50" x2="32" y2="53" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" />

      {/* Ashoka Chakra small — in the white band area */}
      <circle cx="49" cy="30" r="3.5" stroke="#000080" strokeWidth="0.7" fill="none" opacity="0.35" />
      <circle cx="49" cy="30" r="0.6" fill="#000080" opacity="0.35" />
    </svg>
  );
}
