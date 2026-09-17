import React from 'react';

interface TurfMateLogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    subtitle?: string;
}

export default function TurfMateLogo({
    size = 36,
    showText = false,
    className = '',
    subtitle = 'Arena & Pitches',
}: TurfMateLogoProps) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            {/* SVG Emblem Mark */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 128 128"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-md"
                aria-label="TurfMate Emblem"
            >
                <defs>
                    <linearGradient id="tml-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#064e3b" />
                        <stop offset="50%" stopColor="#047857" />
                        <stop offset="100%" stopColor="#022c22" />
                    </linearGradient>

                    <linearGradient id="tml-neon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>

                    <linearGradient id="tml-metal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                    </linearGradient>

                    <linearGradient id="tml-ball" x1="20%" y1="20%" x2="80%" y2="80%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="80%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                </defs>

                {/* Outer Stadium Squircle */}
                <rect
                    x="5"
                    y="5"
                    width="118"
                    height="118"
                    rx="32"
                    fill="url(#tml-bg)"
                    stroke="url(#tml-neon)"
                    strokeWidth="4"
                />

                {/* Pitch Geometry */}
                <line
                    x1="5"
                    y1="64"
                    x2="123"
                    y2="64"
                    stroke="#34d399"
                    strokeOpacity="0.3"
                    strokeWidth="3"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="32"
                    stroke="#34d399"
                    strokeOpacity="0.3"
                    strokeWidth="3"
                    fill="none"
                />
                <circle cx="64" cy="64" r="4.5" fill="#34d399" fillOpacity="0.4" />

                {/* Athletic Monogram 'T' */}
                <g>
                    {/* Crossbar */}
                    <path
                        d="M24 30 L104 30 L96 46 L32 46 Z"
                        fill="url(#tml-metal)"
                    />
                    {/* Pillar */}
                    <path
                        d="M52 46 L76 46 L76 94 L64 104 L52 94 Z"
                        fill="url(#tml-metal)"
                    />
                    {/* Neon Stripe */}
                    <path
                        d="M36 38 L92 38"
                        stroke="url(#tml-neon)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </g>

                {/* Crown Match Ball */}
                <g transform="translate(64, 30)">
                    <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill="url(#tml-ball)"
                        stroke="#064e3b"
                        strokeWidth="2.5"
                    />
                    <polygon
                        points="0,-5 5,-1.5 3,4.5 -3,4.5 -5,-1.5"
                        fill="#064e3b"
                    />
                    <line x1="0" y1="-5" x2="0" y2="-14" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="5" y1="-1.5" x2="13.5" y2="-4.5" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="4.5" x2="8.5" y2="12" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-3" y1="4.5" x2="-8.5" y2="12" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-5" y1="-1.5" x2="-13.5" y2="-4.5" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                </g>
            </svg>

            {/* Optional Typography */}
            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-black text-white tracking-tight leading-none">
                        Turf<span className="text-emerald-400">Mate</span>
                    </span>
                    {subtitle && (
                        <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase leading-tight mt-0.5">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
