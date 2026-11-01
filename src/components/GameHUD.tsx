import React, { useEffect, useRef } from 'react';
import { Mecard, PlayerStats, Quest, WorldCreatureInstance, SecretLocation } from '../types/game';
import { MECHANIMAL_DEFS } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import {
  Shield,
  Volume2,
  VolumeX,
  Compass,
  Briefcase,
  Sparkles,
  Zap,
  Droplet,
  Flame,
  Wind,
  Mountain,
  Award,
  Swords,
  Lock,
  Unlock,
} from 'lucide-react';

interface GameHUDProps {
  playerStats: PlayerStats;
  cards: Mecard[];
  selectedEquippedIndex: number;
  onSelectEquippedIndex: (index: number) => void;
  activeQuest: Quest | null;
  nearbyCreature: WorldCreatureInstance | null;
  isNearTorren: boolean;
  nearbyLocation: SecretLocation | null;
  onOpenInventory: () => void;
  onOpenDialogue: () => void;
  onStartTamingPrompt: () => void;
  onStartBattlePrompt: () => void;
  onOpenDuel: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerPos: { x: number; y: number; z: number };
  creatures: WorldCreatureInstance[];
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerStats,
  cards,
  selectedEquippedIndex,
  onSelectEquippedIndex,
  activeQuest,
  nearbyCreature,
  isNearTorren,
  nearbyLocation,
  onOpenInventory,
  onOpenDialogue,
  onStartTamingPrompt,
  onStartBattlePrompt,
  onOpenDuel,
  isMuted,
  onToggleMute,
  playerPos,
  creatures,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter 3 equipped cards (slots 0, 1, 2)
  const equippedCards = [0, 1, 2].map((slotIdx) => cards.find((c) => c.slotIndex === slotIdx));
  const reserveCards = cards.filter((c) => c.slotIndex >= 3);

  const emptyCardCount = cards.filter((c) => !c.isCaptured).length;
  const capturedCardCount = cards.filter((c) => c.isCaptured).length;

  // Render 2D top-down minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    ctx.clearRect(0, 0, size, size);

    // Radar background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Map bounds: -75 to +75 mapped to 0..size
    const toMapCoord = (worldX: number, worldZ: number) => {
      const mx = ((worldX + 75) / 150) * size;
      const my = ((worldZ + 75) / 150) * size;
      return { mx, my };
    };

