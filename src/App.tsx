/**
 * WILDBOND: ECHOES OF GEARFALL
 * Main Application Root & Game Shell
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { configureRenderer, isSoftwareGl } from './game/threeUtils';
import { buildGearfallMeadow } from './game/worldScene';
import { GameEngine } from './game/gameEngine';
import { Mecard, PlayerStats, Quest, WorldCreatureInstance, SecretLocation, CapturedCreature } from './types/game';
import { createInitialCards, INITIAL_QUESTS } from './data/creatures';
import { soundManager } from './audio/soundManager';

import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { TamingModal } from './components/TamingModal';
import { BattleModal } from './components/BattleModal';
import { DuelModal } from './components/DuelModal';
import { InventoryModal } from './components/InventoryModal';
import { DialogueModal } from './components/DialogueModal';
import { PauseModal } from './components/PauseModal';
import { MobileControls } from './components/MobileControls';

const SAVE_KEY = 'wildbond_save_v1';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game Shell State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');
  const [hasSaveData, setHasSaveData] = useState(false);

  // Cards & Player State
  const [cards, setCards] = useState<Mecard[]>(createInitialCards());
  const [selectedEquippedIndex, setSelectedEquippedIndex] = useState<number>(0);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 1,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    rank: 'Gearfall Novice',
    inventoryScraps: 0,
    inventoryShards: 0,
    inventoryBerries: 0,
    totalCaught: 0,
  });

  // World Interactions
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [activeQuestIndex, setActiveQuestIndex] = useState<number>(0);
  const [nearbyCreature, setNearbyCreature] = useState<WorldCreatureInstance | null>(null);
  const [isNearTorren, setIsNearTorren] = useState(false);
  const [nearbyLocation, setNearbyLocation] = useState<SecretLocation | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, z: 0 });
  const [creaturesList, setCreaturesList] = useState<WorldCreatureInstance[]>([]);

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [isTamingOpen, setIsTamingOpen] = useState(false);
  const [tamingTargetCreature, setTamingTargetCreature] = useState<WorldCreatureInstance | null>(null);
  const [tamingSelectedCard, setTamingSelectedCard] = useState<Mecard | null>(null);

  // Battle & Duel Modals
  const [isBattleOpen, setIsBattleOpen] = useState(false);
  const [battleTargetCreature, setBattleTargetCreature] = useState<WorldCreatureInstance | null>(null);
  const [isDuelOpen, setIsDuelOpen] = useState(false);

  // Audio & Toast
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Check saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        setHasSaveData(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save game progress to localStorage
  const saveGame = useCallback(
    (currentCards: Mecard[], currentStats: PlayerStats, currentQuests: Quest[]) => {
      try {
        const payload = {
          version: 1,
          cards: currentCards,
          playerStats: currentStats,
          quests: currentQuests,
          activeQuestIndex,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    },
    [activeQuestIndex]
  );

  // Initialize Three.js WebGL Scene & Game Loop
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    configureRenderer(renderer);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.2, 300);
    const world = buildGearfallMeadow(renderer);

    // Initial Engine instance
    const engine = new GameEngine(renderer, camera, world, cards, {
      onNearbyCreatureChange: (creature) => {
        setNearbyCreature(creature);
      },
      onNearbyNpcChange: (isNear) => {
        setIsNearTorren(isNear);
      },
      onNearbyLocationChange: (loc) => {
        setNearbyLocation(loc);
      },
      onBattleRequested: (creature) => {
        setBattleTargetCreature(creature);
        setIsBattleOpen(true);
      },
      onTamingStarted: (creature, card) => {
        setTamingTargetCreature(creature);
        setTamingSelectedCard(card);
        setIsTamingOpen(true);
      },
      onCaptureCompleted: (capturedCard, _creatureDefId) => {
        setCards((prev) => {
          const updated = prev.map((c) => (c.id === capturedCard.id ? capturedCard : c));
          saveGame(updated, engine.playerStats, quests);
          return updated;
        });

        // Advance Quest 2 or 3
        setQuests((prev) => {
          const qList = [...prev];
          if (qList[1] && !qList[1].completed) {
            qList[1].currentCount += 1;
            qList[1].completed = true;
            showToast('Quest Complete: The First Wildbond!');
          }
          if (qList[2]) {
            const capturedTotal = engine.cards.filter((c) => c.isCaptured).length;
            qList[2].currentCount = capturedTotal;
            if (capturedTotal >= 3) {
              qList[2].completed = true;
              showToast('Legendary Feat: Master Mechanist Crest unlocked!');
            }
          }
          return qList;
        });

        showToast(`Bonded with ${capturedCard.capturedCreature?.nickname}! Card synchronized.`);
      },
      onItemCollected: (_type, name) => {
        showToast(`Collected: ${name}`);
      },
      onStatsUpdate: (stats) => {
        setPlayerStats({ ...stats });
      },
      onCardsUpdate: (updatedCards) => {
        setCards([...updatedCards]);
        saveGame(updatedCards, engine.playerStats, quests);
      },
    });

    engineRef.current = engine;
    setCreaturesList(engine.creatures);

    // Continuous 60fps Game Loop
    let frameId = 0;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      engine.update(dt);
      renderer.render(world.scene, camera);

      // Periodic HUD sync
      setPlayerPos({ x: engine.playerPos.x, y: engine.playerPos.y, z: engine.playerPos.z });

      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Escape') {
        if (isDuelOpen) {
          setIsDuelOpen(false);
          return;
        }
        if (isBattleOpen) {
          setIsBattleOpen(false);
          return;
        }
        if (isInventoryOpen) {
          setIsInventoryOpen(false);
          return;
        }
        if (isDialogueOpen) {
          setIsDialogueOpen(false);
          return;
        }
        if (isTamingOpen) {
          setIsTamingOpen(false);
          engine.cancelTaming();
          return;
        }
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
        return;
      }

      if (gameState !== 'playing') return;

      // Open Duel Arena [B]
      if (e.code === 'KeyB') {
        setIsDuelOpen((prev) => !prev);
        soundManager.playCardSelect();
        return;
      }

      // Open Inventory [I]
      if (e.code === 'KeyI') {
        setIsInventoryOpen((prev) => !prev);
        soundManager.playCardSelect();
        return;
      }

      // Interaction [E]
      if (e.code === 'KeyE') {
        if (isNearTorren) {
          setIsDialogueOpen(true);
        } else if (nearbyCreature && !nearbyCreature.isCaptured) {
          handleOpenBattle();
        }
        return;
      }

      // Card Quick Select Hotkeys [1, 2, 3]
      if (e.code === 'Digit1') {
        setSelectedEquippedIndex(0);
        soundManager.playCardSelect();
      } else if (e.code === 'Digit2') {
        setSelectedEquippedIndex(1);
        soundManager.playCardSelect();
      } else if (e.code === 'Digit3') {
        setSelectedEquippedIndex(2);
        soundManager.playCardSelect();
      }

      engine.keys[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (engine) {
        engine.keys[e.code] = false;
      }
    };

    const handleBlur = () => {
      const engine = engineRef.current;
      if (engine) {
        engine.keys = {};
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, isInventoryOpen, isDialogueOpen, isTamingOpen, isBattleOpen, isDuelOpen, isNearTorren, nearbyCreature]);

  // Mouse camera orbit listener
  useEffect(() => {
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;
      isMouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const engine = engineRef.current;
      if (engine) {
        engine.handleMouseMove(dx, dy);
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Start Adventure
  const handleStartAdventure = () => {
    setGameState('playing');
    soundManager.startAmbient();
    soundManager.playCardEquip();
    showToast('Entered Gearfall Meadow. Explore and discover wild mechanimals!');
  };

  // Continue Journey from Saved State
  const handleContinueJourney = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.cards) {
          setCards(data.cards);
          if (engineRef.current) {
            engineRef.current.cards = data.cards;
            data.cards.forEach((c: Mecard) => {
              if (c.isCaptured && c.capturedCreature) {
                const wc = engineRef.current?.creatures.find(
                  (cr) => cr.defId === c.capturedCreature?.creatureDefId
                );
                if (wc) wc.isCaptured = true;
              }
            });
          }
        }
        if (data.playerStats) {
          setPlayerStats(data.playerStats);
          if (engineRef.current) engineRef.current.playerStats = data.playerStats;
        }
        if (data.quests) {
          setQuests(data.quests);
        }
      }
    } catch {
      // ignore
    }
    setGameState('playing');
    soundManager.startAmbient();
    soundManager.playCardEquip();
    showToast('Welcome back to Gearfall Meadow!');
  };

  // Reset Save Data
  const handleResetSave = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
    const freshCards = createInitialCards();
    setCards(freshCards);
    setQuests(INITIAL_QUESTS);
    setHasSaveData(false);
    if (engineRef.current) {
      engineRef.current.cards = freshCards;
      engineRef.current.creatures.forEach((c) => {
        c.isCaptured = false;
        c.state = 'patrol';
      });
    }
    setGameState('playing');
    showToast('Save data reset. All initial cards replenished.');
  };

  // Initiate Taming prompt
  const handleOpenTaming = () => {
    if (!nearbyCreature || nearbyCreature.isCaptured) return;
    const engine = engineRef.current;
    if (!engine) return;

    const equipped = cards.filter((c) => c.isEquipped);
    let chosenCard = equipped[selectedEquippedIndex];
    if (!chosenCard || chosenCard.isCaptured) {
      chosenCard = equipped.find((c) => !c.isCaptured)!;
    }

    if (!chosenCard) {
      showToast('No empty cards equipped in active slots! Open Deck [I] to equip a spare empty card.');
      return;
    }

    engine.startTaming(nearbyCreature, chosenCard);
  };

  // Initiate Beast Battle to Weaken
  const handleOpenBattle = () => {
    if (!nearbyCreature || nearbyCreature.isCaptured) return;
    setBattleTargetCreature(nearbyCreature);
    setIsBattleOpen(true);
  };

  // Swap cards between slots
  const handleSwapCards = (slotA: number, slotB: number) => {
    const engine = engineRef.current;
    if (engine) {
      engine.swapCards(slotA, slotB);
    }
  };

  // Handle Ante Win in 2-Player Duel
  const handleAnteWon = (claimedCreature: CapturedCreature) => {
    const newCard: Mecard = {
      id: `mecard-ante-${Date.now()}`,
      slotIndex: cards.length,
      isEquipped: false,
      isCaptured: true,
      capturedCreature: claimedCreature,
    };

    setCards((prev) => {
      const next = [...prev, newCard];
      if (engineRef.current) engineRef.current.cards = next;
      saveGame(next, playerStats, quests);
      return next;
    });

    showToast(`Ante Claimed! ${claimedCreature.nickname} added to your permanent vault!`);
  };

  // Handle Ante Loss in 2-Player Duel
  const handleAnteLost = (lostCardId: string) => {
    setCards((prev) => {
      const next = prev.map((c) => {
        if (c.id === lostCardId) {
          return {
            ...c,
            isCaptured: false,
            capturedCreature: undefined,
          };
        }
        return c;
      });
      if (engineRef.current) engineRef.current.cards = next;
      saveGame(next, playerStats, quests);
      return next;
    });

    showToast(`Ante Forfeit: Defeated Mechanimal surrendered to duel opponent.`);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const emptyCount = cards.filter((c) => !c.isCaptured).length;
  const capturedCount = cards.filter((c) => c.isCaptured).length;

  const equippedCards = [0, 1, 2].map((slotIdx) => cards.find((c) => c.slotIndex === slotIdx));
  const activeCompanionCard = equippedCards.find((c) => c?.isCaptured) || cards.find((c) => c.isCaptured) || cards[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartAdventure}
          onContinue={handleContinueJourney}
          hasSaveData={hasSaveData}
        />
      )}

      {/* In-Game Heads-Up Display */}
      {gameState === 'playing' && (
        <>
          <GameHUD
            playerStats={playerStats}
            cards={cards}
            selectedEquippedIndex={selectedEquippedIndex}
            onSelectEquippedIndex={setSelectedEquippedIndex}
            activeQuest={quests[activeQuestIndex] || null}
            nearbyCreature={nearbyCreature}
            isNearTorren={isNearTorren}
            nearbyLocation={nearbyLocation}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenDialogue={() => setIsDialogueOpen(true)}
            onStartTamingPrompt={handleOpenTaming}
            onStartBattlePrompt={handleOpenBattle}
            onOpenDuel={() => setIsDuelOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            playerPos={playerPos}
            creatures={creaturesList}
          />

          {/* Mobile On-Screen Controls */}
          <MobileControls
            onMove={(x, y) => {
              if (engineRef.current) engineRef.current.setTouchMove(x, y);
            }}
            onJump={() => {
              if (engineRef.current) engineRef.current.keys['Space'] = true;
              setTimeout(() => {
                if (engineRef.current) engineRef.current.keys['Space'] = false;
              }, 120);
            }}
            onInteract={() => {
              if (isNearTorren) setIsDialogueOpen(true);
              else if (nearbyCreature) handleOpenBattle();
            }}
            hasNearbyInteraction={isNearTorren || (!!nearbyCreature && !nearbyCreature.isCaptured)}
          />
        </>
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleResetSave}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          cardCount={{ empty: emptyCount, captured: capturedCount }}
        />
      )}

      {/* Turn-Based Battle Modal (Weaken HP to Capture) */}
      {isBattleOpen && battleTargetCreature && (
        <BattleModal
          wildCreature={battleTargetCreature}
          playerMecard={activeCompanionCard}
          allPlayerCards={cards}
          emptyCards={cards.filter((c) => !c.isCaptured)}
          onCaptureSuccess={(_card) => {
            const engine = engineRef.current;
            if (engine) {
              const targetEmptyCard = cards.find((c) => !c.isCaptured) || cards[0];
              engine.activeTamingCreature = battleTargetCreature;
              engine.activeTamingCard = targetEmptyCard;
              engine.completeCapture();
            }
            setIsBattleOpen(false);
          }}
          onFlee={() => setIsBattleOpen(false)}
        />
      )}

      {/* 2-Player Multi-Device & Ante Duel Modal */}
      {isDuelOpen && (
        <DuelModal
          playerCapturedCards={cards.filter((c) => c.isCaptured)}
          onAnteWon={handleAnteWon}
          onAnteLost={handleAnteLost}
          onClose={() => setIsDuelOpen(false)}
        />
      )}

      {/* Taming Sequence Modal (Direct Deploy) */}
      {isTamingOpen && tamingTargetCreature && tamingSelectedCard && (
        <TamingModal
          creature={tamingTargetCreature}
          selectedCard={tamingSelectedCard}
          availableEmptyCards={cards.filter((c) => c.isEquipped && !c.isCaptured)}
          onSelectCard={(card) => {
            setTamingSelectedCard(card);
            if (engineRef.current) {
              engineRef.current.activeTamingCard = card;
            }
          }}
          onConfirmCapture={() => {
            if (engineRef.current) {
              engineRef.current.completeCapture();
            }
          }}
          onCancel={() => {
            setIsTamingOpen(false);
            if (engineRef.current) {
              engineRef.current.cancelTaming();
            }
          }}
        />
      )}

      {/* Unlimited Mecard Deck & Inventory Modal */}
      {isInventoryOpen && (
        <InventoryModal
          cards={cards}
          playerStats={playerStats}
          onSwapCards={handleSwapCards}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}

      {/* Chief Torren Dialogue Modal */}
      {isDialogueOpen && (
        <DialogueModal
          onClose={() => setIsDialogueOpen(false)}
          onAdvanceQuest={() => {
            setQuests((prev) => {
              const qList = [...prev];
              if (qList[0] && !qList[0].completed) {
                qList[0].currentCount = 1;
                qList[0].completed = true;
                setActiveQuestIndex(1);
                showToast('Quest Complete: Echoes of the Meadow! Next: The First Wildbond.');
              }
              return qList;
            });
          }}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 border border-cyan-400 text-cyan-300 text-xs font-mono px-4 py-2 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.35)] select-none pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
