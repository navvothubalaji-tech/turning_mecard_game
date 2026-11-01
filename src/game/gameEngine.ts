/**
 * Wildbond: Echoes of Gearfall — Game Engine
 * Manages player controls, camera orbiting, creature AI & animations,
 * collision detection, proximity triggers, and taming state machine.
 */

import * as THREE from 'three';
import {
  Mecard,
  PlayerStats,
  WorldCreatureInstance,
  CollectibleItem,
  CapturedCreature,
  SecretLocation,
} from '../types/game';
import { MECHANIMAL_DEFS, SECRET_LOCATIONS, createNewEmptyCard } from '../data/creatures';
import { soundManager } from '../audio/soundManager';
import { getMeadowHeight } from './threeUtils';
import {
  createPlayerModel,
  createVoltigerModel,
  createAquafinModel,
  createEmberhornModel,
  createDracoIgnisModel,
  createLeviathanModel,
  createGigaGolemModel,
  createIronfangModel,
  createAerostrikeModel,
  createChronosDeusModel,
  createTorrenModel,
  createCollectibleMesh,
  AnimatedCharacter,
} from './proceduralModels';
import { MeadowWorld } from './worldScene';

// Pre-allocated math helpers for zero GC in tick loop
const _vec3 = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _moveDir = new THREE.Vector3();

export interface GameEngineCallbacks {
  onNearbyCreatureChange: (creature: WorldCreatureInstance | null) => void;
  onNearbyNpcChange: (isNearby: boolean) => void;
  onTamingStarted: (creature: WorldCreatureInstance, card: Mecard) => void;
  onCaptureCompleted: (capturedCard: Mecard, creatureDefId: string) => void;
  onItemCollected: (type: string, name: string) => void;
  onStatsUpdate: (stats: PlayerStats) => void;
  onCardsUpdate: (cards: Mecard[]) => void;
  onBattleRequested: (creature: WorldCreatureInstance) => void;
  onNearbyLocationChange: (location: SecretLocation | null) => void;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private world: MeadowWorld;
  private callbacks: GameEngineCallbacks;

  // Player Entity
  public playerGroup: THREE.Group;
  private playerAnim: AnimatedCharacter;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private playerVelocityY: number = 0;
  private isGrounded: boolean = true;
  private playerSpeed: number = 7.5;
  private playerRotation: number = 0;
  private walkCycleTimer: number = 0;
  private footstepTimer: number = 0;

  // Camera Orbit
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.35; // radians
  public cameraDistance: number = 7.5;

  // Input states
  public keys: Record<string, boolean> = {};
  public touchMove: { x: number; y: number } = { x: 0, y: 0 };
  public isMouseDown: boolean = false;
  public lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  // World Creatures
  public creatures: WorldCreatureInstance[] = [];
  private creatureMeshes: Map<string, { group: THREE.Group; animParts: any }> = new Map();

  // NPC Chief Torren
  private torrenGroup: THREE.Group;
  public isNearTorren: boolean = false;

  // Secret Locations Tracking
  public nearbyLocation: SecretLocation | null = null;

  // Collectible items in world
  public collectibles: CollectibleItem[] = [];
  private collectibleMeshes: Map<string, THREE.Group> = new Map();

  // Cards & Player Stats
  public cards: Mecard[] = [];
  public playerStats: PlayerStats = {
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
  };

  // Nearby target for taming
  public nearbyCreature: WorldCreatureInstance | null = null;
  public activeTamingCreature: WorldCreatureInstance | null = null;
  public activeTamingCard: Mecard | null = null;
  public tamingTetherLine: THREE.Line | null = null;
  public tamingCardMesh: THREE.Group | null = null;
  public tamingAura: THREE.Mesh | null = null;

  private isRunning: boolean = true;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    world: MeadowWorld,
    initialCards: Mecard[],
    callbacks: GameEngineCallbacks
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.world = world;
    this.scene = world.scene;
    this.cards = initialCards;
    this.callbacks = callbacks;

    // 1. Initialize Player
    this.playerAnim = createPlayerModel();
    this.playerGroup = this.playerAnim.group;
    this.playerPos.set(0, getMeadowHeight(0, 0), 0);
    this.playerGroup.position.copy(this.playerPos);
    this.scene.add(this.playerGroup);

