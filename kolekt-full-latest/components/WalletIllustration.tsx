export default function WalletIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Purple wallet with floating coins">
      <defs>
        <linearGradient id="w-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B72F2" /><stop offset="1" stopColor="#6A38C8" /></linearGradient>
        <linearGradient id="w-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A2CB4" /><stop offset="1" stopColor="#43208F" /></linearGradient>
        <linearGradient id="w-flap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B393F5" /><stop offset="1" stopColor="#7743DB" /></linearGradient>
        <linearGradient id="w-cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F7EFE5" /></linearGradient>
        <linearGradient id="w-lav" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8DDF0" /><stop offset="1" stopColor="#C3ACD0" /></linearGradient>
        <radialGradient id="w-coin" cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C3ACD0" /></radialGradient>
        <radialGradient id="w-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#C3ACD0" stopOpacity=".55" /><stop offset="1" stopColor="#C3ACD0" stopOpacity="0" /></radialGradient>
        <filter id="w-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      <ellipse cx="160" cy="118" rx="150" ry="104" fill="url(#w-glow)" />
      <ellipse cx="160" cy="216" rx="104" ry="11" fill="#7743DB" opacity=".22" filter="url(#w-blur)" />

      <g className="fw">
        <rect x="62" y="82" width="196" height="116" rx="30" fill="#4D2599" />
        <g transform="rotate(-9 150 100)">
          <rect x="84" y="46" width="124" height="82" rx="14" fill="url(#w-lav)" />
          <rect x="96" y="60" width="34" height="8" rx="4" fill="#fff" opacity=".6" />
        </g>
        <g transform="rotate(7 175 90)">
          <rect x="112" y="38" width="124" height="82" rx="14" fill="url(#w-cream)" />
          <rect x="126" y="54" width="30" height="22" rx="6" fill="#C3ACD0" opacity=".55" />
          <rect x="126" y="86" width="64" height="6" rx="3" fill="#C3ACD0" opacity=".5" />
        </g>
        <rect x="58" y="98" width="204" height="112" rx="30" fill="url(#w-side)" />
        <rect x="58" y="90" width="204" height="112" rx="30" fill="url(#w-body)" />
        <rect x="70" y="96" width="180" height="24" rx="12" fill="#fff" opacity=".13" />
        <rect x="72" y="104" width="176" height="84" rx="22" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.6" strokeDasharray="4 6" />
        <rect x="190" y="134" width="94" height="50" rx="25" fill="#43208F" opacity=".5" />
        <rect x="190" y="128" width="94" height="50" rx="25" fill="url(#w-flap)" />
        <rect x="198" y="132" width="78" height="12" rx="6" fill="#fff" opacity=".18" />
        <circle cx="226" cy="153" r="10" fill="url(#w-cream)" />
        <circle cx="226" cy="153" r="4" fill="#7743DB" />
      </g>

      <g transform="translate(268 48)"><g className="fa">
        <circle r="18" fill="url(#w-coin)" />
        <circle r="12.5" fill="none" stroke="#7743DB" strokeOpacity=".35" strokeWidth="1.5" />
        <text textAnchor="middle" y="5.5" fontSize="15" fontWeight="800" fill="#7743DB" fontFamily="Arial,sans-serif">₦</text>
      </g></g>
      <g transform="translate(46 98)"><g className="fb">
        <circle r="12" fill="url(#w-coin)" />
        <circle r="8" fill="none" stroke="#7743DB" strokeOpacity=".35" strokeWidth="1.3" />
      </g></g>
      <g transform="translate(38 168)"><g className="fc"><circle r="7" fill="#C3ACD0" /></g></g>
      <g transform="translate(284 192)"><g className="fb"><circle r="5" fill="#7743DB" opacity=".35" /></g></g>
      <g transform="translate(100 24)"><g className="fc"><path d="M0-9Q1.5-1.5 9 0Q1.5 1.5 0 9Q-1.5 1.5-9 0Q-1.5-1.5 0-9Z" fill="#7743DB" opacity=".75" /></g></g>
      <g transform="translate(246 20) scale(.7)"><g className="fa"><path d="M0-9Q1.5-1.5 9 0Q1.5 1.5 0 9Q-1.5 1.5-9 0Q-1.5-1.5 0-9Z" fill="#C3ACD0" /></g></g>
      <g transform="translate(22 52) scale(.6)"><g className="fb"><path d="M0-9Q1.5-1.5 9 0Q1.5 1.5 0 9Q-1.5 1.5-9 0Q-1.5-1.5 0-9Z" fill="#C3ACD0" /></g></g>
      <g transform="translate(298 112) scale(.8)"><g className="fc"><path d="M0-9Q1.5-1.5 9 0Q1.5 1.5 0 9Q-1.5 1.5-9 0Q-1.5-1.5 0-9Z" fill="#7743DB" opacity=".5" /></g></g>
    </svg>
  );
}
