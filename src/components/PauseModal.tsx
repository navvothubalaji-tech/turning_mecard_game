import React from 'react';
import { Volume2, VolumeX, RotateCcw, Play, X, ShieldCheck, Compass } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cardCount: { empty: number; captured: number };
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  cardCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-white text-center">
        <button
          onClick={onResume}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-2">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-wide text-white">Game Paused</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">WILDBOND: ECHOES OF GEARFALL</p>
        </div>

        {/* Status Snapshot */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Empty Cards</span>
            <strong className="text-cyan-400 text-sm tabular-nums">{cardCount.empty}</strong> / 5
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px]">Bonded Cards</span>
            <strong className="text-amber-400 text-sm tabular-nums">{cardCount.captured}</strong> / 5
          </div>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Adventure</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Audio & Music' : 'Mute Audio & Music'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-rose-800/40 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Save &amp; Start Fresh</span>
          </button>
        </div>

        {/* Controls Reminder */}
        <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800">
          WASD Move · Space Jump · Mouse Orbit · E Interact · 1-3 Equip Card · I Deck
        </div>
      </div>
    </div>
  );
};