    // 2. Initialize Chief Torren NPC
    this.torrenGroup = createTorrenModel();
    const torrenY = getMeadowHeight(4, 4);
    this.torrenGroup.position.set(4, torrenY, 4);
    this.torrenGroup.rotation.y = -Math.PI * 0.75;
    this.scene.add(this.torrenGroup);

    // 3. Initialize Wild Toy-Car Mechanimals in Gearfall Meadow & Hidden Locations
    this.initCreatures();

    // 4. Initialize Collectibles
    this.initCollectibles();

    // 5. Initialize Taming Visual FX elements
    this.initTamingFX();
  }

  private initCreatures() {
    this.creatures = [
      // Standard Wild Toy Cars in Gearfall Meadow
      {
        id: 'wild-voltiger-1',
        defId: 'voltiger',
        name: 'Voltiger',
        x: 24,
        z: -18,
        y: getMeadowHeight(24, -18),
        rotY: 0,
        element: 'electric',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: 24, z: -18 },
        patrolRadius: 10,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        currentHp: 180,
        maxHp: 180,
      },
      {
        id: 'wild-aquafin-1',
        defId: 'aquafin',
        name: 'Aquafin',
        x: -20,
        z: 8,
        y: getMeadowHeight(-20, 8) + 0.35,
        rotY: 0,
        element: 'hydro',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: -20, z: 8 },
        patrolRadius: 12,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        currentHp: 210,
        maxHp: 210,
      },
      {
        id: 'wild-emberhorn-1',
        defId: 'emberhorn',
        name: 'Emberhorn',
        x: 16,
        z: 42,
        y: getMeadowHeight(16, 42),
        rotY: Math.PI,
        element: 'pyro',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: 16, z: 42 },
        patrolRadius: 8,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        currentHp: 260,
        maxHp: 260,
      },
      // Secret Location 1: Leviathan-Sub inside Sunken Crystal Grotto Cave (Requires 1 capture)
      {
        id: 'legendary-leviathan-1',
        defId: 'leviathan',
        name: 'Leviathan-Sub',
        x: -36,
        z: -42,
        y: getMeadowHeight(-36, -42) + 0.2,
        rotY: 0,
        element: 'hydro',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: -36, z: -42 },
        patrolRadius: 5,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        isLegendary: true,
        currentHp: 310,
        maxHp: 310,
      },
      // Secret Location 2: Draco-Ignis inside Clockwork Citadel Building (Requires 2 captures)
      {
        id: 'legendary-draco-1',
        defId: 'draco_ignis',
        name: 'Draco-Ignis',
        x: 35,
        z: -38,
        y: getMeadowHeight(35, -38) + 0.2,
        rotY: -0.5,
        element: 'aero',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: 35, z: -38 },
        patrolRadius: 6,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        isLegendary: true,
        currentHp: 280,
        maxHp: 280,
      },
      // Secret Location 3: Giga-Golem inside Magma Forge Sanctum (Requires 3 captures)
      {
        id: 'legendary-golem-1',
        defId: 'giga_golem',
        name: 'Giga-Golem',
        x: -12,
        z: 52,
        y: getMeadowHeight(-12, 52) + 0.2,
        rotY: Math.PI,
        element: 'terra',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: -12, z: 52 },
        patrolRadius: 4,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        isLegendary: true,
        currentHp: 350,
        maxHp: 350,
      },
      // Medium Tier Wild: Iron-Fang (Cyber-Drift Coupe)
      {
        id: 'wild-ironfang-1',
        defId: 'ironfang',
        name: 'Iron-Fang',
        x: -42,
        z: 28,
        y: getMeadowHeight(-42, 28) + 0.1,
        rotY: 1.2,
        element: 'terra',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: -42, z: 28 },
        patrolRadius: 8,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        rarity: 'Medium',
        currentHp: 230,
        maxHp: 230,
      },
      // Advanced Tier Wild: Aero-Strike (Mach-Wing Interceptor)
      {
        id: 'wild-aerostrike-1',
        defId: 'aerostrike',
        name: 'Aero-Strike',
        x: 42,
        z: 14,
        y: getMeadowHeight(42, 14) + 0.3,
        rotY: -1.0,
        element: 'aero',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: 42, z: 14 },
        patrolRadius: 10,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        rarity: 'Advanced',
        currentHp: 250,
        maxHp: 250,
      },
      // God Tier Guardian: Chronos-Deus (Nexus Chrono-Hypercar) at Celestial Obelisk (Requires 4 captures)
      {
        id: 'god-chronos-1',
        defId: 'chronos_deus',
        name: 'Chronos-Deus',
        x: 48,
        z: 46,
        y: getMeadowHeight(48, 46) + 0.4,
        rotY: 0,
        element: 'electric',
        isCaptured: false,
        isTaming: false,
        tameProgress: 0,
        patrolCenter: { x: 48, z: 46 },
        patrolRadius: 5,
        state: 'patrol',
        stateTimer: 0,
        mode: 'car',
        isLegendary: true,
        rarity: 'God',
        currentHp: 400,
        maxHp: 400,
      },
    ];

    // Build 3D models for each creature:
    // IMPORTANT: Mechanimals are in TOY SIZE (~0.38 scale) like die-cast RC cars!
    this.creatures.forEach((c) => {
      let parts: any;
      if (c.defId === 'voltiger') {
        parts = createVoltigerModel();
      } else if (c.defId === 'aquafin') {
        parts = createAquafinModel();
      } else if (c.defId === 'emberhorn') {
        parts = createEmberhornModel();
      } else if (c.defId === 'ironfang') {
        parts = createIronfangModel();
      } else if (c.defId === 'aerostrike') {
        parts = createAerostrikeModel();
      } else if (c.defId === 'draco_ignis') {
        parts = createDracoIgnisModel();
      } else if (c.defId === 'leviathan') {
        parts = createLeviathanModel();
      } else if (c.defId === 'chronos_deus') {
        parts = createChronosDeusModel();
      } else {
        parts = createGigaGolemModel();
      }

      parts.setMode('car');
      // Set agile toy-car scale!
      parts.group.scale.set(0.38, 0.38, 0.38);
      parts.group.position.set(c.x, c.y, c.z);
      this.scene.add(parts.group);
      this.creatureMeshes.set(c.id, { group: parts.group, animParts: parts });
    });
  }

  private initCollectibles() {
    this.collectibles = [
      { id: 'item-scrap-1', type: 'gear_scrap', name: 'Brass Gear Scrap', x: 8, y: 0, z: -12, collected: false },
      { id: 'item-scrap-2', type: 'gear_scrap', name: 'Titanium Cog Scrap', x: -14, y: 0, z: 22, collected: false },
      { id: 'item-shard-1', type: 'aether_shard', name: 'Azure Aether Crystal', x: 26, y: 0, z: -8, collected: false },
      { id: 'item-shard-2', type: 'aether_shard', name: 'Voltaic Aether Core', x: -25, y: 0, z: -16, collected: false },
      { id: 'item-berry-1', type: 'clockwork_berry', name: 'Copper Core Berry', x: -6, y: 0, z: -28, collected: false },
      { id: 'item-berry-2', type: 'clockwork_berry', name: 'Clockwork Berry Cluster', x: 30, y: 0, z: 34, collected: false },
    ];

    this.collectibles.forEach((item) => {
      const mesh = createCollectibleMesh(item.type);
      item.y = getMeadowHeight(item.x, item.z) + 0.4;
      mesh.position.set(item.x, item.y, item.z);
      this.scene.add(mesh);
      this.collectibleMeshes.set(item.id, mesh);
    });
  }

  private initTamingFX() {
    // Holographic Mecard that hovers during taming
    const cardGroup = new THREE.Group();
    const cardPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      })
    );
    cardGroup.add(cardPlate);

    const cardBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 1.16, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    cardBorder.position.z = -0.01;
    cardGroup.add(cardBorder);

    cardGroup.visible = false;
    this.scene.add(cardGroup);
    this.tamingCardMesh = cardGroup;

    // Laser tether line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
    });
    this.tamingTetherLine = new THREE.Line(lineGeo, lineMat);
    this.tamingTetherLine.visible = false;
    this.scene.add(this.tamingTetherLine);

    // Capture Ring Aura on ground
    const ringGeo = new THREE.RingGeometry(1.8, 2.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    this.tamingAura = new THREE.Mesh(ringGeo, ringMat);
    this.tamingAura.visible = false;
    this.scene.add(this.tamingAura);
  }

  /**
   * Start Taming process for a target creature using an equipped empty card
   */
  public startTaming(creature: WorldCreatureInstance, card: Mecard): boolean {
    if (card.isCaptured) {
      return false;
    }
    if (creature.isCaptured) {
      return false;
    }

    this.activeTamingCreature = creature;
    this.activeTamingCard = card;
    creature.state = 'taming';
    creature.isTaming = true;
    creature.tameProgress = 0;
    creature.mode = 'beast';

    // Trigger spring-loaded transformation to Beast Mode
    const entry = this.creatureMeshes.get(creature.id);
    if (entry && entry.animParts.setMode) {
      entry.animParts.setMode('beast');
    }

    // Visuals
    if (this.tamingCardMesh) {
      this.tamingCardMesh.visible = true;
      const midX = (this.playerPos.x + creature.x) * 0.5;
      const midZ = (this.playerPos.z + creature.z) * 0.5;
      const midY = (this.playerPos.y + creature.y) * 0.5 + 1.2;
      this.tamingCardMesh.position.set(midX, midY, midZ);
    }

    if (this.tamingTetherLine) {
      this.tamingTetherLine.visible = true;
    }

    if (this.tamingAura) {
      this.tamingAura.visible = true;
      this.tamingAura.position.set(creature.x, creature.y + 0.05, creature.z);
    }

    soundManager.playTamingBeam();
    soundManager.playCreatureRoar(creature.element);

    this.callbacks.onTamingStarted(creature, card);
    return true;
  }

  /**
   * Finalize successful capture ("Taming On!" voice command or tap confirmation)
   */
  public completeCapture(): boolean {
    if (!this.activeTamingCreature || !this.activeTamingCard) return false;

    const creature = this.activeTamingCreature;
    const card = this.activeTamingCard;
    const def = MECHANIMAL_DEFS[creature.defId];

    // Sound and voice response ping
    soundManager.playTamingVoiceTrigger();
    soundManager.playCaptureSuccess();

    // Mark creature captured
    creature.isCaptured = true;
    creature.state = 'captured';
    creature.isTaming = false;

    // Transform empty card into Captured Mechanimal Card
    const capturedData: CapturedCreature = {
      id: `captured-${creature.id}-${Date.now()}`,
      creatureDefId: creature.defId,
      nickname: def.name,
      level: 5,
      bondLevel: 10,
      element: creature.element,
      capturedAt: Date.now(),
      currentHp: def.baseHp,
      equippedMoveIndices: [0, 1, 2],
      stats: {
        hp: def.baseHp,
        maxHp: def.baseHp,
        attack: def.attack,
        defense: def.defense,
        speed: def.speed,
      },
    };

    card.isCaptured = true;
    card.capturedCreature = capturedData;

    // UNLIMITED CARDS MECHANIC:
    // When capturing, player keeps this card and can always fabricate more empty cards!
    const emptyCount = this.cards.filter((c) => !c.isCaptured).length;
    if (emptyCount < 2) {
      this.cards.push(createNewEmptyCard(this.cards.length));
    }

    this.playerStats.totalCaught = (this.playerStats.totalCaught || 0) + 1;

    // Hide creature 3D model in world
    const meshEntry = this.creatureMeshes.get(creature.id);
    if (meshEntry) {
      meshEntry.group.visible = false;
    }

    // Hide taming FX
    if (this.tamingCardMesh) this.tamingCardMesh.visible = false;
    if (this.tamingTetherLine) this.tamingTetherLine.visible = false;
    if (this.tamingAura) this.tamingAura.visible = false;

    // Update stats and XP
    this.playerStats.level += 1;
    this.playerStats.hp = this.playerStats.maxHp;
    this.callbacks.onStatsUpdate(this.playerStats);
    this.callbacks.onCardsUpdate(this.cards);
    this.callbacks.onCaptureCompleted(card, creature.defId);

    this.activeTamingCreature = null;
    this.activeTamingCard = null;
    return true;
  }

  /**
   * Cancel taming if player walks away or closes modal
   */
  public cancelTaming() {
    if (this.activeTamingCreature) {
      this.activeTamingCreature.state = 'patrol';
      this.activeTamingCreature.isTaming = false;
      this.activeTamingCreature.mode = 'car';
      const entry = this.creatureMeshes.get(this.activeTamingCreature.id);
      if (entry && entry.animParts.setMode) {
        entry.animParts.setMode('car');
      }
      this.activeTamingCreature = null;
    }
    this.activeTamingCard = null;

    if (this.tamingCardMesh) this.tamingCardMesh.visible = false;
    if (this.tamingTetherLine) this.tamingTetherLine.visible = false;
    if (this.tamingAura) this.tamingAura.visible = false;
  }

  /**
   * Swap a card between active equipped (slots 0, 1, 2) and reserve (slots 3, 4)
   */
  public swapCards(slotA: number, slotB: number) {
    const cardA = this.cards.find((c) => c.slotIndex === slotA);
    const cardB = this.cards.find((c) => c.slotIndex === slotB);
    if (!cardA || !cardB) return;

    cardA.slotIndex = slotB;
    cardB.slotIndex = slotA;

    cardA.isEquipped = slotB < 3;
    cardB.isEquipped = slotA < 3;

    soundManager.playCardEquip();
    this.callbacks.onCardsUpdate([...this.cards]);
  }

  /**
   * Update frame tick (60fps simulation)
   */
  public update(rawDt: number) {
    if (!this.isRunning) return;
    const dt = Math.min(rawDt, 0.05);

    // 1. Player Physics & Movement
    this.updatePlayerMovement(dt);

    // 2. Camera Orbit Follow
    this.updateCamera();

    // 3. Creature AI & Animations
    this.updateCreatures(dt);

    // 4. Proximity Checks (Creatures, NPC, Collectibles)
    this.checkProximities();

    // 5. Ambient Particles & Collectible Rotations
    this.world.updateParticles(dt);
    this.updateCollectibles(dt);

    // 6. Taming FX updates
    if (this.activeTamingCreature && this.tamingCardMesh && this.tamingTetherLine) {
      this.tamingCardMesh.rotation.y += dt * 4;
      this.tamingCardMesh.rotation.x = Math.sin(Date.now() * 0.005) * 0.2;

      // Update tether vertices
      const posAttr = this.tamingTetherLine.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, this.playerPos.x, this.playerPos.y + 1.1, this.playerPos.z);
      posAttr.setXYZ(1, this.activeTamingCreature.x, this.activeTamingCreature.y + 1.0, this.activeTamingCreature.z);
      posAttr.needsUpdate = true;

      if (this.tamingAura) {
        this.tamingAura.rotation.z += dt * 2;
      }
    }
  }

  private updatePlayerMovement(dt: number) {
    // Keyboard inputs
    let forward = 0;
    let strafe = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafe -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) strafe += 1;

    // Mobile touch joystick input
    if (Math.abs(this.touchMove.y) > 0.1) forward -= this.touchMove.y;
    if (Math.abs(this.touchMove.x) > 0.1) strafe += this.touchMove.x;

    const isMoving = Math.abs(forward) > 0.05 || Math.abs(strafe) > 0.05;

    if (isMoving) {
      // W is strictly forward along camera look vector
      // S is strictly backward away from camera look vector
      // A is strafe left, D is strafe right
      const camForwardX = -Math.sin(this.cameraYaw);
      const camForwardZ = -Math.cos(this.cameraYaw);
      const camRightX = Math.cos(this.cameraYaw);
      const camRightZ = -Math.sin(this.cameraYaw);

      _moveDir.set(
        camForwardX * forward + camRightX * strafe,
        0,
        camForwardZ * forward + camRightZ * strafe
      );

      if (_moveDir.lengthSq() > 0.0001) {
        _moveDir.normalize();
      }

      const speed = this.playerSpeed * (this.keys['ShiftLeft'] ? 1.4 : 1.0);
      this.playerPos.x += _moveDir.x * speed * dt;
      this.playerPos.z += _moveDir.z * speed * dt;

      // Rotate player to face travel direction smoothly
      const targetRot = Math.atan2(_moveDir.x, _moveDir.z);
      this.playerRotation = THREE.MathUtils.damp(this.playerRotation, targetRot, 14, dt);
      this.playerGroup.rotation.y = this.playerRotation;

      // Leg & Arm swinging animation
      this.walkCycleTimer += dt * 10 * (speed / this.playerSpeed);
      const legSwing = Math.sin(this.walkCycleTimer) * 0.6;
      this.playerAnim.leftLeg.rotation.x = legSwing;
      this.playerAnim.rightLeg.rotation.x = -legSwing;
      this.playerAnim.leftArm.rotation.x = -legSwing * 0.8;
      this.playerAnim.rightArm.rotation.x = legSwing * 0.8;

      // Footstep sounds
      this.footstepTimer += dt;
      if (this.footstepTimer > 0.32) {
        this.footstepTimer = 0;
        soundManager.playFootstep();
      }
    } else {
      // Reset limbs gently to idle
      this.playerAnim.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerAnim.leftLeg.rotation.x, 0, 8, dt);
      this.playerAnim.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerAnim.rightLeg.rotation.x, 0, 8, dt);
      this.playerAnim.leftArm.rotation.x = THREE.MathUtils.damp(this.playerAnim.leftArm.rotation.x, 0, 8, dt);
      this.playerAnim.rightArm.rotation.x = THREE.MathUtils.damp(this.playerAnim.rightArm.rotation.x, 0, 8, dt);
      this.footstepTimer = 0.25;
    }

    // Jumping physics
    if ((this.keys['Space']) && this.isGrounded) {
      this.playerVelocityY = 7.0;
      this.isGrounded = false;
      soundManager.playJump();
    }

    // Apply gravity
    this.playerVelocityY -= 19.6 * dt;
    this.playerPos.y += this.playerVelocityY * dt;

    // Ground collision
    const groundY = getMeadowHeight(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= groundY) {
      this.playerPos.y = groundY;
      this.playerVelocityY = 0;
      this.isGrounded = true;
    }

    // World boundary clamping (-75 to +75)
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -75, 75);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -75, 75);

    this.playerGroup.position.copy(this.playerPos);
  }

  private updateCamera() {
    // Camera position offset using spherical coordinates around player
    const horizontalDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const verticalDist = this.cameraDistance * Math.sin(this.cameraPitch);

    _camOffset.set(
      Math.sin(this.cameraYaw) * horizontalDist,
      verticalDist + 1.4,
      Math.cos(this.cameraYaw) * horizontalDist
    );

    const targetPos = _vec3.copy(this.playerPos).add(_camOffset);
    this.camera.position.lerp(targetPos, 0.14);

    const lookAtTarget = _vec3.copy(this.playerPos).add(new THREE.Vector3(0, 1.3, 0));
    this.camera.lookAt(lookAtTarget);
  }

  private updateCreatures(dt: number) {
    this.creatures.forEach((c) => {
      if (c.isCaptured) return;
      const entry = this.creatureMeshes.get(c.id);
      if (!entry) return;

      const group = entry.group;
      const parts = entry.animParts;

      c.stateTimer += dt;

      if (c.state === 'patrol') {
        // Patrol in smooth circle around center (Car Form cruising!)
        const angle = c.stateTimer * 0.35;
        const targetX = c.patrolCenter.x + Math.sin(angle) * c.patrolRadius;
        const targetZ = c.patrolCenter.z + Math.cos(angle) * c.patrolRadius;

        const dx = targetX - c.x;
        const dz = targetZ - c.z;
        c.rotY = Math.atan2(dx, dz);

        c.x += dx * 0.04;
        c.z += dz * 0.04;
        c.y = getMeadowHeight(c.x, c.z) + (c.defId === 'aquafin' ? 0.35 : 0.05);

        group.position.set(c.x, c.y, c.z);
        group.rotation.y = c.rotY;

        // Roll the car's wheels dynamically!
        if (parts.wheels) {
          parts.wheels.forEach((w: THREE.Group) => {
            w.rotation.x += dt * 12;
          });
        }
        if (c.defId === 'aquafin' && parts.turbine) {
          parts.turbine.rotation.x += dt * 8;
        }
      } else if (c.state === 'taming') {
        // Transformed into Beast Form! Face player intensely
        const dx = this.playerPos.x - c.x;
        const dz = this.playerPos.z - c.z;
        c.rotY = Math.atan2(dx, dz);
        group.rotation.y = c.rotY;

        const jitter = Math.sin(Date.now() * 0.04) * 0.05;
        group.position.x = c.x + jitter;

        if (c.defId === 'voltiger') {
          if (parts.head) parts.head.rotation.x = -0.3 + Math.sin(Date.now() * 0.01) * 0.2;
          if (parts.tail) parts.tail.rotation.y = Math.sin(Date.now() * 0.02) * 0.4;
        } else if (c.defId === 'aquafin') {
          if (parts.turbine) parts.turbine.rotation.x += dt * 30;
          if (parts.tailFin) parts.tailFin.rotation.y = Math.sin(Date.now() * 0.02) * 0.4;
        } else if (c.defId === 'emberhorn') {
          if (parts.head) parts.head.rotation.y = Math.sin(Date.now() * 0.02) * 0.3;
        }
      }
    });
  }

  private checkProximities() {
    // 1. Check NPC Chief Torren proximity
    const distToTorren = this.playerPos.distanceTo(this.torrenGroup.position);
    const wasNearTorren = this.isNearTorren;
    this.isNearTorren = distToTorren < 5.0;
    if (this.isNearTorren !== wasNearTorren) {
      this.callbacks.onNearbyNpcChange(this.isNearTorren);
    }

    // 2. Check Wild Creatures proximity (< 6m)
    let closestCreature: WorldCreatureInstance | null = null;
    let closestDist = 6.0;

    for (const c of this.creatures) {
      if (c.isCaptured) continue;
      const d = Math.hypot(this.playerPos.x - c.x, this.playerPos.z - c.z);
      if (d < closestDist) {
        closestDist = d;
        closestCreature = c;
      }
    }

    if (closestCreature !== this.nearbyCreature) {
      this.nearbyCreature = closestCreature;
      this.callbacks.onNearbyCreatureChange(this.nearbyCreature);
    }

    // 3. Check Secret Locations Proximity (< 8m)
    let closestLocation: SecretLocation | null = null;
    let closestLocDist = 8.0;
    const caughtCount = this.cards.filter((c) => c.isCaptured).length;

    for (const loc of SECRET_LOCATIONS) {
      const d = Math.hypot(this.playerPos.x - loc.x, this.playerPos.z - loc.z);
      if (d < closestLocDist) {
        closestLocDist = d;
        closestLocation = loc;

        // Auto unlock if player has enough captured mechanimals!
        if (caughtCount >= loc.requiredCaptures && !loc.isUnlocked) {
          loc.isUnlocked = true;
          this.world.unlockLocation(loc.id);
        }
      }
    }

    if (closestLocation !== this.nearbyLocation) {
      this.nearbyLocation = closestLocation;
      this.callbacks.onNearbyLocationChange(this.nearbyLocation);
    }

    // 4. Check Collectibles collision (< 1.8m)
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const d = Math.hypot(this.playerPos.x - item.x, this.playerPos.z - item.z);
      if (d < 1.8) {
        item.collected = true;
        const mesh = this.collectibleMeshes.get(item.id);
        if (mesh) mesh.visible = false;

        soundManager.playCollect();

        if (item.type === 'gear_scrap') this.playerStats.inventoryScraps += 1;
        else if (item.type === 'aether_shard') this.playerStats.inventoryShards += 1;
        else this.playerStats.inventoryBerries += 1;

        this.callbacks.onItemCollected(item.type, item.name);
        this.callbacks.onStatsUpdate({ ...this.playerStats });
      }
    }
  }

  private updateCollectibles(dt: number) {
    this.collectibles.forEach((item) => {
      if (item.collected) return;
      const mesh = this.collectibleMeshes.get(item.id);
      if (mesh) {
        mesh.rotation.y += dt * 1.5;
        mesh.position.y = item.y + Math.sin(Date.now() * 0.003 + item.x) * 0.15;
      }
    });
  }

  public setTouchMove(x: number, y: number) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  public handleMouseMove(dx: number, dy: number) {
    this.cameraYaw -= dx * 0.005;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + dy * 0.005, 0.05, 1.25);
  }

  public dispose() {
    this.isRunning = false;
    // Cleanup Three.js meshes
    this.world.scene.clear();
  }
}
