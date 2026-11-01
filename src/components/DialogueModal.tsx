import React, { useState } from 'react';
import { X, Sparkles, Shield, Compass, ChevronRight } from 'lucide-react';

interface DialogueModalProps {
  onClose: () => void;
  onAdvanceQuest: () => void;
}

const TORREN_DIALOGUE = [
  {
    speaker: 'Chief Mechanist Torren',
    title: 'Veteran Gearfall Ranger',
    text: 'Welcome, young explorer, to Gearfall Meadow! Long ago, an ancient civilization forged the Mechanimals—living mechanical beasts with hearts of pure aether.',
  },
  {
    speaker: 'Chief Mechanist Torren',
    title: 'Veteran Gearfall Ranger',
    text: 'You carry the sacred 5-Card Mecard Synchronizer. Your wrist-launcher can wield exactly 3 active cards at once, keeping 2 spare cards in reserve on your belt.',
  },
  {
    speaker: 'Chief Mechanist Torren',
    title: 'Veteran Gearfall Ranger',
    text: 'When you encounter a wild Mechanimal—like the electric Voltiger prowling the eastern crags—approach within 6 meters, equip an empty card, and invoke the command: "Taming On!"',
  },
  {
    speaker: 'Chief Mechanist Torren',
    title: 'Veteran Gearfall Ranger',
    text: 'Remember: each successful capture binds the creature into that exact card! You have 5 cards total in your possession—manage them wisely. Now go forth and bond with the meadow’s guardians!',
  },
];

export const DialogueModal: React.FC<DialogueModalProps> = ({ onClose, onAdvanceQuest }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < TORREN_DIALOGUE.length - 1) {
      setStep(step + 1);
    } else {
      onAdvanceQuest();
      onClose();
    }
  };

  const current = TORREN_DIALOGUE[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col gap-5 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-400">{current.speaker}</h3>
            <span className="text-xs text-slate-400 font-mono">{current.title}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm md:text-base leading-relaxed min-h-[90px]">
          &ldquo;{current.text}&rdquo;
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-slate-500">
            Field Guidance {step + 1} / {TORREN_DIALOGUE.length}
          </span>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg transition"
          >
            <span>{step === TORREN_DIALOGUE.length - 1 ? 'Accept Mission' : 'Continue'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
