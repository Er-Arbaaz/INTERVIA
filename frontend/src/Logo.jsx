// Versatile, multi-variant SVG Logo Component for INTERVIA
// Supports:
//  - "monogram" (Default): The sleek, modern 'Ai' arch + node glyph (inspired by your reference)
//  - "dialogue": The conversational speech wave representing spoken interviews
//  - "nexus": The geometric isometric crystal representing multidimensional tech assessment

export default function InterviaLogo({
  size = 32,
  variant = "monogram",
  className = "",
  style = {}
}) {
  if (variant === "dialogue") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, ...style }}
        aria-label="INTERVIA Dialogue Logo"
      >
        <defs>
          <linearGradient id="ivDiagGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path
          d="M 24 6 C 13.5 6 5 13.5 5 23 C 5 27.8 7.3 32.1 11 35.2 L 9.5 42 L 16.5 39 C 18.8 39.7 21.3 40 24 40 C 34.5 40 43 32.5 43 23 C 43 13.5 34.5 6 24 6 Z"
          stroke="url(#ivDiagGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(99, 102, 241, 0.12)"
        />
        <line x1="17" y1="23" x2="17" y2="23.1" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="24" y1="16" x2="24" y2="30" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="31" y1="20" x2="31" y2="26" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "nexus") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, ...style }}
        aria-label="INTERVIA Nexus Logo"
      >
        <defs>
          <linearGradient id="ivNexA" x1="24" y1="4" x2="8" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="ivNexB" x1="24" y1="4" x2="40" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <path d="M 24 4 L 7 14 L 7 34 L 24 44 L 24 24 Z" fill="url(#ivNexA)" />
        <path d="M 24 4 L 41 14 L 41 34 L 24 44 L 24 24 Z" fill="url(#ivNexB)" />
        <path d="M 24 4 L 32.5 9 L 24 14 L 15.5 9 Z" fill="#FFFFFF" opacity="0.4" />
        <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
      </svg>
    );
  }

  // Default: Sleek "Ai" Monogram (Clean, bold, modern, unboxed)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-label="INTERVIA Logo"
    >
      <defs>
        <linearGradient id="ivMonogramBlue" x1="32" y1="8" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="ivMonoGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#ivMonoGlow)">
        {/* Bold Modern Arch 'A' */}
        <path
          d="M 9 40 L 21 11.5 C 22.3 8.5 26.2 8.5 27.5 11.5 L 35 29"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 'i' Circular Node / Brain Synapse Dot */}
        <circle
          cx="43"
          cy="14"
          r="5"
          fill="url(#ivMonogramBlue)"
        />

        {/* 'i' Rounded Vertical Stem */}
        <rect
          x="38"
          y="23"
          width="10"
          height="17"
          rx="5"
          fill="url(#ivMonogramBlue)"
        />
      </g>
    </svg>
  );
}
