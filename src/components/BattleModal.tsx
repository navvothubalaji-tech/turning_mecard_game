import React, { useState, useEffect, useRef } from 'react';
import { Mecard, WorldCreatureInstance, BattleFormat, BattleMove } from '../types/game';
import { MECHANIMAL_DEFS } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import {
  Sparkles,
  Zap,
  Droplet,
  Flame,
  Wind,
  Mountain,
  Shield,
  Swords,
  CheckCircle,
  X,
  Mic,
  MicOff,
  Layers,
  ArrowRightLeft,
  Users,
} from 'lucide-react';

interface BattleModalProps {
  wildCreature: WorldCreatureInstance;
  playerMecard: Mecard;
  allPlayerCards?: Mecard[];
  emptyCards: Mecard[];
  onCaptureSuccess: (card: Mecard) => void;
  onFlee: () => void;
}

// Particle interface for 60fps dynamic visual effects canvas
interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'flame' | 'water' | 'sonic' | 'rock' | 'vortex' | 'lightning';
}

export const BattleModal: React.FC<BattleModalProps> = ({
  wildCreature,
  playerMecard,
  allPlayerCards = [],
  emptyCards,
  onCaptureSuccess,
  onFlee,
}) => {
  const vfxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<VfxParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Battle Format: 1v1, Tag, 3v3, 4v4, 1v4 Horde
  const [battleFormat, setBattleFormat] = useState<BattleFormat>('1v1');

  // Player team mechanimals (from captured cards or default starter)
  const capturedCards = allPlayerCards.filter((c) => c.isCaptured && c.capturedCreature);
  const playerTeam: Mecard[] = capturedCards.length > 0 ? capturedCards : [playerMecard];
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  const activeCard = playerTeam[activePlayerIndex] || playerMecard;
  const playerDef = activeCard.capturedCreature
    ? MECHANIMAL_DEFS[activeCard.capturedCreature.creatureDefId]
    : MECHANIMAL_DEFS['voltiger'];

  // Enemy team for multi-battle formats
  const enemyTeamDefs = [
    MECHANIMAL_DEFS[wildCreature.defId] || MECHANIMAL_DEFS['voltiger'],
    MECHANIMAL_DEFS['ironfang'],
    MECHANIMAL_DEFS['aquafin'],
    MECHANIMAL_DEFS['emberhorn'],
  ];
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(0);
  const currentEnemyDef = enemyTeamDefs[activeEnemyIndex] || enemyTeamDefs[0];

  // The 5 attack cards for the player's active Mechanimal (3 active in combat)
  const allFiveMoves: BattleMove[] = playerDef.moves;
  const [activeThreeIndices, setActiveThreeIndices] = useState<number[]>([0, 1, 2]);
  const [isCustomizingCards, setIsCustomizingCards] = useState(false);

  // Battle Phases: 'setup' ("Mecard Set!"), 'fight', 'taming', 'captured', 'defeat'
  const [battlePhase, setBattlePhase] = useState<'setup' | 'fight' | 'taming' | 'captured' | 'defeat'>('setup');

  // Cinematic Animation Cutscene Overlay State
  const [cutsceneState, setCutsceneState] = useState<{
    type: 'none' | 'mecard_set' | 'attack' | 'taming_vortex' | 'sealed';
    title?: string;
    subtitle?: string;
    move?: BattleMove;
    damage?: number;
    attacker?: 'player' | 'enemy';
    isSuperEffective?: boolean;
  }>({ type: 'none' });

  // Arena & Beast Animation states
  const [isArenaShaking, setIsArenaShaking] = useState(false);
  const [playerAnimState, setPlayerAnimState] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [enemyAnimState, setEnemyAnimState] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [floatingDamage, setFloatingDamage] = useState<{
    target: 'player' | 'enemy';
    val: number;
    text?: string;
  } | null>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [surgeProgress, setSurgeProgress] = useState(0);

  // HP state
  const [playerHp, setPlayerHp] = useState(activeCard.capturedCreature?.stats.maxHp || playerDef.baseHp);
  const playerMaxHp = activeCard.capturedCreature?.stats.maxHp || playerDef.baseHp;

  const [enemyHp, setEnemyHp] = useState(currentEnemyDef.baseHp);
  const enemyMaxHp = currentEnemyDef.baseHp;

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatLog, setCombatLog] = useState<string[]>([
    `Wild toy-car ${currentEnemyDef.vehicleName} speeds onto the field!`,
    `Awaiting opening command: Chant or Tap "MECARD SET!" to transform and deploy!`,
  ]);

  const enemyHpPct = (enemyHp / enemyMaxHp) * 100;
  const isWeakened = enemyHpPct <= 50;

  // Trigger Arena screenshake
  const triggerScreenShake = () => {
    setIsArenaShaking(true);
    setTimeout(() => setIsArenaShaking(false), 450);
  };

  // 60fps High-Impact Particle VFX Canvas Loop
  useEffect(() => {
    const canvas = vfxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'lightning' || p.type === 'flame' ? 12 : 6;

        if (p.type === 'lightning') {
          // Jagged electrical spark
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'sonic') {
          // Crescent shockwave line
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();
        } else if (p.type === 'vortex') {
          // Spiral vortex particle
          const angle = (p.maxLife - p.life) * 0.15;
          const dist = p.size * 3 * (p.life / p.maxLife);
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard circular energy spark / droplet / flame ember
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * (p.life / p.maxLife)), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Spawn elemental attack particles
  const spawnAttackParticles = (fromX: number, fromY: number, toX: number, toY: number, element: string) => {
    const count = 45;
    const colors: Record<string, string[]> = {
      electric: ['#facc15', '#38bdf8', '#ffffff', '#eab308'],
      hydro: ['#06b6d4', '#3b82f6', '#93c5fd', '#ffffff'],
      pyro: ['#ef4444', '#f97316', '#fbbf24', '#ffffff'],
      aero: ['#c084fc', '#38bdf8', '#e0e7ff', '#ffffff'],
      terra: ['#ca8a04', '#78350f', '#a16207', '#fef08a'],
    };
    const palette = colors[element] || colors.electric;

    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.7;
      const speed = 4 + Math.random() * 9;
      particlesRef.current.push({
        x: fromX + (Math.random() - 0.5) * 20,
        y: fromY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        life: 25 + Math.random() * 20,
        maxLife: 45,
        type: element === 'electric' ? 'lightning' : element === 'aero' ? 'sonic' : element === 'hydro' ? 'water' : 'flame',
      });
    }
  };

  // Spawn impact burst at target position
  const spawnImpactBurst = (x: number, y: number, element: string) => {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#ffffff' : element === 'electric' ? '#facc15' : element === 'hydro' ? '#38bdf8' : '#ef4444',
        alpha: 1,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        type: 'spark',
      });
    }
  };

  // Spawn capture vortex suction particles
  const spawnCaptureVortex = (targetX: number, targetY: number, cardX: number, cardY: number) => {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 60;
      particlesRef.current.push({
        x: targetX + Math.cos(angle) * r,
        y: targetY + Math.sin(angle) * r,
        vx: (cardX - targetX) * 0.05 + (Math.random() - 0.5) * 2,
        vy: (cardY - targetY) * 0.05 + (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#38bdf8' : '#fbbf24',
        alpha: 1,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        type: 'vortex',
      });
    }
  };

  // Initialize Speech Recognition for "Mecard Set!" and "Taming On!"
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript.toLowerCase();
        }

        if (
          battlePhase === 'setup' &&
          (text.includes('mecard set') ||
            text.includes('set of mecards') ||
            text.includes('set mecard') ||
            text.includes('set'))
        ) {
          triggerMecardSet();
        }

        if (
          battlePhase === 'taming' &&
          (text.includes('taming on') || text.includes('taming') || text.includes('tame'))
        ) {
          triggerCaptureSurge();
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
      setIsListening(false);
    }
  }, [battlePhase]);

  // "MECARD SET!" Opening Sequence Animation
  const triggerMecardSet = () => {
    soundManager.playCardEquip();
    soundManager.playTamingBeam();
    soundManager.playCreatureRoar(playerDef.element);

    setCutsceneState({
      type: 'mecard_set',
      title: 'MECARD SET!',
      subtitle: `${playerDef.vehicleName} & ${currentEnemyDef.vehicleName} Transform into Beast Mode!`,
    });

    triggerScreenShake();

    // Spawn transform burst particles
    const canvas = vfxCanvasRef.current;
    if (canvas) {
      spawnImpactBurst(canvas.width * 0.28, canvas.height * 0.45, playerDef.element);
      spawnImpactBurst(canvas.width * 0.72, canvas.height * 0.45, currentEnemyDef.element);
    }

    setCombatLog((prev) => [
      `⚡ "MECARD SET!" chanted! Cards deploy & Toy Cars transform into Beast Mode!`,
      ...prev.slice(0, 3),
    ]);

    setTimeout(() => {
      setCutsceneState({ type: 'none' });
      setBattlePhase('fight');
    }, 1800);
  };

  // Card slot customizer
  const toggleCardSlot = (idx: number) => {
    if (activeThreeIndices.includes(idx)) {
      if (activeThreeIndices.length <= 1) return;
      setActiveThreeIndices((prev) => prev.filter((i) => i !== idx));
    } else {
      if (activeThreeIndices.length >= 3) {
        setActiveThreeIndices((prev) => [prev[1], prev[2], idx]);
      } else {
        setActiveThreeIndices((prev) => [...prev, idx]);
      }
    }
    soundManager.playCardSelect();
  };

  // Tag Team Switch
  const handleTagSwitch = (newIndex: number) => {
    if (newIndex === activePlayerIndex || !playerTeam[newIndex]) return;
    setActivePlayerIndex(newIndex);
    const newCard = playerTeam[newIndex];
    const newDef = newCard.capturedCreature
      ? MECHANIMAL_DEFS[newCard.capturedCreature.creatureDefId]
      : playerDef;
    setPlayerHp(newCard.capturedCreature?.stats.maxHp || newDef.baseHp);

    soundManager.playCardEquip();
    soundManager.playCreatureRoar(newDef.element);

    setCombatLog((prev) => [
      `🔄 Tag Switch! Deployed ${newDef.name} into the arena!`,
      ...prev.slice(0, 4),
    ]);
  };

  // Full Attack Animation Sequence
  const handlePlayerMove = (moveIndex: number) => {
    if (!isPlayerTurn || battlePhase !== 'fight') return;

    const move = allFiveMoves[moveIndex] || allFiveMoves[0];
    soundManager.playTamingBeam();

    // Elemental multiplier
    let multiplier = 1.0;
    if (
      (playerDef.element === 'electric' && currentEnemyDef.element === 'hydro') ||
      (playerDef.element === 'hydro' && currentEnemyDef.element === 'pyro') ||
      (playerDef.element === 'pyro' && currentEnemyDef.element === 'aero') ||
      (playerDef.element === 'aero' && currentEnemyDef.element === 'terra') ||
      (playerDef.element === 'terra' && currentEnemyDef.element === 'electric')
    ) {
      multiplier = 1.45;
    }

    const damage = Math.round(move.power * multiplier);
    const newEnemyHp = Math.max(0, enemyHp - damage);

    // 1. Show cinematic Card Zoom Cut-in Banner
    setCutsceneState({
      type: 'attack',
      title: `CARD #${move.cardIndex}: ${move.name.toUpperCase()}!`,
      subtitle: `${move.power} Power · ${move.description}`,
      move,
      damage,
      attacker: 'player',
      isSuperEffective: multiplier > 1,
    });

    setPlayerAnimState('attack');

    // 2. Fire elemental projectile particles from player to enemy
    const canvas = vfxCanvasRef.current;
    if (canvas) {
      const fromX = canvas.width * 0.28;
      const fromY = canvas.height * 0.45;
      const toX = canvas.width * 0.72;
      const toY = canvas.height * 0.45;

      spawnAttackParticles(fromX, fromY, toX, toY, playerDef.element);

      // Impact timing
      setTimeout(() => {
        spawnImpactBurst(toX, toY, playerDef.element);
        triggerScreenShake();
        setEnemyAnimState('hit');
        soundManager.playCreatureRoar(playerDef.element);

        setFloatingDamage({
          target: 'enemy',
          val: damage,
          text: multiplier > 1 ? 'SUPER EFFECTIVE!' : undefined,
        });

        setEnemyHp(newEnemyHp);

        setTimeout(() => {
          setEnemyAnimState('idle');
          setPlayerAnimState('idle');
          setFloatingDamage(null);
        }, 800);
      }, 500);
    }

    setCombatLog((prev) => [
      `Used [Card #${move.cardIndex}: ${move.name}]! ${multiplier > 1 ? 'Super Effective! ' : ''}Dealt ${damage} damage!`,
      ...prev.slice(0, 4),
    ]);

    setIsPlayerTurn(false);

    // Close cutscene banner after 1.2s
    setTimeout(() => {
      setCutsceneState({ type: 'none' });
    }, 1200);

    // Enemy defeat check
    if (newEnemyHp <= 0) {
      const totalEnemies = battleFormat === '4v4' || battleFormat === '1v4' ? 4 : battleFormat === '3v3' ? 3 : 1;
      if (activeEnemyIndex + 1 < totalEnemies) {
        setTimeout(() => {
          const nextIdx = activeEnemyIndex + 1;
          setActiveEnemyIndex(nextIdx);
          const nextEnemy = enemyTeamDefs[nextIdx];
          setEnemyHp(nextEnemy.baseHp);
          soundManager.playCreatureRoar(nextEnemy.element);
          setCombatLog((prev) => [
            `💥 ${currentEnemyDef.name} knocked out! Next opponent ${nextEnemy.name} (${nextEnemy.rarity} Tier) enters!`,
            ...prev.slice(0, 4),
          ]);
          setIsPlayerTurn(true);
        }, 1400);
        return;
      }

      setCombatLog((prev) => [
        `🏆 Opponent weakened to critical! Throw empty Mecard & chant "TAMING ON!" to capture!`,
        ...prev.slice(0, 4),
      ]);
      return;
    }

    // Opponent counter-attack animation after 1.3s
    setTimeout(() => {
      if (battlePhase !== 'fight') return;
      const enemyMove = currentEnemyDef.moves[Math.floor(Math.random() * currentEnemyDef.moves.length)];
      const enemyDmg = Math.round(enemyMove.power * 0.75);

      setEnemyAnimState('attack');
      soundManager.playTamingBeam();

      // Show enemy card cut-in
      setCutsceneState({
        type: 'attack',
        title: `ENEMY [CARD #${enemyMove.cardIndex}: ${enemyMove.name.toUpperCase()}]!`,
        subtitle: `${enemyMove.power} Power Counter-Attack!`,
        move: enemyMove,
        damage: enemyDmg,
        attacker: 'enemy',
      });

      if (canvas) {
        const fromX = canvas.width * 0.72;
        const fromY = canvas.height * 0.45;
        const toX = canvas.width * 0.28;
        const toY = canvas.height * 0.45;

        spawnAttackParticles(fromX, fromY, toX, toY, currentEnemyDef.element);

        setTimeout(() => {
          spawnImpactBurst(toX, toY, currentEnemyDef.element);
          triggerScreenShake();
          setPlayerAnimState('hit');
          soundManager.playCreatureRoar(currentEnemyDef.element);

          setFloatingDamage({ target: 'player', val: enemyDmg });
          setPlayerHp((prev) => Math.max(0, prev - enemyDmg));

          setTimeout(() => {
            setPlayerAnimState('idle');
            setEnemyAnimState('idle');
            setFloatingDamage(null);
          }, 800);
        }, 500);
      }

      setCombatLog((prev) => [
        `Opponent used [Card #${enemyMove.cardIndex}: ${enemyMove.name}]! Dealt ${enemyDmg} damage to your companion!`,
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        setCutsceneState({ type: 'none' });
        setIsPlayerTurn(true);
      }, 1200);
    }, 1400);
  };

  // Launch Empty Card & Taming Sequence
  const handleDeployTaming = () => {
    setBattlePhase('taming');
    soundManager.playTamingBeam();
    soundManager.playCardEquip();

    setCutsceneState({
      type: 'taming_vortex',
      title: 'EMPTY MECARD THROWN!',
      subtitle: 'Conical Laser Grid Deployed! Chant or Tap "TAMING ON!"',
    });
  };

  // Finalize capture animation
  const triggerCaptureSurge = () => {
    soundManager.playTamingVoiceTrigger();
    soundManager.playCaptureSuccess();

    const canvas = vfxCanvasRef.current;
    if (canvas) {
      spawnCaptureVortex(canvas.width * 0.72, canvas.height * 0.45, canvas.width * 0.5, canvas.height * 0.25);
    }

    let p = 0;
    const interval = setInterval(() => {
      p += 0.08;
      if (p >= 1) {
        clearInterval(interval);
        setSurgeProgress(1);
        triggerScreenShake();

        setCutsceneState({
          type: 'sealed',
          title: 'TAMING ON — CARD SEALED!',
          subtitle: `${currentEnemyDef.name} absorbed into permanent Mecard collection!`,
        });

        setTimeout(() => {
          setBattlePhase('captured');
          const targetEmptyCard = emptyCards[0] || playerMecard;
          onCaptureSuccess(targetEmptyCard);
        }, 1400);
      } else {
        setSurgeProgress(p);
      }
    }, 50);
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
        {rarity || 'Basic'} Tier
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/92 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl bg-slate-900 border-2 border-cyan-500/80 rounded-3xl p-4 sm:p-6 shadow-[0_0_70px_rgba(56,189,248,0.35)] flex flex-col gap-3 text-white max-h-[95vh] overflow-y-auto ${
          isArenaShaking ? 'animate-arena-shake' : ''
        }`}
      >
        {/* Top Header & Multi-Battle Format Selector */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 shadow-inner">
              <Swords className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                Mecard Beast Battle Arena
                {getRarityBadge(currentEnemyDef.rarity)}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Chant &ldquo;MECARD SET!&rdquo; &rarr; 5 Cards (3 in Battle) &rarr; &ldquo;TAMING ON!&rdquo;
              </span>
            </div>
          </div>

          {/* Battle Format Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
            {(['1v1', 'tag', '3v3', '4v4', '1v4'] as BattleFormat[]).map((fmt) => (
              <button
                key={fmt}
                disabled={battlePhase !== 'setup' && battlePhase !== 'fight'}
                onClick={() => {
                  setBattleFormat(fmt);
                  soundManager.playCardSelect();
                }}
                className={`px-2.5 py-1 rounded-lg uppercase transition cursor-pointer ${
                  battleFormat === fmt
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === '1v4' ? '1v4 Horde' : fmt}
              </button>
            ))}
          </div>

          <button
            onClick={onFlee}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            Flee [Esc]
          </button>
        </div>

        {/* PHASE 1: "MECARD SET!" Opening Call */}
        {battlePhase === 'setup' && (
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-cyan-950/40 via-slate-950 to-slate-900 border-2 border-cyan-500/60 shadow-[0_0_40px_rgba(56,189,248,0.25)] gap-4 text-center my-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-xl animate-pulse">
                <Layers className="w-10 h-10" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                !
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                Official Battle Summon Call
              </span>
              <h3 className="text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-300">
                &ldquo;MECARD SET!&rdquo;
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Both opponents shout the summon command. The Mecards shoot onto the battle grid and the die-cast toy cars transform into mechanical beasts!
              </p>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>Microphone Active · Speak &ldquo;Mecard Set!&rdquo; or &ldquo;Set of Mecards!&rdquo;</span>
              </div>
            )}

            <button
              onClick={triggerMecardSet}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest cursor-pointer shadow-[0_0_25px_rgba(56,189,248,0.4)] transition transform hover:scale-105"
            >
              ⚡ Chant / Tap: &ldquo;MECARD SET!&rdquo;
            </button>
          </div>
        )}

        {/* PHASE 2: Animated Battle Arena (Combat & Taming) */}
        {(battlePhase === 'fight' || battlePhase === 'taming' || battlePhase === 'captured') && (
          <div className="flex flex-col gap-3">
            {/* Tag Team Selector Bar if Tag or Multi format */}
            {(battleFormat === 'tag' || battleFormat === '3v3' || battleFormat === '4v4') && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Tag Team Switch Bench:
                </span>
                <div className="flex gap-2">
                  {playerTeam.map((card, idx) => {
                    const c = card.capturedCreature;
                    if (!c) return null;
                    const def = MECHANIMAL_DEFS[c.creatureDefId];
                    const isActive = idx === activePlayerIndex;

                    return (
                      <button
                        key={card.id || idx}
                        onClick={() => handleTagSwitch(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {getElementIcon(c.element)}
                        <span>{def?.name || c.nickname}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CINEMATIC BATTLE STAGE with 2D Canvas VFX Overlay */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 overflow-hidden min-h-[220px] p-4 flex flex-col justify-between shadow-2xl">
              {/* 60fps Dynamic Particle Canvas Overlay */}
              <canvas
                ref={vfxCanvasRef}
                width={800}
                height={260}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {/* Cinematic Action Cutscene Overlay (Card Zoom & Attack Name Banner) */}
              {cutsceneState.type !== 'none' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 p-4 text-center">
                  <div className="animate-card-zoom flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-2 border-cyan-400 shadow-[0_0_40px_rgba(56,189,248,0.5)] max-w-md">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                      {cutsceneState.attacker === 'enemy' ? 'Opponent Attack Action' : 'Action Card Activated'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-white">
                      {cutsceneState.title}
                    </h3>
                    <p className="text-xs text-slate-300">{cutsceneState.subtitle}</p>
                    {cutsceneState.isSuperEffective && (
                      <span className="px-3 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 text-xs font-black animate-bounce">
                        ELEMENTAL SUPER EFFECTIVE! 💥
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Floating Damage Text */}
              {floatingDamage && (
                <div
                  className={`absolute z-30 font-black text-2xl sm:text-3xl font-mono tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-bounce ${
                    floatingDamage.target === 'enemy'
                      ? 'top-10 right-12 text-rose-400'
                      : 'top-10 left-12 text-amber-400'
                  }`}
                >
                  -{floatingDamage.val} HP
                  {floatingDamage.text && (
                    <div className="text-xs text-yellow-300 tracking-normal">{floatingDamage.text}</div>
                  )}
                </div>
              )}

              {/* Two Combatants Stage (Left: Player Companion, Right: Opponent Beast) */}
              <div className="grid grid-cols-2 gap-4 items-center z-0 w-full my-auto">
                {/* Left: Player Companion */}
                <div
                  className={`flex flex-col items-center gap-2 transition-transform duration-300 ${
                    playerAnimState === 'attack'
                      ? 'translate-x-8 scale-110'
                      : playerAnimState === 'hit'
                      ? 'animate-creature-hit'
                      : ''
                  }`}
                >
                  {/* Holographic Beast Avatar Visual */}
                  <div
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl"
                    style={{
                      borderColor: playerDef.color,
                      background: `radial-gradient(circle, ${playerDef.color}25 0%, #0f172a 80%)`,
                    }}
                  >
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-white/20 mb-1">
                      {getElementIcon(playerDef.element)}
                    </div>
                    <span className="text-xs font-black text-white line-clamp-1">{playerDef.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono">Lv.5</span>
                  </div>

                  {/* Name & HP */}
                  <div className="w-full max-w-[170px] flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-cyan-300">{playerDef.name}</span>
                      <span className="text-emerald-400">{playerHp}/{playerMaxHp}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Opponent Beast */}
                <div
                  className={`flex flex-col items-center gap-2 transition-transform duration-300 ${
                    enemyAnimState === 'attack'
                      ? '-translate-x-8 scale-110'
                      : enemyAnimState === 'hit'
                      ? 'animate-creature-hit'
                      : ''
                  }`}
                >
                  {/* Holographic Beast Avatar Visual */}
                  <div
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl"
                    style={{
                      borderColor: currentEnemyDef.color,
                      background: `radial-gradient(circle, ${currentEnemyDef.color}25 0%, #0f172a 80%)`,
                    }}
                  >
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-white/20 mb-1">
                      {getElementIcon(currentEnemyDef.element)}
                    </div>
                    <span className="text-xs font-black text-white line-clamp-1">{currentEnemyDef.name}</span>
                    <span className="text-[10px] text-rose-300 font-mono">{currentEnemyDef.rarity}</span>
                  </div>

                  {/* Name & HP */}
                  <div className="w-full max-w-[170px] flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-rose-300">{currentEnemyDef.name}</span>
                      <span className="text-rose-400">{enemyHp}/{enemyMaxHp}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isWeakened ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-red-400'
                        }`}
                        style={{ width: `${enemyHpPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Log */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex flex-col gap-1 min-h-[50px] max-h-[75px] overflow-y-auto">
              {combatLog.map((log, idx) => (
                <div key={idx} className={idx === 0 ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                  &gt; {log}
                </div>
              ))}
            </div>

            {/* The 5 Attack Cards System (Only 3 Active in Battle) */}
            {battlePhase === 'fight' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Equipped Battle Cards (Using 3 of 5 Attack Cards):
                  </span>
                  <button
                    onClick={() => setIsCustomizingCards((prev) => !prev)}
                    className="text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    {isCustomizingCards ? 'Close Card Selector' : 'Change 3 Active Cards'}
                  </button>
                </div>

                {/* Card Customizer Drawer: All 5 attack cards */}
                {isCustomizingCards && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <span className="text-[11px] font-mono text-amber-300">
                      Click any card to equip/swap into your 3 active battle slots:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {allFiveMoves.map((m, idx) => {
                        const isEquipped = activeThreeIndices.includes(idx);
                        return (
                          <div
                            key={m.id || idx}
                            onClick={() => toggleCardSlot(idx)}
                            className={`p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                              isEquipped
                                ? 'bg-cyan-950/60 border-cyan-400 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                              <span>Card #{m.cardIndex}</span>
                              <span className={isEquipped ? 'text-emerald-400' : 'text-slate-500'}>
                                {isEquipped ? 'ACTIVE' : 'RESERVE'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-white mt-1">{m.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5">{m.power} PWR</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* The 3 Active Battle Cards in Action Slots */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeThreeIndices.map((moveIdx, slotIdx) => {
                    const m = allFiveMoves[moveIdx] || allFiveMoves[0];
                    return (
                      <button
                        key={m.id || slotIdx}
                        disabled={!isPlayerTurn}
                        onClick={() => handlePlayerMove(moveIdx)}
                        className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 disabled:opacity-50 text-left transition cursor-pointer flex flex-col justify-between shadow-lg"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Slot {slotIdx + 1} (Card #{m.cardIndex})
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400">{m.power} PWR</span>
                        </div>
                        <span className="font-bold text-white text-xs mt-1">{m.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">{m.description}</span>
                        {m.specialEffect && (
                          <span className="mt-1 text-[9px] font-mono uppercase font-bold text-indigo-400">
                            Effect: {m.specialEffect}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Deploy Empty Card & Tame Button */}
                <button
                  onClick={handleDeployTaming}
                  className={`w-full py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-lg ${
                    isWeakened
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.5)] animate-bounce'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {isWeakened
                      ? '⚡ Throw Empty Mecard & Tame Now! (High Chance)'
                      : 'Throw Empty Mecard & Tame (Weaken HP First for Best Chance)'}
                  </span>
                </button>
              </div>
            )}

            {/* PHASE: Taming Trigger */}
            {battlePhase === 'taming' && (
              <div className="flex flex-col items-center gap-3 py-4 p-5 rounded-2xl bg-slate-950 border border-cyan-500/60">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                  <span>Empty Mecard Deployed! Speak or Tap:</span>
                </div>

                <div className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-300">
                  &ldquo;TAMING ON!&rdquo;
                </div>

                {surgeProgress > 0 && (
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400"
                      style={{ width: `${surgeProgress * 100}%` }}
                    />
                  </div>
                )}

                <button
                  onClick={triggerCaptureSurge}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg transition"
                >
                  Speak or Tap: &ldquo;Taming On!&rdquo;
                </button>
              </div>
            )}

            {/* PHASE: Capture Success */}
            {battlePhase === 'captured' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle className="w-9 h-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white">{currentEnemyDef.name} Successfully Tamed!</h3>
                <p className="text-xs text-slate-300">
                  Captured into your unlimited Mecard collection! Comes with its 5 attack cards ready for combat.
                </p>
                <button
                  onClick={onFlee}
                  className="mt-2 py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition"
                >
                  Return to Meadow
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
