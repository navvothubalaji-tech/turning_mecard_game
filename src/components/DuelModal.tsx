import React, { useState, useEffect } from 'react';
import { Mecard, CapturedCreature, BattleMove, BattleFormat, RarityTier } from '../types/game';
import { MECHANIMAL_DEFS } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import {
  Swords,
  Users,
  Smartphone,
  Copy,
  Check,
  Sparkles,
  Zap,
  Droplet,
  Flame,
  Wind,
  Mountain,
  AlertTriangle,
  Trophy,
  X,
  Bot,
  Mic,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface DuelModalProps {
  playerCapturedCards: Mecard[];
  onAnteWon: (claimedCreature: CapturedCreature) => void;
  onAnteLost: (lostCardId: string) => void;
  onClose: () => void;
}

type DuelMode = 'select' | 'online_create' | 'online_join' | 'online_battle' | 'local_battle' | 'ai_battle';

export const DuelModal: React.FC<DuelModalProps> = ({
  playerCapturedCards,
  onAnteWon,
  onAnteLost,
  onClose,
}) => {
  // Mode selection & Team format
  const [mode, setMode] = useState<DuelMode>('select');
  const [duelFormat, setDuelFormat] = useState<BattleFormat>('1v1');

  // Selected Mechanimal for player
  const [selectedCardId, setSelectedCardId] = useState<string>(
    playerCapturedCards[0]?.id || ''
  );

  // 3 Active Battle Cards out of 5
  const [activeThreeMoveIndices, setActiveThreeMoveIndices] = useState<number[]>([0, 1, 2]);
  const [isMecardSetChanted, setIsMecardSetChanted] = useState(false);

  // Online Duel State
  const [playerName] = useState('Mechanist ' + Math.floor(100 + Math.random() * 900));
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [onlineRoom, setOnlineRoom] = useState<any>(null);
  const [onlinePolling, setOnlinePolling] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local Pass & Play State
  const [localP1Card] = useState<Mecard | null>(playerCapturedCards[0] || null);
  const [localP2Card] = useState<Mecard | null>(
    playerCapturedCards[1] || playerCapturedCards[0] || null
  );
  const [localP1Hp, setLocalP1Hp] = useState(200);
  const [localP2Hp, setLocalP2Hp] = useState(200);
  const [localCurrentTurn, setLocalCurrentTurn] = useState<0 | 1>(0);
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const [localWinner, setLocalWinner] = useState<number | null>(null);

  // AI Rival Duel State
  const [aiPlayerHp, setAiPlayerHp] = useState(200);
  const [aiRivalHp, setAiRivalHp] = useState(260);
  const [aiRivalDef, setAiRivalDef] = useState(MECHANIMAL_DEFS['ironfang']);
  const [aiTurn, setAiTurn] = useState<'player' | 'rival'>('player');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [aiWinner, setAiWinner] = useState<'player' | 'rival' | null>(null);

  // Ante resolution state
  const [anteDecisionMade, setAnteDecisionMade] = useState(false);

  const selectedPlayerCard = playerCapturedCards.find((c) => c.id === selectedCardId);
  const selectedCreature = selectedPlayerCard?.capturedCreature;
  const selectedDef = selectedCreature ? MECHANIMAL_DEFS[selectedCreature.creatureDefId] : null;

  // Poll online room state every 1.2s when active
  useEffect(() => {
    if (!activeRoomCode || !onlinePolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/duel/state/${activeRoomCode}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.room) {
          setOnlineRoom(data.room);
          if (data.room.status === 'finished') {
            soundManager.playLevelUp();
          }
        }
      } catch {
        // network retry
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeRoomCode, onlinePolling]);

  // Voice command detection for "Mecard Set!" in Duel
  useEffect(() => {
    if (isMecardSetChanted || mode === 'select') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript.toLowerCase();
        }
        if (
          text.includes('mecard set') ||
          text.includes('set of mecards') ||
          text.includes('set mecards') ||
          text.includes('set')
        ) {
          triggerDuelMecardSet();
        }
      };

      recognition.start();
      return () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }, [isMecardSetChanted, mode]);

  const triggerDuelMecardSet = () => {
    setIsMecardSetChanted(true);
    soundManager.playCardEquip();
    soundManager.playTamingBeam();
    if (selectedDef) soundManager.playCreatureRoar(selectedDef.element);
  };

  // Handle Online Room Creation
  const handleCreateOnlineRoom = async () => {
    if (!selectedCreature) {
      setErrorMessage('Please select a captured Mechanimal from your deck first!');
      return;
    }
    setErrorMessage(null);
    setIsMecardSetChanted(false);

    try {
      const res = await fetch('/api/duel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          mechanimal: selectedCreature,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveRoomCode(data.room.code);
        setMyPlayerIndex(0);
        setOnlineRoom(data.room);
        setOnlinePolling(true);
        setMode('online_battle');
        soundManager.playCardEquip();
      } else {
        setErrorMessage(data.message || 'Failed to create room.');
      }
    } catch (e: any) {
      setErrorMessage('Could not connect to duel server: ' + e.message);
    }
  };

  // Handle Joining Online Room
  const handleJoinOnlineRoom = async () => {
    if (!selectedCreature) {
      setErrorMessage('Please select a captured Mechanimal from your deck first!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage('Please enter the 4-digit room code from your friend!');
      return;
    }
    setErrorMessage(null);
    setIsMecardSetChanted(false);

    try {
      const res = await fetch('/api/duel/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCodeInput.trim(),
          playerName,
          mechanimal: selectedCreature,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveRoomCode(data.room.code);
        setMyPlayerIndex(1);
        setOnlineRoom(data.room);
        setOnlinePolling(true);
        setMode('online_battle');
        soundManager.playCardEquip();
      } else {
        setErrorMessage(data.message || 'Room not found or already full.');
      }
    } catch (e: any) {
      setErrorMessage('Failed to join duel room: ' + e.message);
    }
  };

  // Handle Online Move
  const handleSendOnlineMove = async (move: BattleMove) => {
    if (!activeRoomCode || !onlineRoom || onlineRoom.currentTurn !== myPlayerIndex) return;

    soundManager.playTamingBeam();

    try {
      const res = await fetch('/api/duel/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeRoomCode,
          playerIndex: myPlayerIndex,
          moveName: `Card #${move.cardIndex}: ${move.name}`,
          damage: move.power,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOnlineRoom(data.room);
      }
    } catch {
      // ignore
    }
  };

  // Handle Online Ante Claim Decision
  const handleOnlineClaimDecision = async (claim: boolean) => {
    if (!activeRoomCode || !onlineRoom) return;

    try {
      const res = await fetch('/api/duel/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeRoomCode,
          playerIndex: myPlayerIndex,
          claim,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnteDecisionMade(true);
        if (claim && data.claimedMechanimal) {
          onAnteWon(data.claimedMechanimal);
          soundManager.playCaptureSuccess();
        }
      }
    } catch {
      // ignore
    }
  };

  // Initialize Local Pass & Play
  const handleStartLocalBattle = () => {
    if (!localP1Card?.capturedCreature || !localP2Card?.capturedCreature) {
      setErrorMessage('Need 2 Mechanimals for Local Pass & Play! Capture more creatures in the meadow.');
      return;
    }
    setLocalP1Hp(localP1Card.capturedCreature.stats.maxHp);
    setLocalP2Hp(localP2Card.capturedCreature.stats.maxHp);
    setLocalCurrentTurn(0);
    setIsMecardSetChanted(false);
    setLocalLogs([
      `Local Pass-and-Play Duel initiated! Format: ${duelFormat.toUpperCase()}`,
      `Player 1: ${localP1Card.capturedCreature.nickname} vs Player 2: ${localP2Card.capturedCreature.nickname}!`,
      `Both duelists must chant "MECARD SET!" to transform toy cars into beasts!`,
    ]);
    setLocalWinner(null);
    setAnteDecisionMade(false);
    setMode('local_battle');
    soundManager.playCardEquip();
  };

  // Handle Local Move
  const handleLocalMove = (moveIndex: number) => {
    if (localWinner !== null) return;

    soundManager.playTamingBeam();

    if (localCurrentTurn === 0) {
      const attacker = localP1Card!.capturedCreature!;
      const def = MECHANIMAL_DEFS[attacker.creatureDefId];
      const move = def.moves[moveIndex] || def.moves[0];
      const damage = move.power;
      const nextHp = Math.max(0, localP2Hp - damage);
      setLocalP2Hp(nextHp);

      setLocalLogs((prev) => [
        `Player 1 (${attacker.nickname}) used [Card #${move.cardIndex}: ${move.name}]! Dealt ${damage} damage!`,
        ...prev.slice(0, 4),
      ]);

      if (nextHp <= 0) {
        setLocalWinner(0);
        soundManager.playLevelUp();
      } else {
        setLocalCurrentTurn(1);
      }
    } else {
      const attacker = localP2Card!.capturedCreature!;
      const def = MECHANIMAL_DEFS[attacker.creatureDefId];
      const move = def.moves[moveIndex] || def.moves[0];
      const damage = move.power;
      const nextHp = Math.max(0, localP1Hp - damage);
      setLocalP1Hp(nextHp);

      setLocalLogs((prev) => [
        `Player 2 (${attacker.nickname}) used [Card #${move.cardIndex}: ${move.name}]! Dealt ${damage} damage!`,
        ...prev.slice(0, 4),
      ]);

      if (nextHp <= 0) {
        setLocalWinner(1);
        soundManager.playLevelUp();
      } else {
        setLocalCurrentTurn(0);
      }
    }
  };

  // Handle Local Ante Claim
  const handleLocalClaim = (claim: boolean) => {
    setAnteDecisionMade(true);
    if (localWinner === 0) {
      if (claim && localP2Card?.capturedCreature) {
        onAnteWon(localP2Card.capturedCreature);
        onAnteLost(localP2Card.id);
        soundManager.playCaptureSuccess();
      }
    } else {
      if (claim && localP1Card?.capturedCreature) {
        onAnteLost(localP1Card.id);
        soundManager.playCaptureSuccess();
      }
    }
  };

  // Initialize AI Rival Battle
  const handleStartAiBattle = () => {
    if (!selectedCreature) {
      setErrorMessage('Please select your Mechanimal companion first!');
      return;
    }
    const rivalPool = [
      MECHANIMAL_DEFS['ironfang'],
      MECHANIMAL_DEFS['aerostrike'],
      MECHANIMAL_DEFS['emberhorn'],
      MECHANIMAL_DEFS['draco_ignis'],
      MECHANIMAL_DEFS['giga_golem'],
    ];
    const pickedRival = rivalPool[Math.floor(Math.random() * rivalPool.length)];
    setAiRivalDef(pickedRival);
    setAiPlayerHp(selectedCreature.stats.maxHp);
    setAiRivalHp(pickedRival.baseHp);
    setAiTurn('player');
    setIsMecardSetChanted(false);
    setAiLogs([
      `Rival Mechanist Kael steps into the arena with ${pickedRival.name} (${pickedRival.rarity} Tier)!`,
      `Chant "MECARD SET!" to unleash your battle action cards!`,
    ]);
    setAiWinner(null);
    setAnteDecisionMade(false);
    setMode('ai_battle');
    soundManager.playCreatureRoar(pickedRival.element);
  };

  // Handle AI Move
  const handleAiPlayerMove = (moveIndex: number) => {
    if (aiTurn !== 'player' || aiWinner !== null || !selectedDef) return;

    soundManager.playTamingBeam();
    const move = selectedDef.moves[moveIndex] || selectedDef.moves[0];
    const damage = move.power;
    const newRivalHp = Math.max(0, aiRivalHp - damage);
    setAiRivalHp(newRivalHp);

    setAiLogs((prev) => [
      `${selectedDef.name} used [Card #${move.cardIndex}: ${move.name}]! Dealt ${damage} damage!`,
      ...prev.slice(0, 4),
    ]);

    if (newRivalHp <= 0) {
      setAiWinner('player');
      soundManager.playLevelUp();
      return;
    }

    setAiTurn('rival');

    // Rival AI response after 900ms
    setTimeout(() => {
      const rivalMove = aiRivalDef.moves[Math.floor(Math.random() * aiRivalDef.moves.length)];
      const rivalDmg = Math.round(rivalMove.power * 0.85);
      soundManager.playCreatureRoar(aiRivalDef.element);

      setAiPlayerHp((prev) => {
        const nextHp = Math.max(0, prev - rivalDmg);
        if (nextHp <= 0) {
          setAiWinner('rival');
        }
        return nextHp;
      });

      setAiLogs((prev) => [
        `Rival ${aiRivalDef.name} used [Card #${rivalMove.cardIndex}: ${rivalMove.name}]! Dealt ${rivalDmg} damage to your companion!`,
        ...prev.slice(0, 4),
      ]);

      setAiTurn('player');
    }, 900);
  };

  // Handle AI Ante Claim
  const handleAiClaim = (claim: boolean) => {
    setAnteDecisionMade(true);
    if (aiWinner === 'player' && claim) {
      const prizeCreature: CapturedCreature = {
        id: `ante-rival-${Date.now()}`,
        creatureDefId: aiRivalDef.id,
        nickname: aiRivalDef.name + ' (Ante Trophy)',
        level: 8,
        bondLevel: 25,
        element: aiRivalDef.element,
        capturedAt: Date.now(),
        currentHp: aiRivalDef.baseHp,
        equippedMoveIndices: [0, 1, 2],
        stats: {
          hp: aiRivalDef.baseHp,
          maxHp: aiRivalDef.baseHp,
          attack: aiRivalDef.attack,
          defense: aiRivalDef.defense,
          speed: aiRivalDef.speed,
        },
      };
      onAnteWon(prizeCreature);
      soundManager.playCaptureSuccess();
    } else if (aiWinner === 'rival' && claim && selectedPlayerCard) {
      onAnteLost(selectedPlayerCard.id);
    }
  };

  const getElementBadge = (element?: string) => {
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

  const getRarityBadge = (rarity?: string) => {
    const colors: Record<string, string> = {
      Basic: 'bg-slate-800 text-slate-300 border-slate-600',
      Medium: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      Advanced: 'bg-blue-950 text-blue-400 border-blue-800',
      Legend: 'bg-purple-950 text-purple-400 border-purple-800',
      God: 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse',
    };
    const c = colors[rarity || 'Basic'] || colors.Basic;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${c}`}>
        {rarity || 'Basic'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 shadow-[0_0_60px_rgba(99,102,241,0.35)] flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800 shadow-inner">
              <Swords className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                2-Player High-Stakes Duel Arena
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 uppercase">
                  Ante Rule Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Chant &ldquo;MECARD SET!&rdquo; · 5 Cards (3 Active in Battle) · Winner can claim loser&apos;s Mechanimal!
              </p>
            </div>
          </div>

          {/* Duel Format Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
            {(['1v1', 'tag', '3v3', '4v4', '1v4'] as BattleFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setDuelFormat(fmt);
                  soundManager.playCardSelect();
                }}
                className={`px-2.5 py-1 rounded-lg uppercase transition cursor-pointer ${
                  duelFormat === fmt
                    ? 'bg-indigo-500 text-white shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === '1v4' ? '1v4 Raid' : fmt}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/80 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: Select Duel Type & Fighter */}
        {mode === 'select' && (
          <div className="flex flex-col gap-6">
            {/* Fighter Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                1. Select Your Duel Companion (From Captured Cards):
              </label>

              {playerCapturedCards.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  You have not captured any Mechanimals yet! Explore Gearfall Meadow, weaken a wild toy-car creature, and shout &ldquo;Taming On!&rdquo; to bond with your first companion.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {playerCapturedCards.map((card) => {
                    const c = card.capturedCreature;
                    if (!c) return null;
                    const def = MECHANIMAL_DEFS[c.creatureDefId];
                    const isSelected = card.id === selectedCardId;

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSelectedCardId(card.id);
                          soundManager.playCardSelect();
                        }}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between h-28 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-950/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            {getElementBadge(c.element)}
                            {c.nickname}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">Lv.{c.level}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          🚗 {def?.vehicleName || 'Vehicle'}
                        </span>
                        <div className="flex justify-between items-center text-[10px] font-mono mt-1 pt-1 border-t border-slate-800">
                          <span>HP: {c.stats.maxHp}</span>
                          {getRarityBadge(def?.rarity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Duel Play Formats */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                2. Choose Duel Format:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option A: Cross-Device Online Room */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/40 flex flex-col justify-between gap-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-600 flex items-center justify-center text-indigo-400 mb-2">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white">Cross-Device Duel</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Play from 2 different phones, tablets, or computers in real-time using a 4-digit room code!
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCreateOnlineRoom}
                      disabled={playerCapturedCards.length === 0}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow"
                    >
                      Host Duel (Create Code)
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Code..."
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        className="w-24 px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-mono font-bold text-xs text-white"
                      />
                      <button
                        onClick={handleJoinOnlineRoom}
                        disabled={playerCapturedCards.length === 0}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs cursor-pointer transition"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option B: Local Pass & Play */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950 border border-cyan-500/40 flex flex-col justify-between gap-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-600 flex items-center justify-center text-cyan-400 mb-2">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white">Pass &amp; Play Duel</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      2 players take turns on the same device screen! Winner can claim the defeated creature card.
                    </p>
                  </div>

                  <button
                    onClick={handleStartLocalBattle}
                    disabled={playerCapturedCards.length < 2}
                    className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow"
                  >
                    {playerCapturedCards.length < 2
                      ? 'Need 2+ Mechanimals'
                      : 'Start Pass & Play'}
                  </button>
                </div>

                {/* Option C: Solo AI Rival Mechanist */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/40 flex flex-col justify-between gap-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-600 flex items-center justify-center text-amber-400 mb-2">
                      <Bot className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white">Rival Mechanist Kael</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Instant single-player duel test against an AI rival! Defeat him to claim an Ante Trophy card!
                    </p>
                  </div>

                  <button
                    onClick={handleStartAiBattle}
                    disabled={playerCapturedCards.length === 0}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow"
                  >
                    Challenge Rival AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MECARD SET! Call Screen in Duels (if not yet chanted) */}
        {mode !== 'select' && !isMecardSetChanted && (
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-950 border-2 border-indigo-500/70 text-center gap-4 my-2">
            <h3 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-indigo-300">
              &ldquo;MECARD SET!&rdquo;
            </h3>
            <p className="text-xs text-slate-300 max-w-sm">
              Both duelists must chant the battle summon command to deploy their 5 attack cards onto the arena!
            </p>
            <button
              onClick={triggerDuelMecardSet}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg transition"
            >
              ⚡ Chant / Tap: &ldquo;MECARD SET!&rdquo;
            </button>
          </div>
        )}

        {/* MODE 2: Online Cross-Device Battle Room */}
        {mode === 'online_battle' && onlineRoom && isMecardSetChanted && (
          <div className="flex flex-col gap-4">
            {/* Room Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">Duel Room Code:</span>
                <span className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-mono text-lg font-black tracking-widest border border-indigo-700">
                  {activeRoomCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeRoomCode || '');
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
                  title="Copy room code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    onlineRoom.status === 'battling'
                      ? 'bg-emerald-950 text-emerald-400'
                      : onlineRoom.status === 'finished'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-indigo-950 text-indigo-400'
                  }`}
                >
                  {onlineRoom.status === 'waiting' ? 'Waiting for Player 2...' : onlineRoom.status}
                </span>
              </div>
            </div>

            {/* Waiting for Opponent Screen */}
            {onlineRoom.status === 'waiting' && (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/70 border border-slate-800 gap-4 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center" />
                <h3 className="text-lg font-black text-white">Waiting for Opponent to Join</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Give Room Code <strong className="text-indigo-400 font-mono text-sm">{activeRoomCode}</strong> to your opponent on their device. They will join this arena instantly!
                </p>
              </div>
            )}

            {/* Active Arena Battle */}
            {(onlineRoom.status === 'battling' || onlineRoom.status === 'finished') && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onlineRoom.players.map((p: any, idx: number) => {
                    const isMe = idx === myPlayerIndex;
                    const hpPct = Math.round((p.currentHp / (p.maxHp || 200)) * 100);

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
                          isMe
                            ? 'border-indigo-400 bg-slate-900/90'
                            : 'border-rose-400 bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {p.name} {isMe ? '(You)' : '(Opponent)'}
                          </span>
                          <span className="font-mono text-amber-400 text-[11px]">
                            {p.mechanimal?.nickname || 'Mechanimal'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono">
                          <span>HP</span>
                          <strong className={isMe ? 'text-indigo-300' : 'text-rose-400'}>
                            {p.currentHp} / {p.maxHp || 200}
                          </strong>
                        </div>

                        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isMe ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(0, hpPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Combat Log */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex flex-col gap-1 min-h-[70px] max-h-[120px] overflow-y-auto">
                  {onlineRoom.combatLog.map((log: string, idx: number) => (
                    <div key={idx} className={idx === onlineRoom.combatLog.length - 1 ? 'text-indigo-300 font-bold' : 'text-slate-400'}>
                      &gt; {log}
                    </div>
                  ))}
                </div>

                {/* Actions when Battling: Using 3 Active Cards out of 5 */}
                {onlineRoom.status === 'battling' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span>Equipped Battle Cards (Using 3 of 5):</span>
                      <span className={onlineRoom.currentTurn === myPlayerIndex ? 'text-emerald-400' : 'text-slate-400'}>
                        {onlineRoom.currentTurn === myPlayerIndex ? "Your Turn — Choose Action!" : "Opponent's Turn..."}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {activeThreeMoveIndices.map((moveIdx) => {
                        const m = selectedDef?.moves[moveIdx] || selectedDef?.moves[0];
                        if (!m) return null;
                        return (
                          <button
                            key={m.id || moveIdx}
                            disabled={onlineRoom.currentTurn !== myPlayerIndex}
                            onClick={() => handleSendOnlineMove(m)}
                            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-400 disabled:opacity-40 text-left transition cursor-pointer flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white text-xs">Card #{m.cardIndex}: {m.name}</span>
                              <span className="text-[10px] text-amber-400 font-mono">{m.power} PWR</span>
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{m.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* High-Stakes Ante Decision when Finished */}
                {onlineRoom.status === 'finished' && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-indigo-950/60 border-2 border-amber-500/80 flex flex-col items-center gap-3 text-center">
                    <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                    <h3 className="text-lg font-black text-white">
                      {onlineRoom.winnerIndex === myPlayerIndex ? '🏆 You Won the High-Stakes Duel!' : 'Defeated in Duel...'}
                    </h3>

                    {onlineRoom.winnerIndex === myPlayerIndex ? (
                      !anteDecisionMade ? (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-xs text-slate-300 max-w-md">
                            By the rules of the Mechanist Guild Ante: You have the right to claim your opponent&apos;s defeated Mechanimal (
                            <strong className="text-amber-400">
                              {onlineRoom.players[myPlayerIndex === 0 ? 1 : 0]?.mechanimal?.nickname || 'Defeated Beast'}
                            </strong>
                            ) into your permanent card deck, or spare it with honor!
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleOnlineClaimDecision(true)}
                              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition"
                            >
                              ⚡ Claim Opponent&apos;s Mechanimal!
                            </button>
                            <button
                              onClick={() => handleOnlineClaimDecision(false)}
                              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer transition"
                            >
                              🤝 Spare &amp; Return with Honor
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-400 font-mono">
                          Ante decision completed and deck synchronized!
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-slate-300">
                        Waiting for opponent&apos;s ante decision regarding your Mechanimal...
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setMode('select');
                        setActiveRoomCode(null);
                        setOnlineRoom(null);
                      }}
                      className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Return to Duel Menu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 3: Local Pass & Play Battle */}
        {mode === 'local_battle' && localP1Card && localP2Card && isMecardSetChanted && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* P1 */}
              <div
                className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
                  localCurrentTurn === 0 ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-cyan-300">Player 1</span>
                  <span className="font-mono text-amber-400">
                    {localP1Card.capturedCreature?.nickname}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{
                      width: `${(localP1Hp / (localP1Card.capturedCreature?.stats.maxHp || 200)) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono text-cyan-400">
                  HP: {localP1Hp}
                </div>
              </div>

              {/* P2 */}
              <div
                className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${
                  localCurrentTurn === 1 ? 'border-rose-400 bg-rose-950/20' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-300">Player 2</span>
                  <span className="font-mono text-amber-400">
                    {localP2Card.capturedCreature?.nickname}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-400 transition-all duration-300"
                    style={{
                      width: `${(localP2Hp / (localP2Card.capturedCreature?.stats.maxHp || 200)) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono text-rose-400">
                  HP: {localP2Hp}
                </div>
              </div>
            </div>

            {/* Combat Logs */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex flex-col gap-1 min-h-[60px]">
              {localLogs.map((l, i) => (
                <div key={i} className={i === 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                  &gt; {l}
                </div>
              ))}
            </div>

            {/* Turn Controls: Using 3 Active Cards out of 5 */}
            {localWinner === null ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  Player {localCurrentTurn + 1}&apos;s Turn — Choose Active Move:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeThreeMoveIndices.map((idx) => {
                    const activeDef = localCurrentTurn === 0
                      ? MECHANIMAL_DEFS[localP1Card.capturedCreature!.creatureDefId]
                      : MECHANIMAL_DEFS[localP2Card.capturedCreature!.creatureDefId];
                    const m = activeDef?.moves[idx] || activeDef?.moves[0];
                    if (!m) return null;
                    return (
                      <button
                        key={m.id || idx}
                        onClick={() => handleLocalMove(idx)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-left transition cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-xs">Card #{m.cardIndex}: {m.name}</span>
                          <span className="text-[10px] text-amber-400 font-mono">{m.power} PWR</span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{m.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/80 flex flex-col items-center gap-3 text-center">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                <h3 className="text-lg font-black text-white">
                  Player {localWinner + 1} Victorious!
                </h3>
                {!anteDecisionMade ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-300 max-w-md">
                      Player {localWinner + 1}: Do you want to claim the defeated Mechanimal into your collection?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleLocalClaim(true)}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition"
                      >
                        ⚡ Claim Defeated Mechanimal
                      </button>
                      <button
                        onClick={() => handleLocalClaim(false)}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer transition"
                      >
                        🤝 Spare &amp; Return
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-mono">
                    Ante settled! Collection updated.
                  </div>
                )}
                <button
                  onClick={() => setMode('select')}
                  className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Return to Duel Menu
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 4: Solo AI Rival Battle */}
        {mode === 'ai_battle' && selectedCreature && selectedDef && isMecardSetChanted && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Player */}
              <div className="p-4 rounded-2xl border-2 border-cyan-400 bg-cyan-950/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-cyan-300">Your Companion</span>
                  <span className="font-mono text-amber-400">{selectedCreature.nickname}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${(aiPlayerHp / selectedCreature.stats.maxHp) * 100}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono text-cyan-400">
                  HP: {aiPlayerHp} / {selectedCreature.stats.maxHp}
                </div>
              </div>

              {/* Rival */}
              <div className="p-4 rounded-2xl border-2 border-rose-400 bg-rose-950/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-300">Rival Kael</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-amber-400">{aiRivalDef.name}</span>
                    {getRarityBadge(aiRivalDef.rarity)}
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-400 transition-all duration-300"
                    style={{ width: `${(aiRivalHp / aiRivalDef.baseHp) * 100}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono text-rose-400">
                  HP: {aiRivalHp} / {aiRivalDef.baseHp}
                </div>
              </div>
            </div>

            {/* Combat Logs */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex flex-col gap-1 min-h-[60px]">
              {aiLogs.map((l, i) => (
                <div key={i} className={i === 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                  &gt; {l}
                </div>
              ))}
            </div>

            {/* Turn Controls: 3 Active Combat Moves out of 5 */}
            {aiWinner === null ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  {aiTurn === 'player' ? 'Your Turn — Choose Active Move (3 of 5):' : 'Rival Counter-Attacking...'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeThreeMoveIndices.map((idx) => {
                    const m = selectedDef.moves[idx] || selectedDef.moves[0];
                    return (
                      <button
                        key={m.id || idx}
                        disabled={aiTurn !== 'player'}
                        onClick={() => handleAiPlayerMove(idx)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 disabled:opacity-40 text-left transition cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-xs">Card #{m.cardIndex}: {m.name}</span>
                          <span className="text-[10px] text-amber-400 font-mono">{m.power} PWR</span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{m.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/80 flex flex-col items-center gap-3 text-center">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                <h3 className="text-lg font-black text-white">
                  {aiWinner === 'player' ? '🏆 You Defeated Rival Kael!' : 'Defeated by Rival Kael!'}
                </h3>
                {!anteDecisionMade ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-300 max-w-md">
                      {aiWinner === 'player'
                        ? `Claim Kael's ${aiRivalDef.name} (${aiRivalDef.rarity} Tier) as an Ante Trophy into your collection?`
                        : `Kael demands your ${selectedCreature.nickname} as ante!`}
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAiClaim(true)}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition"
                      >
                        {aiWinner === 'player' ? '⚡ Claim Ante Trophy Card!' : 'Surrender Mechanimal'}
                      </button>
                      <button
                        onClick={() => handleAiClaim(false)}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer transition"
                      >
                        🤝 Spare &amp; Leave
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-mono">
                    Ante settled! Collection synchronized.
                  </div>
                )}
                <button
                  onClick={() => setMode('select')}
                  className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Return to Duel Menu
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
