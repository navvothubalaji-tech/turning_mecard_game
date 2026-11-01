import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onContinue: () => void;
  hasSaveData: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onContinue,
  hasSaveData,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent pointer-events-auto select-none">
      {/* Top Brand Tag */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-slate-900/80 text-cyan-400 text-xs font-mono tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
        Next-Gen Mechanimal Adventure Engine
      </div>

      {/* Hero Centerpiece & Inline SVG Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-2xl px-4">
        {/* Custom SVG Title Lockup with gear and lightning accents */}
        <div className="mb-4 drop-shadow-[0_4px_24px_rgba(56,189,248,0.35)]">
          <svg
            viewBox="0 0 680 140"
            className="w-full max-w-[620px] h-auto overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="titleGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="subCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Ancient Gear Emblem Behind */}
            <circle cx="340" cy="50" r="42" stroke="#d97706" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.4" />
            <circle cx="340" cy="50" r="28" stroke="#38bdf8" strokeWidth="1.5" opacity="0.3" />

            {/* WILDBOND Main Wordmark */}
            <text
              x="340"
              y="68"
              textAnchor="middle"
              fill="url(#titleGold)"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="68"
              letterSpacing="8"
            >
              WILDBOND
            </text>

            {/* Echoes of Gearfall Subtitle */}
            <text
              x="340"
              y="112"
              textAnchor="middle"
              fill="url(#subCyan)"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="20"
              letterSpacing="12"
            >
              ECHOES OF GEARFALL
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm md:text-base max-w-lg mb-8 leading-relaxed font-sans text-center">
          Explore Gearfall Meadow, bond with rogue mechanical beasts, and master the ancient 5-Card Mecard Synchronizer.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          {hasSaveData && (
            <button
              onClick={onContinue}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wider uppercase cursor-pointer"
            >
              Continue Journey
            </button>
          )}

          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wider uppercase cursor-pointer"
          >
            {hasSaveData ? 'New Adventure' : 'Start Adventure'}
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-slate-400 text-xs font-mono tracking-wider flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-center bg-slate-950/60 px-4 py-2 rounded-lg border border-slate-800">
        <span>WASD Move</span>
        <span>·</span>
        <span>Space Jump</span>
        <span>·</span>
        <span>Mouse Orbit</span>
        <span>·</span>
        <span>E Interact</span>
        <span>·</span>
        <span>1-3 Select Card</span>
        <span>·</span>
        <span>I Inventory</span>
        <span>·</span>
        <span>Esc Pause</span>
      </div>
    </div>
  );
};
