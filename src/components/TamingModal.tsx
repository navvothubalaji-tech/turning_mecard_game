import React, { useState, useEffect, useRef } from 'react';
import { Mecard, WorldCreatureInstance } from '../types/game';
import { MECHANIMAL_DEFS } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import { Mic, MicOff, Sparkles, Zap, Droplet, Flame, CheckCircle, X } from 'lucide-react';

interface TamingModalProps {
  creature: WorldCreatureInstance;
  selectedCard: Mecard;
  availableEmptyCards: Mecard[];
  onSelectCard: (card: Mecard) => void;
  onConfirmCapture: () => void;
  onCancel: () => void;
}

export const TamingModal: React.FC<TamingModalProps> = ({
  creature,
  selectedCard,
  availableEmptyCards,
  onSelectCard,
  onConfirmCapture,
  onCancel,
}) => {
  const creatureDef = MECHANIMAL_DEFS[creature.defId];
  const [tamingState, setTamingState] = useState<'arming' | 'surging' | 'success'>('arming');
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [surgeProgress, setSurgeProgress] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript.toLowerCase();
          }
          setRecognizedText(transcript);

          // Check if transcript contains the special phrase "taming on"
          if (
            transcript.includes('taming on') ||
            transcript.includes('taming') ||
            transcript.includes('tame on') ||
            transcript.includes('turn on')
          ) {
            triggerCaptureSurge();
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          // If still in arming state, restart listening
          if (tamingState === 'arming') {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        setIsListening(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [tamingState]);

  // Trigger the energy capture surge
  const triggerCaptureSurge = () => {
    if (tamingState !== 'arming') return;
    setTamingState('surging');
    soundManager.playTamingVoiceTrigger();
    soundManager.playTamingBeam();

    // Progress surge bar over 1.2s
    let p = 0;
    const interval = setInterval(() => {
      p += 0.08;
      if (p >= 1) {
        clearInterval(interval);
        setSurgeProgress(1);
        setTamingState('success');
        onConfirmCapture();
      } else {
        setSurgeProgress(p);
      }
    }, 60);
  };

  const getElementBadge = (element: string) => {
    switch (element) {
      case 'electric':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/50">
            <Zap className="w-3.5 h-3.5" /> Electric
          </span>
        );
      case 'hydro':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/50">
            <Droplet className="w-3.5 h-3.5" /> Hydro
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-500/50">
            <Flame className="w-3.5 h-3.5" /> Pyro
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] flex flex-col gap-5 text-white">
        {/* Close / Cancel Button */}
        {tamingState !== 'surging' && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 border border-slate-700 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-mono font-bold tracking-widest uppercase">
              Mecard Synchronization Field
            </span>
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300">
            {tamingState === 'success' ? 'Taming Complete!' : 'Harmonize Wild Mechanimal'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm">
            {tamingState === 'success'
              ? `${creatureDef.name} has bonded with your Mecard and joined your team!`
              : `Target locked: ${creatureDef.name}. Equip an empty card and speak "Taming On!" to initialize card capture.`}
          </p>
        </div>

        {/* Creature Hologram Showcase Box */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-950 border border-slate-700 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">{creatureDef.name}</span>
              {getElementBadge(creatureDef.element)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <span>🚗 {creatureDef.vehicleName}</span>
              <span className="text-slate-400">➔</span>
              <span className="text-cyan-300 font-bold">Awakened Beast Form</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 mt-0.5">
              <span>HP: <strong className="text-emerald-400">{creatureDef.baseHp}</strong></span>
              <span>ATK: <strong className="text-amber-400">{creatureDef.attack}</strong></span>
              <span>DEF: <strong className="text-blue-400">{creatureDef.defense}</strong></span>
              <span>SPD: <strong className="text-cyan-400">{creatureDef.speed}</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400">Capture Rank</span>
            <span className="text-sm font-bold text-amber-400">
              {'★'.repeat(creatureDef.captureDifficulty)}
              {'☆'.repeat(5 - creatureDef.captureDifficulty)}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono mt-1">{creatureDef.rarity}</span>
          </div>
        </div>

        {/* Phase 1: Card Selection & Voice Command */}
        {tamingState === 'arming' && (
          <div className="flex flex-col gap-4">
            {/* Equipped Card Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Select Equipped Empty Mecard:</span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  {availableEmptyCards.length} Available
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {availableEmptyCards.map((card) => {
                  const isSelected = selectedCard.id === card.id;
                  return (
                    <button
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-white">Slot {card.slotIndex + 1}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Empty Card</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Recognition Prompt & Fallback Button */}
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {isListening ? (
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    Microphone Active — Speak Command:
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MicOff className="w-4 h-4" />
                    Speech Recognition Ready / Tap Below:
                  </span>
                )}
              </div>

              {/* Special Command Badge */}
              <div className="text-xl md:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-300 drop-shadow">
                &ldquo;TAMING ON!&rdquo;
              </div>

              {recognizedText && (
                <div className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                  Heard: &ldquo;{recognizedText}&rdquo;
                </div>
              )}

              {/* Primary Action Button (Voice or Tap Trigger) */}
              <button
                onClick={triggerCaptureSurge}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2 transform active:scale-98 transition"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Speak or Tap: &ldquo;Taming On!&rdquo;</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Energy Surge Vortex Animation */}
        {tamingState === 'surging' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_#38bdf8]">
                <Zap className="w-8 h-8 text-slate-950 animate-bounce" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-black text-white">Synthesizing Card Bond...</div>
              <p className="text-xs text-cyan-300 font-mono mt-1">Compressing Aether Resonance Core</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 transition-all duration-75"
                style={{ width: `${surgeProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Phase 3: Success Screen */}
        {tamingState === 'success' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-white">{creatureDef.name} Captured!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Saved onto <strong className="text-cyan-400">Slot {selectedCard.slotIndex + 1}</strong> Mecard.
              </p>
            </div>

            <div className="w-full p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Signature Move:</span>
              <span className="text-amber-400 font-bold">{creatureDef.signatureMove}</span>
            </div>

            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm uppercase tracking-wider cursor-pointer shadow-lg transition"
            >
              Continue Exploration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
