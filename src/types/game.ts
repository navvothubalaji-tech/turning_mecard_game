/**
 * Game data structures and types for Wildbond: Echoes of Gearfall
 * Supports unlimited Mechanimal collection, toy-car transformations,
 * 5 attack battle cards per creature (with 3 active in combat),
 * "Mecard Set!" opening call, tiered rarities (Basic, Medium, Advanced, Legend, God),
 * and multi-team battle formats (1v1, Tag Team, 3v3, 4v4, 1v4 Horde).
 */

export type ElementType = 'electric' | 'hydro' | 'pyro' | 'aero' | 'terra';

export type RarityTier = 'Basic' | 'Medium' | 'Advanced' | 'Legend' | 'God';

export type BattleFormat = '1v1' | 'tag' | '3v3' | '4v4' | '1v4';

export interface BattleMove {
  id: string;
  name: string;
  type: ElementType | 'normal';
  power: number;
  accuracy: number;
  description: string;
  energyCost: number;
  cardIndex: number; // 1 to 5 (Each Mechanimal possesses 5 attack cards)
  specialEffect?: 'stun' | 'shield' | 'drain' | 'burn' | 'surge';
}

export interface MechanimalDef {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  rarity: RarityTier; // Basic, Medium, Advanced, Legend, God
  baseHp: number;
  attack: number;
  defense: number;
  speed: number;
  personality: string;
  captureDifficulty: number; // 1 to 5
  description: string;
  signatureMove: string;
  vehicleName: string;
  vehicleType: string;
  color: string;
  accentColor: string;
  habitat: string;
  isLegendary?: boolean;
  requiredCapturesToUnlock?: number;
  secretLocationId?: string;
  moves: BattleMove[]; // Exactly 5 attack cards
}

export interface CapturedCreature {
  id: string;
  creatureDefId: string;
  nickname: string;
  level: number;
  bondLevel: number;
  element: ElementType;
  capturedAt: number;
  currentHp: number;
  equippedMoveIndices: number[]; // The 3 active cards chosen from the 5 (e.g. [0, 1, 2])
  stats: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
  };
}

export interface Mecard {
  id: string; // unique card id
  slotIndex: number; // 0, 1, 2 = active equipped battle slots; 3+ = reserve vault cards
  isEquipped: boolean;
  isCaptured: boolean;
  capturedCreature?: CapturedCreature;
}

export interface SecretLocation {
  id: string;
  name: string;
  type: 'cave' | 'building' | 'sanctum';
  description: string;
  x: number;
  z: number;
  requiredCaptures: number;
  isUnlocked: boolean;
  legendaryDefId: string;
}

export interface WorldCreatureInstance {
  id: string;
  defId: string;
  name: string;
  x: number;
  z: number;
  y: number;
  rotY: number;
  element: ElementType;
  isCaptured: boolean;
  isTaming: boolean;
  tameProgress: number; // 0 to 1
  patrolCenter: { x: number; z: number };
  patrolRadius: number;
  state: 'idle' | 'patrol' | 'alert' | 'taming' | 'captured';
  stateTimer: number;
  mode: 'car' | 'beast';
  isLegendary?: boolean;
  rarity?: RarityTier;
  currentHp?: number;
  maxHp?: number;
}

export interface CollectibleItem {
  id: string;
  type: 'gear_scrap' | 'aether_shard' | 'clockwork_berry';
  name: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardText: string;
}

export interface PlayerStats {
  level: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  rank: string;
  inventoryScraps: number;
  inventoryShards: number;
  inventoryBerries: number;
  totalCaught: number;
}

export interface SavedGameState {
  version: number;
  cards: Mecard[];
  playerStats: PlayerStats;
  playerPosition: { x: number; y: number; z: number };
  playerRotY: number;
  capturedCreatureIds: string[];
  collectedItemIds: string[];
  activeQuestIndex: number;
  quests: Quest[];
  unlockedLocationIds: string[];
}