    // River curve
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let z = -70; z <= 70; z += 10) {
      const rx = -20 + Math.sin(z * 0.04) * 8;
      const { mx, my } = toMapCoord(rx, z);
      if (z === -70) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Campfire / Chief Torren
    const torrenMap = toMapCoord(4, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(torrenMap.mx, torrenMap.my, 4, 0, Math.PI * 2);
    ctx.fill();

    // Secret Cave / Building icons
    const caveMap = toMapCoord(-36, -42);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(caveMap.mx - 3, caveMap.my - 3, 6, 6);

    const citadelMap = toMapCoord(35, -38);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(citadelMap.mx - 3, citadelMap.my - 3, 6, 6);

    const sanctumMap = toMapCoord(-12, 52);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(sanctumMap.mx - 3, sanctumMap.my - 3, 6, 6);

    // Wild Creatures
    creatures.forEach((c) => {
      if (c.isCaptured) return;
      const cPos = toMapCoord(c.x, c.z);
      ctx.fillStyle =
        c.element === 'electric'
          ? '#eab308'
          : c.element === 'hydro'
          ? '#06b6d4'
          : c.element === 'pyro'
          ? '#ef4444'
          : c.element === 'aero'
          ? '#a855f7'
          : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cPos.mx, cPos.my, c.isLegendary ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player position
    const pPos = toMapCoord(playerPos.x, playerPos.z);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pPos.mx, pPos.my, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Player direction pointer ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pPos.mx, pPos.my, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    // Grid crosshairs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
  }, [playerPos, creatures]);

  const getElementIcon = (element?: string) => {
    switch (element) {
      case 'electric':
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case 'hydro':
        return <Droplet className="w-3.5 h-3.5 text-cyan-400" />;
      case 'pyro':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'aero':
        return <Wind className="w-3.5 h-3.5 text-purple-400" />;
      case 'terra':
        return <Mountain className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 z-20">
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Player Identity & Health/Stamina */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 border border-slate-800 rounded-2xl p-3 shadow-xl">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white border border-cyan-400/40 shadow-inner">
            <span className="text-lg">Lv.{playerStats.level}</span>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px] md:min-w-[170px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 tracking-wide">Ranger Explorer</span>
              <span className="text-cyan-400 font-mono text-[11px]">{playerStats.rank}</span>
            </div>

            {/* HP Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
              />
            </div>

            {/* Card Counter Status Badge (Unlimited Capacity) */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-0.5">
              <span className="text-slate-300">
                Bonded: <strong className="text-amber-400 tabular-nums">{capturedCardCount}</strong>
              </span>
              <span className="text-slate-300">
                Empty: <strong className="text-cyan-300 tabular-nums">{emptyCardCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Mini-map, Duel Arena, Sound Mute & Inventory CTA */}
        <div className="pointer-events-auto flex items-start gap-3">
          {/* Active Quest Card */}
          {activeQuest && (
            <div className="hidden sm:flex flex-col bg-slate-950/85 border border-slate-800 rounded-2xl p-3 max-w-xs shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>{activeQuest.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug line-clamp-2">{activeQuest.description}</p>
            </div>
          )}

          {/* Mini-map */}
          <div className="flex flex-col items-center bg-slate-950/85 border border-slate-800 rounded-2xl p-2 shadow-xl">
            <div className="flex items-center justify-between w-full px-1 mb-1 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> MEADOW
              </span>
              <span className="text-slate-500">RADAR</span>
            </div>
            <canvas ref={minimapCanvasRef} width={120} height={120} className="rounded-lg border border-slate-800 w-[100px] h-[100px]" />
          </div>

          {/* Action buttons (Duel Arena, Mute & Inventory) */}
          <div className="flex flex-col gap-2">
            {/* Duel Arena [B] Button */}
            <button
              onClick={onOpenDuel}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg border border-indigo-400/40"
              title="2-Player Multi-Device Duel Arena [B]"
            >
              <Swords className="w-4 h-4 text-amber-300" />
              <span>Duel [B]</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={onToggleMute}
                className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer shadow-lg"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={onOpenInventory}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg border border-blue-400/30"
                title="Open Mecard Deck & Inventory [I]"
              >
                <Briefcase className="w-4 h-4" />
                <span className="hidden md:inline font-mono">[I]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center Dynamic Interaction Prompt Banner */}
      <div className="flex flex-col items-center justify-center my-auto gap-3">
        {/* Wild Creature Nearby */}
        {nearbyCreature && !nearbyCreature.isCaptured && (
          <div className="pointer-events-auto bg-slate-950/90 border-2 border-cyan-500/80 rounded-2xl p-4 shadow-[0_0_28px_rgba(56,189,248,0.35)] flex flex-col items-center gap-2 max-w-sm text-center animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800">
                {nearbyCreature.isLegendary ? '⭐ Legendary Mechanimal' : 'Wild Toy-Car Detected'}
              </span>
              <span className="text-xs font-semibold text-slate-300">Proximity &lt; 6m</span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                Vehicle: {MECHANIMAL_DEFS[nearbyCreature.defId]?.vehicleName || 'Die-Cast Racer'}
              </span>
              <div className="flex items-center gap-2 text-lg font-black text-white">
                {getElementIcon(nearbyCreature.element)}
                <span>{MECHANIMAL_DEFS[nearbyCreature.defId]?.name || nearbyCreature.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-tight">
              {MECHANIMAL_DEFS[nearbyCreature.defId]?.vehicleType} · Battle to weaken HP below 50% for easy capture!
            </p>

            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <button
                onClick={onStartBattlePrompt}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer flex items-center justify-center gap-1.5 transition"
              >
                <Swords className="w-4 h-4" />
                <span>[E] Battle</span>
              </button>
              <button
                onClick={onStartTamingPrompt}
                className="py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Deploy Card</span>
              </button>
            </div>
          </div>
        )}

        {/* Secret Cave / Building Proximity Prompt */}
        {nearbyLocation && !nearbyCreature && (
          <div className="pointer-events-auto bg-slate-950/90 border-2 border-indigo-500/80 rounded-2xl p-4 shadow-[0_0_28px_rgba(99,102,241,0.35)] flex flex-col items-center gap-2 max-w-sm text-center animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-950 text-indigo-400">
                {nearbyLocation.isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                Hidden Site: {nearbyLocation.name}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-tight">
              {nearbyLocation.description}
            </p>

            <div className="w-full text-center py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono">
              {nearbyLocation.isUnlocked ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <Unlock className="w-3.5 h-3.5" /> Barrier Dispelled — Legendary Creature Roams Within!
                </span>
              ) : (
                <span className="text-amber-400">
                  🔒 Sealed: Requires {nearbyLocation.requiredCaptures} Mechanimals to unlock ({capturedCardCount}/{nearbyLocation.requiredCaptures})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Chief Torren NPC */}
        {isNearTorren && !nearbyCreature && !nearbyLocation && (
          <div className="pointer-events-auto bg-slate-950/90 border border-amber-500/80 rounded-2xl p-4 shadow-[0_0_24px_rgba(245,158,11,0.3)] flex flex-col items-center gap-2 max-w-sm text-center animate-in fade-in duration-200">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">NPC Nearby</span>
            <div className="text-base font-bold text-white">Chief Mechanist Torren</div>
            <button
              onClick={onOpenDialogue}
              className="mt-1 w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition"
            >
              [E] Talk &amp; Receive Guidance
            </button>
          </div>
        )}
      </div>

      {/* Bottom Center: The 3 Active Equipped Mecard Slots + Reserve Indicator */}
      <div className="flex flex-col items-center pointer-events-auto gap-2">
        {/* Reserve indicator pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Equipped: 3 / 3</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400">Reserve Vault: {reserveCards.length} Cards</span>
        </div>

        {/* The 3 Equipped Card Slots */}
        <div className="flex items-center gap-3">
          {equippedCards.map((card, idx) => {
            if (!card) return null;
            const isSelected = selectedEquippedIndex === idx;
            const creatureDef = card.capturedCreature ? MECHANIMAL_DEFS[card.capturedCreature.creatureDefId] : null;

            return (
              <div
                key={card.id}
                onClick={() => {
                  onSelectEquippedIndex(idx);
                  soundManager.playCardSelect();
                }}
                className={`relative w-28 sm:w-32 h-36 rounded-xl border-2 transition-all duration-200 p-2.5 flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-900/95 -translate-y-2 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                    : 'border-slate-700 bg-slate-950/85 hover:border-slate-500 hover:-translate-y-1'
                }`}
              >
                {/* Hotkey Tag */}
                <div className="flex items-center justify-between w-full text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    Slot {idx + 1} [{idx + 1}]
                  </span>
                  {card.isCaptured ? (
                    <span className="text-amber-400 font-bold uppercase">{card.capturedCreature?.element}</span>
                  ) : (
                    <span className="text-cyan-400 font-bold uppercase">EMPTY</span>
                  )}
                </div>

                {/* Card Center Visual */}
                <div className="flex flex-col items-center justify-center my-auto text-center">
                  {card.isCaptured && card.capturedCreature ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-amber-500/40 flex items-center justify-center mb-1">
                        {getElementIcon(card.capturedCreature.element)}
                      </div>
                      <span className="text-xs font-bold text-white leading-tight line-clamp-1">
                        {creatureDef?.name || card.capturedCreature.nickname}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Lv.{card.capturedCreature.level}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg border border-dashed border-cyan-500/50 bg-cyan-950/30 flex items-center justify-center mb-1">
                        <Sparkles className="w-4 h-4 text-cyan-400/80" />
                      </div>
                      <span className="text-[11px] font-semibold text-cyan-300 leading-tight">Empty Mecard</span>
                      <span className="text-[9px] text-slate-400 font-mono">Ready to Tame</span>
                    </>
                  )}
                </div>

                {/* Bottom Status bar */}
                <div className="w-full text-center">
                  <span
                    className={`inline-block w-full py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider ${
                      card.isCaptured
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                    }`}
                  >
                    {card.isCaptured ? 'Captured' : 'Ready'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
