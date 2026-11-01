import React, { useState } from 'react';
import { Mecard, PlayerStats } from '../types/game';
import { MECHANIMAL_DEFS, SECRET_LOCATIONS } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import {
  X,
  Sparkles,
  Shield,
  Layers,
  BookOpen,
  Package,
  Zap,
  Droplet,
  Flame,
  Wind,
  Mountain,
  ArrowRightLeft,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';

interface InventoryModalProps {
  cards: Mecard[];
  playerStats: PlayerStats;
  onSwapCards: (slotA: number, slotB: number) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  cards,
  playerStats,
  onSwapCards,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'codex' | 'items'>('cards');
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(cards[0]?.id || null);
  const [swapSourceSlot, setSwapSourceSlot] = useState<number | null>(null);
  const [codexTierFilter, setCodexTierFilter] = useState<'All' | 'Basic' | 'Medium' | 'Advanced' | 'Legend' | 'God'>('All');

  const emptyCardCount = cards.filter((c) => !c.isCaptured).length;
  const capturedCardCount = cards.filter((c) => c.isCaptured).length;

  // Active Equipped (slots 0, 1, 2) and Reserve Vault (slots 3+)
  const equippedCards = [0, 1, 2].map((idx) => cards.find((c) => c.slotIndex === idx));
  const reserveCards = cards.filter((c) => c.slotIndex >= 3);

  const inspectedCard = cards.find((c) => c.id === inspectedCardId) || cards[0];
  const inspectedCreature = inspectedCard?.capturedCreature
    ? MECHANIMAL_DEFS[inspectedCard.capturedCreature.creatureDefId]
    : null;

  const handleCardClick = (card: Mecard) => {
    setInspectedCardId(card.id);
    soundManager.playCardSelect();

    if (swapSourceSlot !== null) {
      if (swapSourceSlot !== card.slotIndex) {
        onSwapCards(swapSourceSlot, card.slotIndex);
        setSwapSourceSlot(null);
      } else {
        setSwapSourceSlot(null);
      }
    }
  };

  const startSwap = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (swapSourceSlot === slotIdx) {
      setSwapSourceSlot(null);
    } else {
      setSwapSourceSlot(slotIdx);
      soundManager.playCardSelect();
    }
  };

  const getElementIcon = (element?: string) => {
    switch (element) {
      case 'electric':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'hydro':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'pyro':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'aero':
        return <Wind className="w-4 h-4 text-purple-400" />;
      case 'terra':
        return <Mountain className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[760px] bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white">Mecard Synchronizer Deck</h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span>Total Cards: <strong className="text-white">{cards.length}</strong></span>
                <span>·</span>
                <span>Equipped: <strong className="text-cyan-400">3</strong></span>
                <span>·</span>
                <span>Reserve Vault: <strong className="text-amber-400">{reserveCards.length}</strong></span>
                <span>·</span>
                <span>Empty: <strong className="text-emerald-400 tabular-nums">{emptyCardCount}</strong></span>
                <span>·</span>
                <span>Captured: <strong className="text-indigo-400 tabular-nums">{capturedCardCount}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs Navigation */}
            <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cards'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Card Deck</span>
              </button>
              <button
                onClick={() => setActiveTab('codex')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'codex'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Field Codex &amp; Secrets</span>
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'items'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Gearpack</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Column: All Cards (Equipped 3 vs Reserve Vault) */}
              <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-1">
                {/* Section 1: Active Equipped Slots (3 Cards) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Active Equipped Slots (3 Wrist Launcher Cards)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Quick Slots [1, 2, 3]</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {equippedCards.map((card, i) => {
                      if (!card) return null;
                      const isInspected = inspectedCardId === card.id;
                      const isSwapSource = swapSourceSlot === card.slotIndex;
                      const creature = card.capturedCreature
                        ? MECHANIMAL_DEFS[card.capturedCreature.creatureDefId]
                        : null;

                      return (
                        <div
                          key={card.id}
                          onClick={() => handleCardClick(card)}
                          className={`relative p-3 rounded-2xl border-2 flex flex-col justify-between h-44 transition cursor-pointer ${
                            isSwapSource
                              ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400'
                              : isInspected
                              ? 'border-cyan-400 bg-slate-800/90 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                              : 'border-slate-700 bg-slate-950/80 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-cyan-300">Slot {i + 1}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                card.isCaptured
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              }`}
                            >
                              {card.isCaptured ? 'Captured' : 'Empty'}
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center my-auto">
                            {card.isCaptured && card.capturedCreature ? (
                              <>
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-amber-500/50 flex items-center justify-center mb-1 shadow-inner">
                                  {getElementIcon(card.capturedCreature.element)}
                                </div>
                                <span className="text-xs font-bold text-white line-clamp-1">
                                  {creature?.name || card.capturedCreature.nickname}
                                </span>
                                <span className="text-[10px] text-amber-400 font-mono">
                                  Lv.{card.capturedCreature.level}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-xl border border-dashed border-cyan-500/50 bg-cyan-950/30 flex items-center justify-center mb-1">
                                  <Sparkles className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-xs font-semibold text-cyan-300">Empty Mecard</span>
                                <span className="text-[10px] text-slate-400 font-mono">Ready to Bind</span>
                              </>
                            )}
                          </div>

                          <button
                            onClick={(e) => startSwap(card.slotIndex, e)}
                            className={`w-full py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                              isSwapSource
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            {isSwapSource ? 'Select Target...' : 'Swap Slot'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Reserve Vault Collection (Unlimited Cards) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      Reserve Vault Collection ({reserveCards.length} Cards in Reserve)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Click Swap to Equip into Active Slots</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {reserveCards.map((card, i) => {
                      const isInspected = inspectedCardId === card.id;
                      const isSwapSource = swapSourceSlot === card.slotIndex;
                      const creature = card.capturedCreature
                        ? MECHANIMAL_DEFS[card.capturedCreature.creatureDefId]
                        : null;

                      return (
                        <div
                          key={card.id}
                          onClick={() => handleCardClick(card)}
                          className={`relative p-3 rounded-2xl border-2 flex flex-col justify-between h-40 transition cursor-pointer ${
                            isSwapSource
                              ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400'
                              : isInspected
                              ? 'border-amber-400 bg-slate-800/90 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                              : 'border-slate-700 bg-slate-950/80 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-amber-300">Vault #{i + 1}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                card.isCaptured
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {card.isCaptured ? 'Captured' : 'Empty'}
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center my-auto">
                            {card.isCaptured && card.capturedCreature ? (
                              <>
                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-amber-500/50 flex items-center justify-center mb-1">
                                  {getElementIcon(card.capturedCreature.element)}
                                </div>
                                <span className="text-xs font-bold text-white line-clamp-1">
                                  {creature?.name || card.capturedCreature.nickname}
                                </span>
                                <span className="text-[10px] text-amber-400 font-mono">
                                  Lv.{card.capturedCreature.level}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-xl border border-dashed border-slate-600 bg-slate-900 flex items-center justify-center mb-1">
                                  <Sparkles className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-300">Empty Mecard</span>
                                <span className="text-[10px] text-slate-500 font-mono">Reserve</span>
                              </>
                            )}
                          </div>

                          <button
                            onClick={(e) => startSwap(card.slotIndex, e)}
                            className={`w-full py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                              isSwapSource
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            {isSwapSource ? 'Select Target...' : 'Equip into Active'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {swapSourceSlot !== null && (
                  <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/60 text-xs font-mono text-amber-300 flex items-center justify-between">
                    <span>Click any other card slot to swap places.</span>
                    <button
                      onClick={() => setSwapSourceSlot(null)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Holographic Card Inspector */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
                {inspectedCard ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                        Card Inspector · {inspectedCard.isEquipped ? 'Equipped Slot' : 'Reserve Vault'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        Slot #{inspectedCard.slotIndex + 1}
                      </span>
                    </div>

                    {inspectedCard.isCaptured && inspectedCreature && inspectedCard.capturedCreature ? (
                      <div className="flex flex-col gap-4">
                        {/* 3D Holographic Card Visual */}
                        <div
                          className="w-full h-48 rounded-2xl border-2 flex flex-col items-center justify-between p-4 shadow-xl"
                          style={{
                            borderColor: inspectedCreature.color,
                            background: `linear-gradient(135deg, ${inspectedCreature.color}22 0%, #0f172a 100%)`,
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-black text-white">{inspectedCreature.name}</span>
                            <span className="text-xs font-mono font-bold uppercase text-amber-400">
                              {inspectedCreature.rarity}
                            </span>
                          </div>

                          <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-white/20 flex items-center justify-center shadow-lg">
                            {getElementIcon(inspectedCreature.element)}
                          </div>

                          <div className="w-full flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-300">Bond Level: {inspectedCard.capturedCreature.bondLevel}%</span>
                            <span className="text-cyan-400 font-bold">Lv.{inspectedCard.capturedCreature.level}</span>
                          </div>
                        </div>

                        {/* Creature Lore & Stats */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono mb-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            <span>🚗 Vehicle Form: <strong className="text-white">{inspectedCreature.vehicleName}</strong></span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">{inspectedCreature.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{inspectedCreature.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">HP Max</span>
                            <strong className="text-emerald-400 text-sm">
                              {inspectedCard.capturedCreature.stats.maxHp}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Attack</span>
                            <strong className="text-amber-400 text-sm">
                              {inspectedCard.capturedCreature.stats.attack}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Defense</span>
                            <strong className="text-blue-400 text-sm">
                              {inspectedCard.capturedCreature.stats.defense}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Speed</span>
                            <strong className="text-cyan-400 text-sm">
                              {inspectedCard.capturedCreature.stats.speed}
                            </strong>
                          </div>
                        </div>

                        {/* The 5 Attack Battle Cards */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
                            5 Attack Battle Cards (Slots 1–3 Active in Combat):
                          </span>
                          <div className="grid grid-cols-1 gap-1">
                            {inspectedCreature.moves.map((m, idx) => {
                              const isActive = idx < 3;
                              return (
                                <div
                                  key={m.id || idx}
                                  className={`px-2 py-1.5 rounded-lg border flex items-center justify-between text-xs ${
                                    isActive
                                      ? 'bg-slate-950 border-cyan-500/40 text-white'
                                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-amber-400">
                                      #{m.cardIndex}
                                    </span>
                                    <span className="font-semibold text-xs">{m.name}</span>
                                    {m.specialEffect && (
                                      <span className="text-[9px] font-mono text-indigo-400 uppercase">
                                        [{m.specialEffect}]
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-amber-400 text-[10px]">{m.power} PWR</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                        isActive
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {isActive ? 'Active' : 'Reserve'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                        <div className="w-20 h-28 rounded-2xl border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-cyan-400/60" />
                        </div>
                        <h4 className="text-base font-bold text-white">Empty Capture Mecard</h4>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                          This Mecard is blank and ready to bond with a wild Mechanimal. Approach a roaming toy-car creature in the world, equip this card in an active slot, and initiate battle or taming!
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="text-[11px] font-mono text-slate-500 text-center pt-3 border-t border-slate-800">
                  Tip: Mechanimals roam as die-cast cars and transform into fierce beast mode upon contact!
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Field Codex & Secret Locations */}
          {activeTab === 'codex' && (
            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
              {/* Secret Locations Summary */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Hidden Sites &amp; Legendary Sanctums (Unlocked by Capturing Mechanimals):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SECRET_LOCATIONS.map((loc) => {
                    const isUnlocked = capturedCardCount >= loc.requiredCaptures;
                    return (
                      <div
                        key={loc.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isUnlocked
                            ? 'bg-slate-950 border-emerald-500/60'
                            : 'bg-slate-950/60 border-slate-800 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white">{loc.name}</span>
                            {isUnlocked ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                                <Unlock className="w-3 h-3" /> Unlocked
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 font-mono">
                                Req: {loc.requiredCaptures} Caught
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{loc.description}</p>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-cyan-300">
                          Guardian: {MECHANIMAL_DEFS[loc.legendaryDefId]?.name || 'Legendary Beast'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mechanimal Codex Cards with Tier Filter */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    All Mechanimal Blueprints ({Object.keys(MECHANIMAL_DEFS).length} Discovered):
                  </h3>

                  {/* 5 Rarity Tier Filter Pills */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
                    {(['All', 'Basic', 'Medium', 'Advanced', 'Legend', 'God'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => {
                          setCodexTierFilter(tier);
                          soundManager.playCardSelect();
                        }}
                        className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                          codexTierFilter === tier
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(MECHANIMAL_DEFS)
                    .filter((def) => codexTierFilter === 'All' || def.rarity === codexTierFilter)
                    .map((def) => {
                      const isCaptured = cards.some(
                        (c) => c.capturedCreature?.creatureDefId === def.id
                      );

                    return (
                      <div
                        key={def.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between ${
                          isCaptured
                            ? 'border-cyan-500/80 bg-slate-950/90 shadow-lg'
                            : 'border-slate-800 bg-slate-950/40 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase text-amber-400">
                              {def.rarity} {def.isLegendary ? '⭐' : ''}
                            </span>
                            {isCaptured ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                                <Check className="w-3 h-3" /> Captured
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500">Uncaptured</span>
                            )}
                          </div>

                          <h3 className="text-lg font-black text-white">{def.name}</h3>
                          <span className="text-xs text-cyan-400 italic">{def.title}</span>

                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
                            🚗 Vehicle: <strong className="text-white">{def.vehicleName}</strong>
                            <div className="text-[10px] text-slate-400">{def.vehicleType}</div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mt-1">{def.description}</p>
                        </div>

                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800 text-xs font-mono">
                          <div className="flex justify-between text-slate-400">
                            <span>Habitat:</span>
                            <span className="text-slate-200 text-right">{def.habitat}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Signature:</span>
                            <span className="text-amber-400">{def.signatureMove}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Gearpack Resources */}
          {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 mb-3">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Brass Gear Scraps</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Ancient clockwork cogs salvageable throughout the meadow ruins. Used to calibrate card resonance.
                  </p>
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-4">
                  {playerStats.inventoryScraps} <span className="text-xs text-slate-400 font-normal">Units</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Azure Aether Crystals</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Pure crystalline energy nodes emitting high-frequency resonance. Powers the Mecard capture field.
                  </p>
                </div>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-4">
                  {playerStats.inventoryShards} <span className="text-xs text-slate-400 font-normal">Crystals</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Clockwork Berries</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Curious biomechanical flora that restores stamina and stabilizes bio-electric energy in explorers.
                  </p>
                </div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-4">
                  {playerStats.inventoryBerries} <span className="text-xs text-slate-400 font-normal">Berries</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
