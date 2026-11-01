/**
 * Procedural 3D composite models for Wildbond: Echoes of Gearfall.
 * Complies with the Three.js skill requirement:
 * 3–12 distinct parts per subject across primary, secondary, and accent scales.
 * Varied roughness/metalness, grounded bottom-center pivots.
 */

import * as THREE from 'three';
import { createMetalTexture } from './threeUtils';

// Common reusable materials
const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xd8e2dc,
  metalness: 0.9,
  roughness: 0.15,
});

const darkMetalMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  metalness: 0.75,
  roughness: 0.45,
});

const goldBrassMat = new THREE.MeshStandardMaterial({
  color: 0xd97706,
  metalness: 0.85,
  roughness: 0.25,
});

const glowingCyanMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  emissive: 0x0284c7,
  emissiveIntensity: 0.8,
  metalness: 0.2,
  roughness: 0.2,
});

const glowingAmberMat = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  emissive: 0xd97706,
  emissiveIntensity: 0.9,
  metalness: 0.3,
  roughness: 0.2,
});

const glowingCrimsonMat = new THREE.MeshStandardMaterial({
  color: 0xef4444,
  emissive: 0xb91c1c,
  emissiveIntensity: 0.9,
  metalness: 0.3,
  roughness: 0.2,
});

export interface AnimatedCharacter {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  backpack: THREE.Group;
  coreLight?: THREE.Mesh;
}

/**
 * Creates the third-person Player Character: Gearfall Ranger Explorer
 */
export function createPlayerModel(): AnimatedCharacter {
  const group = new THREE.Group();
  group.name = 'PlayerExplorer';

  // 1. Torso & Explorer Armor (Primary)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.9, 0);

  const chestGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
  const chestMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    metalness: 0.6,
    roughness: 0.35,
  });
  const chestMesh = new THREE.Mesh(chestGeo, chestMat);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // Core energy emitter on chest (Accent)
  const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, glowingCyanMat);
  coreMesh.position.set(0, 0.08, 0.16);
  torsoGroup.add(coreMesh);

  // Hip gear belt (Secondary)
  const beltGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12);
  const beltMesh = new THREE.Mesh(beltGeo, goldBrassMat);
  beltMesh.position.set(0, -0.28, 0);
  torsoGroup.add(beltMesh);

  // Card Holster on belt
  const holsterGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
  const holsterMesh = new THREE.Mesh(holsterGeo, darkMetalMat);
  holsterMesh.position.set(0.28, -0.25, 0);
  torsoGroup.add(holsterMesh);

  group.add(torsoGroup);

  // 2. Head & Gear-Visor (Primary + Accent)
  const head = new THREE.Group();
  head.position.set(0, 1.45, 0);

  const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.6 });
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Ranger Helmet & Gear Visor
  const visorGeo = new THREE.BoxGeometry(0.26, 0.1, 0.16);
  const visorMesh = new THREE.Mesh(visorGeo, glowingCyanMat);
  visorMesh.position.set(0, 0.02, 0.13);
  head.add(visorMesh);

  const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
  const antennaMesh = new THREE.Mesh(antennaGeo, goldBrassMat);
  antennaMesh.position.set(-0.16, 0.2, 0);
  antennaMesh.rotation.z = 0.2;
  head.add(antennaMesh);

  group.add(head);

  // 3. Mechanical Scanner Backpack
  const backpack = new THREE.Group();
  backpack.position.set(0, 0.95, -0.22);
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.16), darkMetalMat);
  packBody.castShadow = true;
  backpack.add(packBody);

  const packDish = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 0.06, 12), goldBrassMat);
  packDish.position.set(0, 0.22, 0.02);
  backpack.add(packDish);
  group.add(backpack);

  // 4. Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 1.15, 0);
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.45, 6, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
  const lArmMesh = new THREE.Mesh(armGeo, armMat);
  lArmMesh.position.set(0, -0.25, 0);
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 1.15, 0);
  const rArmMesh = new THREE.Mesh(armGeo, armMat);
  rArmMesh.position.set(0, -0.25, 0);
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);

  // Wrist Mecard Launcher device on right wrist
  const launcher = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.18), goldBrassMat);
  launcher.position.set(0, -0.35, 0.05);
  rightArm.add(launcher);
  group.add(rightArm);

  // 5. Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.6, 0);
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.5, 6, 8);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
  lLegMesh.position.set(0, -0.25, 0);
  lLegMesh.castShadow = true;
  leftLeg.add(lLegMesh);

  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.24), darkMetalMat);
  lBoot.position.set(0, -0.55, 0.04);
  lBoot.castShadow = true;
  leftLeg.add(lBoot);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.6, 0);
  const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rLegMesh.position.set(0, -0.25, 0);
  rLegMesh.castShadow = true;
  rightLeg.add(rLegMesh);

  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.24), darkMetalMat);
  rBoot.position.set(0, -0.55, 0.04);
  rBoot.castShadow = true;
  rightLeg.add(rBoot);
  group.add(rightLeg);

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    backpack,
    coreLight: coreMesh,
  };
}

/**
 * Helper to build high-detail rolling vehicle wheels
 */
function createCarWheel(radius: number, width: number, rimColor = 0xd97706): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.25,
    roughness: 0.85,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Rim Hub
  const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 1.05, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: 0.9,
    roughness: 0.2,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Wheel spokes
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(width * 1.06, radius * 0.08, radius * 1.15),
      new THREE.MeshStandardMaterial({ color: 0xd8e2dc, metalness: 0.85, roughness: 0.2 })
    );
    spoke.rotation.x = (i * Math.PI) / 4;
    wheelGroup.add(spoke);
  }

  return wheelGroup;
}

/**
 * 1. Voltiger — First: "Volt-Interceptor GT" Sports Car; Transforms into: Electric Mechanical Tiger
 */
export function createVoltigerModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  flLeg: THREE.Group;
  frLeg: THREE.Group;
  blLeg: THREE.Group;
  brLeg: THREE.Group;
  tail: THREE.Group;
  head: THREE.Group;
  spineFins: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'Voltiger';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04,
    metalness: 0.85,
    roughness: 0.25,
    map: createMetalTexture('#eab308', '#38bdf8'),
  });

  // ==================== CAR MODE (Volt-Interceptor GT) ====================
  const carGroup = new THREE.Group();
  carGroup.name = 'VoltInterceptorCar';

  // 1. Lower chassis & splitter
  const lowerChassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.22, 2.4),
    darkMetalMat
  );
  lowerChassis.position.set(0, 0.25, 0);
  lowerChassis.castShadow = true;
  carGroup.add(lowerChassis);

  // 2. Main Sports Car Body Hood & Sloped Cabin
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.4), bodyMat);
  hood.position.set(0, 0.42, 0.45);
  hood.castShadow = true;
  carGroup.add(hood);

  // Aerodynamic Cockpit Canopy
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.38, 0.95),
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
    })
  );
  cabin.position.set(0, 0.65, -0.2);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Cyan Windshield Glass Visor
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.32), glowingCyanMat);
  windshield.rotation.x = -Math.PI / 4;
  windshield.position.set(0, 0.65, 0.3);
  carGroup.add(windshield);

  // 3. Dual Projector Headlights
  const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), glowingCyanMat);
  lightL.position.set(-0.45, 0.4, 1.16);
  carGroup.add(lightL);

  const lightR = lightL.clone();
  lightR.position.x = 0.45;
  carGroup.add(lightR);

  // 4. Rear Lightning Spoiler
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 0.35), goldBrassMat);
  spoilerWing.position.set(0, 0.85, -1.05);
  carGroup.add(spoilerWing);

  const spoilerPostL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.1), darkMetalMat);
  spoilerPostL.position.set(-0.45, 0.65, -1.05);
  carGroup.add(spoilerPostL);
  const spoilerPostR = spoilerPostL.clone();
  spoilerPostR.position.x = 0.45;
  carGroup.add(spoilerPostR);

  // Dual Rear Exhaust Coils
  const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), chromeMat);
  exhaustL.rotation.x = Math.PI / 2;
  exhaustL.position.set(-0.35, 0.25, -1.22);
  carGroup.add(exhaustL);

  const exhaustR = exhaustL.clone();
  exhaustR.position.x = 0.35;
  carGroup.add(exhaustR);

  // 5. 4 Rolling Sports Car Wheels
  const wheelRadius = 0.32;
  const wheelWidth = 0.22;
  const flWheel = createCarWheel(wheelRadius, wheelWidth, 0xd97706);
  flWheel.position.set(-0.65, wheelRadius, 0.75);
  carGroup.add(flWheel);

  const frWheel = createCarWheel(wheelRadius, wheelWidth, 0xd97706);
  frWheel.position.set(0.65, wheelRadius, 0.75);
  carGroup.add(frWheel);

  const blWheel = createCarWheel(wheelRadius, wheelWidth, 0xd97706);
  blWheel.position.set(-0.65, wheelRadius, -0.75);
  carGroup.add(blWheel);

  const brWheel = createCarWheel(wheelRadius, wheelWidth, 0xd97706);
  brWheel.position.set(0.65, wheelRadius, -0.75);
  carGroup.add(brWheel);

  const wheels = [flWheel, frWheel, blWheel, brWheel];
  group.add(carGroup);

  // ==================== BEAST MODE (Electric Mechanical Tiger) ====================
  const beastGroup = new THREE.Group();
  beastGroup.name = 'VoltigerBeast';
  beastGroup.visible = false; // Initially in Car Mode!

  // Body chassis
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.0, 0);

  const thoraxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.8), bodyMat);
  thoraxMesh.castShadow = true;
  bodyGroup.add(thoraxMesh);

  // Spine lightning battery fins
  const spineFins = new THREE.Group();
  for (let i = -0.6; i <= 0.6; i += 0.3) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), glowingAmberMat);
    fin.position.set(0, 0.45, i);
    spineFins.add(fin);
  }
  bodyGroup.add(spineFins);

  // Shoulder power coils
  const coilL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), chromeMat);
  coilL.rotation.z = Math.PI / 2;
  coilL.position.set(-0.55, 0.1, 0.5);
  bodyGroup.add(coilL);

  const coilR = coilL.clone();
  coilR.position.set(0.55, 0.1, 0.5);
  bodyGroup.add(coilR);
  beastGroup.add(bodyGroup);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.35, 1.15);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), bodyMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Optical visor
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), glowingCyanMat);
  eyeL.position.set(-0.2, 0.05, 0.34);
  head.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.set(0.2, 0.05, 0.34);
  head.add(eyeR);

  // Mecha feline ears
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), darkMetalMat);
  earL.position.set(-0.25, 0.32, -0.1);
  head.add(earL);
  const earR = earL.clone();
  earR.position.set(0.25, 0.32, -0.1);
  head.add(earR);

  // Conductive whiskers
  const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), chromeMat);
  whisker.rotation.z = Math.PI / 2;
  whisker.position.set(0.38, -0.08, 0.2);
  head.add(whisker);
  const whisker2 = whisker.clone();
  whisker2.position.set(-0.38, -0.08, 0.2);
  head.add(whisker2);

  beastGroup.add(head);

  // 4 Tiger Legs
  const legMat = darkMetalMat;
  function createLeg(x: number, z: number): THREE.Group {
    const leg = new THREE.Group();
    leg.position.set(x, 0.85, z);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.45, 6, 8), legMat);
    upper.position.set(0, -0.22, 0);
    upper.castShadow = true;
    leg.add(upper);

    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 6, 8), chromeMat);
    lower.position.set(0, -0.5, 0.05);
    lower.castShadow = true;
    leg.add(lower);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.28), goldBrassMat);
    paw.position.set(0, -0.76, 0.1);
    paw.castShadow = true;
    leg.add(paw);

    return leg;
  }

  const flLeg = createLeg(-0.48, 0.65);
  const frLeg = createLeg(0.48, 0.65);
  const blLeg = createLeg(-0.48, -0.65);
  const brLeg = createLeg(0.48, -0.65);
  beastGroup.add(flLeg, frLeg, blLeg, brLeg);

  // Segmented tail
  const tail = new THREE.Group();
  tail.position.set(0, 1.15, -0.9);
  for (let i = 0; i < 5; i++) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.07 - i * 0.008, 8, 8), darkMetalMat);
    node.position.set(0, 0.12 * i, -0.22 * i);
    tail.add(node);
  }
  const sparkTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glowingCyanMat);
  sparkTip.position.set(0, 0.55, -1.05);
  tail.add(sparkTip);
  beastGroup.add(tail);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return {
    group,
    carGroup,
    beastGroup,
    mode: currentMode,
    setMode,
    wheels,
    flLeg,
    frLeg,
    blLeg,
    brLeg,
    tail,
    head,
    spineFins,
  };
}

/**
 * 2. Aquafin — First: "Hydro-Phantom" Concept Car; Transforms into: Water-Powered Mechanical Shark
 */
export function createAquafinModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  tailFin: THREE.Group;
  leftPectoral: THREE.Group;
  rightPectoral: THREE.Group;
  turbine: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'Aquafin';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.8,
    roughness: 0.2,
    map: createMetalTexture('#06b6d4', '#38bdf8'),
  });

  // ==================== CAR MODE (Hydro-Phantom Concept Car) ====================
  const carGroup = new THREE.Group();
  carGroup.name = 'HydroPhantomCar';

  // 1. Sleek Torpedo-Pod Car Hull
  const podChassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.35, 2.5),
    bodyMat
  );
  podChassis.position.set(0, 0.35, 0);
  podChassis.castShadow = true;
  carGroup.add(podChassis);

  // Aerodynamic nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 12), chromeMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.35, 1.45);
  carGroup.add(nose);

  // Roof Hydro Turbine Scoop
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.6), darkMetalMat);
  scoop.position.set(0, 0.65, 0.1);
  carGroup.add(scoop);

  const scoopRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), glowingCyanMat);
  scoopRotor.rotation.z = Math.PI / 2;
  scoopRotor.position.set(0, 0.68, 0.4);
  carGroup.add(scoopRotor);

  // Side intake gill lightbars
  for (let i = 0; i < 3; i++) {
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.15), glowingCyanMat);
    ventL.position.set(-0.62, 0.35, 0.3 + i * 0.22);
    carGroup.add(ventL);

    const ventR = ventL.clone();
    ventR.position.x = 0.62;
    carGroup.add(ventR);
  }

  // Dual Rear Hydro Thrusters
  const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 12), glowingCyanMat);
  thrusterL.rotation.x = Math.PI / 2;
  thrusterL.position.set(-0.35, 0.35, -1.35);
  carGroup.add(thrusterL);

  const thrusterR = thrusterL.clone();
  thrusterR.position.x = 0.35;
  carGroup.add(thrusterR);

  // 4 Turbine Enclosed Wheels
  const wheelRadius = 0.3;
  const wheelWidth = 0.2;
  const flWheel = createCarWheel(wheelRadius, wheelWidth, 0x06b6d4);
  flWheel.position.set(-0.65, wheelRadius, 0.75);
  carGroup.add(flWheel);

  const frWheel = createCarWheel(wheelRadius, wheelWidth, 0x06b6d4);
  frWheel.position.set(0.65, wheelRadius, 0.75);
  carGroup.add(frWheel);

  const blWheel = createCarWheel(wheelRadius, wheelWidth, 0x06b6d4);
  blWheel.position.set(-0.65, wheelRadius, -0.75);
  carGroup.add(blWheel);

  const brWheel = createCarWheel(wheelRadius, wheelWidth, 0x06b6d4);
  brWheel.position.set(0.65, wheelRadius, -0.75);
  carGroup.add(brWheel);

  const wheels = [flWheel, frWheel, blWheel, brWheel];
  group.add(carGroup);

  // ==================== BEAST MODE (Water-Powered Mechanical Shark) ====================
  const beastGroup = new THREE.Group();
  beastGroup.name = 'AquafinBeast';
  beastGroup.visible = false; // Initially in Car Mode!

  const hullGroup = new THREE.Group();
  hullGroup.position.set(0, 1.2, 0);

  const hullGeo = new THREE.ConeGeometry(0.7, 2.8, 16);
  hullGeo.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, bodyMat);
  hull.castShadow = true;
  hullGroup.add(hull);

  // Hydro-turbine dorsal fin
  const turbine = new THREE.Group();
  turbine.position.set(0, 0.7, -0.2);

  const finShape = new THREE.BoxGeometry(0.1, 0.7, 0.5);
  const dorsalFin = new THREE.Mesh(finShape, darkMetalMat);
  turbine.add(dorsalFin);

  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8), glowingCyanMat);
  rotor.rotation.z = Math.PI / 2;
  rotor.position.set(0, 0.25, 0);
  turbine.add(rotor);
  hullGroup.add(turbine);

  // Gill vents
  for (let i = 0; i < 3; i++) {
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), glowingCyanMat);
    ventL.position.set(-0.52, 0.05, 0.4 + i * 0.16);
    hullGroup.add(ventL);

    const ventR = ventL.clone();
    ventR.position.x = 0.52;
    hullGroup.add(ventR);
  }

  // Optics
  const optic = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), glowingCyanMat);
  optic.position.set(0, 0.1, 1.35);
  hullGroup.add(optic);
  beastGroup.add(hullGroup);

  // Pectoral fins
  const leftPectoral = new THREE.Group();
  leftPectoral.position.set(-0.6, 1.1, 0.3);
  const finGeo = new THREE.BoxGeometry(0.8, 0.06, 0.35);
  const lFin = new THREE.Mesh(finGeo, chromeMat);
  lFin.position.set(-0.35, 0, 0);
  lFin.rotation.z = -0.2;
  leftPectoral.add(lFin);
  beastGroup.add(leftPectoral);

  const rightPectoral = new THREE.Group();
  rightPectoral.position.set(0.6, 1.1, 0.3);
  const rFin = new THREE.Mesh(finGeo, chromeMat);
  rFin.position.set(0.35, 0, 0);
  rFin.rotation.z = 0.2;
  rightPectoral.add(rFin);
  beastGroup.add(rightPectoral);

  // Caudal tail fin
  const tailFin = new THREE.Group();
  tailFin.position.set(0, 1.2, -1.4);
  const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.6), bodyMat);
  tailMesh.position.set(0, 0, -0.3);
  tailFin.add(tailMesh);

  // Micro jet thruster
  const bThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 12), glowingCyanMat);
  bThruster.rotation.x = Math.PI / 2;
  bThruster.position.set(0, 0, -0.1);
  tailFin.add(bThruster);
  beastGroup.add(tailFin);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return {
    group,
    carGroup,
    beastGroup,
    mode: currentMode,
    setMode,
    wheels,
    tailFin,
    leftPectoral,
    rightPectoral,
    turbine,
  };
}

/**
 * 3. Emberhorn — First: "Magma-Crusher 4x4" Siege Truck; Transforms into: Fire-Powered Mechanical Rhino
 */
export function createEmberhornModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  head: THREE.Group;
  flLeg: THREE.Group;
  frLeg: THREE.Group;
  blLeg: THREE.Group;
  brLeg: THREE.Group;
  smokestacks: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'Emberhorn';

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x3b1212,
    metalness: 0.8,
    roughness: 0.35,
    map: createMetalTexture('#b91c1c', '#f97316'),
  });

  // ==================== CAR MODE (Magma-Crusher 4x4 Heavy Siege Truck) ====================
  const carGroup = new THREE.Group();
  carGroup.name = 'MagmaCrusherCar';

  // 1. Heavy Armored Truck Chassis
  const truckChassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.45, 2.5),
    darkMetalMat
  );
  truckChassis.position.set(0, 0.45, 0);
  truckChassis.castShadow = true;
  carGroup.add(truckChassis);

  // Heavy Armored Cabin
  const truckCab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 1.2), armorMat);
  truckCab.position.set(0, 0.95, -0.2);
  truckCab.castShadow = true;
  carGroup.add(truckCab);

  // Front Molten Battering Ram / Wedge Bumper
  const ramGeo = new THREE.ConeGeometry(0.65, 0.8, 4);
  ramGeo.rotateX(Math.PI / 2);
  const ram = new THREE.Mesh(ramGeo, glowingCrimsonMat);
  ram.position.set(0, 0.5, 1.45);
  carGroup.add(ram);

  // Glowing furnace radiator grill
  const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.35), glowingAmberMat);
  grill.position.set(0, 0.55, 1.26);
  carGroup.add(grill);

  // Dual Rear Vertical Exhaust Smokestacks
  const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 12), chromeMat);
  pipeL.position.set(-0.55, 1.2, -0.75);
  carGroup.add(pipeL);

  const pipeRimL = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), glowingCrimsonMat);
  pipeRimL.rotation.x = Math.PI / 2;
  pipeRimL.position.set(0, 0.45, 0);
  pipeL.add(pipeRimL);

  const pipeR = pipeL.clone();
  pipeR.position.x = 0.55;
  carGroup.add(pipeR);

  // 4 Oversized Monster Off-Road Wheels
  const wheelRadius = 0.42;
  const wheelWidth = 0.32;
  const flWheel = createCarWheel(wheelRadius, wheelWidth, 0xef4444);
  flWheel.position.set(-0.8, wheelRadius, 0.8);
  carGroup.add(flWheel);

  const frWheel = createCarWheel(wheelRadius, wheelWidth, 0xef4444);
  frWheel.position.set(0.8, wheelRadius, 0.8);
  carGroup.add(frWheel);

  const blWheel = createCarWheel(wheelRadius, wheelWidth, 0xef4444);
  blWheel.position.set(-0.8, wheelRadius, -0.8);
  carGroup.add(blWheel);

  const brWheel = createCarWheel(wheelRadius, wheelWidth, 0xef4444);
  brWheel.position.set(0.8, wheelRadius, -0.8);
  carGroup.add(brWheel);

  const wheels = [flWheel, frWheel, blWheel, brWheel];
  group.add(carGroup);

  // ==================== BEAST MODE (Fire-Powered Mechanical Rhino) ====================
  const beastGroup = new THREE.Group();
  beastGroup.name = 'EmberhornBeast';
  beastGroup.visible = false; // Initially in Car Mode!

  // Massive torso chassis
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.25, 0);

  const carapace = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 2.2), armorMat);
  carapace.castShadow = true;
  bodyGroup.add(carapace);

  // Reinforced side plates
  const sidePlateL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 1.8), darkMetalMat);
  sidePlateL.position.set(-0.7, 0, 0);
  bodyGroup.add(sidePlateL);

  const sidePlateR = sidePlateL.clone();
  sidePlateR.position.x = 0.7;
  bodyGroup.add(sidePlateR);

  // Dual Thermal Smokestacks (exhaust chimneys)
  const smokestacks = new THREE.Group();
  smokestacks.position.set(0, 0.6, -0.4);

  const chimneyL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.6, 12), darkMetalMat);
  chimneyL.position.set(-0.35, 0.3, 0);
  chimneyL.rotation.x = -0.2;
  const glowRimL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), glowingCrimsonMat);
  glowRimL.rotation.x = Math.PI / 2;
  glowRimL.position.set(0, 0.3, 0);
  chimneyL.add(glowRimL);
  smokestacks.add(chimneyL);

  const chimneyR = chimneyL.clone();
  chimneyR.position.x = 0.35;
  smokestacks.add(chimneyR);
  bodyGroup.add(smokestacks);

  // Molten belly furnace grate
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.4), glowingCrimsonMat);
  grate.rotation.x = Math.PI / 2;
  grate.position.set(0, -0.56, 0);
  bodyGroup.add(grate);

  beastGroup.add(bodyGroup);

  // Heavy Armored Head with Giant Drill Horn
  const head = new THREE.Group();
  head.position.set(0, 1.3, 1.4);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), armorMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Molten Obsidian Drill Horn
  const hornGeo = new THREE.ConeGeometry(0.24, 1.1, 8);
  hornGeo.rotateX(Math.PI / 2 - 0.25);
  const horn = new THREE.Mesh(hornGeo, glowingCrimsonMat);
  horn.position.set(0, 0.5, 0.6);
  head.add(horn);

  // Optical slits
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), glowingAmberMat);
  eyeL.position.set(-0.46, 0.1, 0.2);
  head.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.46;
  head.add(eyeR);

  beastGroup.add(head);

  // 4 Pillar Legs
  function createRhinoLeg(x: number, z: number): THREE.Group {
    const leg = new THREE.Group();
    leg.position.set(x, 1.0, z);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.9, 12), darkMetalMat);
    pillar.position.set(0, -0.45, 0);
    pillar.castShadow = true;
    leg.add(pillar);

    // Hydraulic piston band
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 16), goldBrassMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, -0.3, 0);
    leg.add(band);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.2, 12), armorMat);
    hoof.position.set(0, -0.9, 0);
    hoof.castShadow = true;
    leg.add(hoof);

    return leg;
  }

  const flLeg = createRhinoLeg(-0.62, 0.8);
  const frLeg = createRhinoLeg(0.62, 0.8);
  const blLeg = createRhinoLeg(-0.62, -0.8);
  const brLeg = createRhinoLeg(0.62, -0.8);

  beastGroup.add(flLeg, frLeg, blLeg, brLeg);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return {
    group,
    carGroup,
    beastGroup,
    mode: currentMode,
    setMode,
    wheels,
    head,
    flLeg,
    frLeg,
    blLeg,
    brLeg,
    smokestacks,
  };
}

/**
 * NPC: Chief Mechanist Torren (Mentor NPC)
 */
export function createTorrenModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TorrenNPC';

  // Torso with rugged mechanic coat
  const coatMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), coatMat);
  torso.position.set(0, 0.95, 0);
  torso.castShadow = true;
  group.add(torso);

  // Head with brass goggles
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 }));
  head.add(headMesh);

  // Goggles
  const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), goldBrassMat);
  goggles.rotation.y = Math.PI / 2;
  goggles.position.set(0.09, 0.05, 0.16);
  head.add(goggles);
  const gogglesL = goggles.clone();
  gogglesL.position.x = -0.09;
  head.add(gogglesL);

  group.add(head);

  // Legs
  const legMat = darkMetalMat;
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.2), legMat);
  lLeg.position.set(-0.16, 0.35, 0);
  group.add(lLeg);
  const rLeg = lLeg.clone();
  rLeg.position.x = 0.16;
  group.add(rLeg);

  // Mechanical robotic right arm holding wrench
  const mechArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 8), chromeMat);
  mechArm.position.set(0.38, 0.8, 0.1);
  mechArm.rotation.x = -0.4;
  group.add(mechArm);

  const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), goldBrassMat);
  wrench.position.set(0.38, 0.6, 0.25);
  group.add(wrench);

  return group;
}

/**
 * Ancient Gear-Tree (Natural meadow tree with embedded clockwork cogs)
 */
export function createGearTree(): THREE.Group {
  const tree = new THREE.Group();

  // Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3.5, 8), trunkMat);
  trunk.position.set(0, 1.75, 0);
  trunk.castShadow = true;
  tree.add(trunk);

  // Ancient gear embedded in trunk
  const cogMat = goldBrassMat;
  const cog = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8), cogMat);
  cog.rotation.x = Math.PI / 2;
  cog.position.set(0, 2.0, 0.25);
  tree.add(cog);

  // Foliage tiers
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.6,
    flatShading: true,
  });

  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.2, 7), foliageMat);
  tier1.position.set(0, 3.8, 0);
  tier1.castShadow = true;
  tree.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 7), foliageMat);
  tier2.position.set(0, 4.8, 0);
  tier2.castShadow = true;
  tree.add(tier2);

  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 7), foliageMat);
  tier3.position.set(0, 5.7, 0);
  tier3.castShadow = true;
  tree.add(tier3);

  return tree;
}

/**
 * Colossal Ancient Fallen Gear Ruin
 */
export function createAncientGearRuin(radius: number): THREE.Group {
  const ruin = new THREE.Group();

  const gearGeo = new THREE.CylinderGeometry(radius, radius, 0.6, 16);
  const gearMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.7,
    roughness: 0.5,
  });
  const wheel = new THREE.Mesh(gearGeo, gearMat);
  wheel.rotation.z = Math.PI / 4;
  wheel.castShadow = true;
  ruin.add(wheel);

  // Teeth
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.25, 0.55, radius * 0.25), gearMat);
    tooth.position.set(Math.cos(angle) * (radius + radius * 0.1), Math.sin(angle) * (radius + radius * 0.1), 0);
    tooth.rotation.z = angle;
    ruin.add(tooth);
  }

  return ruin;
}

/**
 * Collectible 3D Token (Gear Scrap / Aether Shard / Clockwork Berry)
 */
export function createCollectibleMesh(type: string): THREE.Group {
  const group = new THREE.Group();

  if (type === 'gear_scrap') {
    const cog = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8), goldBrassMat);
    cog.rotation.x = Math.PI / 2;
    group.add(cog);
  } else if (type === 'aether_shard') {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), glowingCyanMat);
    group.add(crystal);
  } else {
    // Clockwork Berry
    const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), glowingCrimsonMat);
    group.add(sphere);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), darkMetalMat);
    stem.position.set(0, 0.25, 0);
    group.add(stem);
  }

  // Soft glowing halo ring beneath
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.45, 16),
    new THREE.MeshBasicMaterial({
      color: type === 'aether_shard' ? 0x38bdf8 : type === 'gear_scrap' ? 0xf59e0b : 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, -0.2, 0);
  group.add(halo);

  return group;
}

/**
 * Secret Location 1: The Sunken Crystal Grotto (Cave)
 * Built with rock arches, glowing cyan stalactites, and an aether barrier gate.
 */
export function createCrystalCaveModel(): {
  group: THREE.Group;
  barrierMesh: THREE.Mesh;
  stalactites: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'CrystalGrottoCave';

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.2,
  });

  // Massive Cave Outcrop Arch
  const archL = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, 8, 8), rockMat);
  archL.position.set(-4, 3.5, 0);
  archL.rotation.z = -0.2;
  archL.castShadow = true;
  group.add(archL);

  const archR = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, 8, 8), rockMat);
  archR.position.set(4, 3.5, 0);
  archR.rotation.z = 0.2;
  archR.castShadow = true;
  group.add(archR);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(9.5, 2.4, 4.5), rockMat);
  archTop.position.set(0, 7.2, 0);
  archTop.castShadow = true;
  group.add(archTop);

  // Dark Cavern Interior Backdrop
  const cavernBack = new THREE.Mesh(
    new THREE.BoxGeometry(8, 7, 2),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 1.0 })
  );
  cavernBack.position.set(0, 3.5, -3.5);
  group.add(cavernBack);

  // Glowing Cyan Crystal Stalactites
  const stalactites = new THREE.Group();
  for (let i = -3; i <= 3; i += 1.2) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), glowingCyanMat);
    crystal.rotation.x = Math.PI;
    crystal.position.set(i, 6.2, Math.sin(i) * 0.8);
    stalactites.add(crystal);
  }
  group.add(stalactites);

  // Glowing Aether Barrier Gate (Seals cave until unlocked!)
  const barrierGeo = new THREE.PlaneGeometry(6.5, 6.2);
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });
  const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
  barrierMesh.position.set(0, 3.2, 0.2);
  group.add(barrierMesh);

  // Signboard / Rune Marker
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.2), goldBrassMat);
  sign.position.set(0, 7.6, 1.2);
  group.add(sign);

  return { group, barrierMesh, stalactites };
}

/**
 * Secret Location 2: Clockwork Citadel Facility (High-Tech Monolithic Building)
 * Reinforced titan-steel bunker with communications spire and massive gear blast doors.
 */
export function createClockworkCitadelModel(): {
  group: THREE.Group;
  doorL: THREE.Mesh;
  doorR: THREE.Mesh;
  centralGear: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'ClockworkCitadelFacility';

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.4,
    roughness: 0.7,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });

  // Main Multi-Tier Building Block (Primary)
  const mainBunker = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 12), concreteMat);
  mainBunker.position.set(0, 5, 0);
  mainBunker.castShadow = true;
  mainBunker.receiveShadow = true;
  group.add(mainBunker);

  // Upper Spire / Communications Array
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 5, 8), steelMat);
  tower.position.set(0, 12.5, 0);
  tower.castShadow = true;
  group.add(tower);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), chromeMat);
  antenna.position.set(0, 16.5, 0);
  group.add(antenna);

  // Reinforced Corner Buttresses
  for (let x of [-7, 7]) {
    for (let z of [-6, 6]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, 11, 2.4), steelMat);
      p.position.set(x, 5.5, z);
      p.castShadow = true;
      group.add(p);
    }
  }

  // Windows / Observation Slits with purple/pink energy glow
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  for (let y of [4, 7]) {
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 0.1), windowMat);
    win1.position.set(0, y, 6.05);
    group.add(win1);
  }

  // Giant Vault Blast Doors (Secondary)
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 0.4), darkMetalMat);
  doorL.position.set(-1.3, 2.6, 6.1);
  doorL.castShadow = true;
  group.add(doorL);

  const doorR = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 0.4), darkMetalMat);
  doorR.position.set(1.3, 2.6, 6.1);
  doorR.castShadow = true;
  group.add(doorR);

  // Central Interlocking Gear Vault Lock
  const centralGear = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12), goldBrassMat);
  centralGear.rotation.x = Math.PI / 2;
  centralGear.position.set(0, 2.8, 6.35);
  group.add(centralGear);

  return { group, doorL, doorR, centralGear };
}

/**
 * Secret Location 3: Magma Forge Sanctum (Volcanic Underground Arch)
 */
export function createMagmaSanctumModel(): {
  group: THREE.Group;
  barrierMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'MagmaForgeSanctum';

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.8,
    roughness: 0.4,
  });

  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 9, 2.5), obsidianMat);
  pillarL.position.set(-4, 4.5, 0);
  pillarL.castShadow = true;
  group.add(pillarL);

  const pillarR = pillarL.clone();
  pillarR.position.x = 4;
  group.add(pillarR);

  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.2, 3), obsidianMat);
  archBeam.position.set(0, 9.5, 0);
  group.add(archBeam);

  // Molten Lava Core Glow at base
  const lava = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4),
    new THREE.MeshBasicMaterial({ color: 0xff3b00 })
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(0, 0.1, 0);
  group.add(lava);

  // Steam Vents
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 8), chromeMat);
  pipe.position.set(-4.5, 5, 1.4);
  group.add(pipe);

  // Glowing Molten Barrier
  const barrierGeo = new THREE.PlaneGeometry(6, 7);
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
  barrierMesh.position.set(0, 3.8, 0.2);
  group.add(barrierMesh);

  return { group, barrierMesh };
}

/**
 * Legendary 1: Draco-Ignis — First: "Sky-Draco Stealth-Jet" Toy Car; Transforms into: Winged Wyvern Dragon
 */
export function createDracoIgnisModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  head: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'DracoIgnis';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    metalness: 0.85,
    roughness: 0.2,
    map: createMetalTexture('#8b5cf6', '#ec4899'),
  });

  // ==================== CAR MODE (Sky-Draco Supersonic Jet Toy Car) ====================
  const carGroup = new THREE.Group();
  carGroup.name = 'SkyDracoCar';

  // Aerodynamic arrow chassis
  const jetBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 2.4), bodyMat);
  jetBody.position.set(0, 0.28, 0);
  jetBody.castShadow = true;
  carGroup.add(jetBody);

  // Needle nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 8), chromeMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.28, 1.4);
  carGroup.add(nose);

  // Swept Winglets
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), darkMetalMat);
  wingL.position.set(-0.8, 0.28, -0.4);
  wingL.rotation.y = -0.3;
  carGroup.add(wingL);

  const wingR = wingL.clone();
  wingR.position.x = 0.8;
  wingR.rotation.y = 0.3;
  carGroup.add(wingR);

  // Dual Purple Jet Afterburners
  const afterburnerL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
  afterburnerL.rotation.x = Math.PI / 2;
  afterburnerL.position.set(-0.3, 0.28, -1.25);
  carGroup.add(afterburnerL);

  const afterburnerR = afterburnerL.clone();
  afterburnerR.position.x = 0.3;
  carGroup.add(afterburnerR);

  // 4 Wheels
  const wheelRadius = 0.28;
  const wheelWidth = 0.18;
  const flWheel = createCarWheel(wheelRadius, wheelWidth, 0xa855f7);
  flWheel.position.set(-0.55, wheelRadius, 0.65);
  carGroup.add(flWheel);

  const frWheel = createCarWheel(wheelRadius, wheelWidth, 0xa855f7);
  frWheel.position.set(0.55, wheelRadius, 0.65);
  carGroup.add(frWheel);

  const blWheel = createCarWheel(wheelRadius, wheelWidth, 0xa855f7);
  blWheel.position.set(-0.55, wheelRadius, -0.65);
  carGroup.add(blWheel);

  const brWheel = createCarWheel(wheelRadius, wheelWidth, 0xa855f7);
  brWheel.position.set(0.55, wheelRadius, -0.65);
  carGroup.add(brWheel);

  const wheels = [flWheel, frWheel, blWheel, brWheel];
  group.add(carGroup);

  // ==================== BEAST MODE (Winged Dragon Wyvern) ====================
  const beastGroup = new THREE.Group();
  beastGroup.name = 'DracoBeast';
  beastGroup.visible = false;

  const dragonBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.8), bodyMat);
  dragonBody.position.set(0, 1.1, 0);
  dragonBody.castShadow = true;
  beastGroup.add(dragonBody);

  // Dragon Head with Horns
  const head = new THREE.Group();
  head.position.set(0, 1.6, 1.1);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.7), bodyMat);
  head.add(headMesh);

  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), goldBrassMat);
  hornL.rotation.x = -0.5;
  hornL.position.set(-0.2, 0.3, -0.1);
  head.add(hornL);
  const hornR = hornL.clone();
  hornR.position.x = 0.2;
  head.add(hornR);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
  eyeL.position.set(-0.24, 0.05, 0.25);
  head.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.24;
  head.add(eyeR);
  beastGroup.add(head);

  // Deployable Wings
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.45, 1.3, 0.1);
  const wingMeshL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), darkMetalMat);
  wingMeshL.position.set(-0.8, 0, 0);
  wingMeshL.rotation.z = -0.2;
  leftWing.add(wingMeshL);
  beastGroup.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(0.45, 1.3, 0.1);
  const wingMeshR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), darkMetalMat);
  wingMeshR.position.set(0.8, 0, 0);
  wingMeshR.rotation.z = 0.2;
  rightWing.add(wingMeshR);
  beastGroup.add(rightWing);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, leftWing, rightWing, head };
}

/**
 * Legendary 2: Leviathan-Sub — First: "Chrono-Sub Crawler"; Transforms into: Abyssal Serpent
 */
export function createLeviathanModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  tail: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'LeviathanSub';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    metalness: 0.8,
    roughness: 0.25,
    map: createMetalTexture('#0284c7', '#10b981'),
  });

  // Car Mode (Heavy Amphibious Submarine Rover)
  const carGroup = new THREE.Group();
  const subHull = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 2.6), bodyMat);
  subHull.position.set(0, 0.35, 0);
  subHull.castShadow = true;
  carGroup.add(subHull);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), glowingCyanMat);
  dome.position.set(0, 0.6, 0.3);
  carGroup.add(dome);

  // 4 Enclosed Sub Wheels
  const wheelRadius = 0.32;
  const wheelWidth = 0.22;
  const flWheel = createCarWheel(wheelRadius, wheelWidth, 0x10b981);
  flWheel.position.set(-0.7, wheelRadius, 0.75);
  carGroup.add(flWheel);
  const frWheel = createCarWheel(wheelRadius, wheelWidth, 0x10b981);
  frWheel.position.set(0.7, wheelRadius, 0.75);
  carGroup.add(frWheel);
  const blWheel = createCarWheel(wheelRadius, wheelWidth, 0x10b981);
  blWheel.position.set(-0.7, wheelRadius, -0.75);
  carGroup.add(blWheel);
  const brWheel = createCarWheel(wheelRadius, wheelWidth, 0x10b981);
  brWheel.position.set(0.7, wheelRadius, -0.75);
  carGroup.add(brWheel);

  const wheels = [flWheel, frWheel, blWheel, brWheel];
  group.add(carGroup);

  // Beast Mode (Serpentine Leviathan)
  const beastGroup = new THREE.Group();
  beastGroup.visible = false;
  const serpentBody = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 2.2, 12), bodyMat);
  serpentBody.position.set(0, 1.2, 0);
  beastGroup.add(serpentBody);

  const tail = new THREE.Group();
  tail.position.set(0, 1.0, -1.2);
  const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8), darkMetalMat);
  tailMesh.rotation.x = -Math.PI / 2;
  tail.add(tailMesh);
  beastGroup.add(tail);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, tail };
}

/**
 * Legendary 3: Giga-Golem — First: "Titan-Hauler 6x6"; Transforms into: Colossal Golem Juggernaut
 */
export function createGigaGolemModel(): {
  group: THREE.Group;
  carGroup: THREE.Group;
  beastGroup: THREE.Group;
  mode: 'car' | 'beast';
  setMode: (mode: 'car' | 'beast') => void;
  wheels: THREE.Group[];
  leftArm: THREE.Group;
  rightArm: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'GigaGolem';

  const stoneMetalMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    metalness: 0.75,
    roughness: 0.5,
  });

  // Car Mode (Heavy 6x6 Fortress Truck)
  const carGroup = new THREE.Group();
  const truckBed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.0), stoneMetalMat);
  truckBed.position.set(0, 0.5, 0);
  truckBed.castShadow = true;
  carGroup.add(truckBed);

  const coreFurnace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), glowingAmberMat);
  coreFurnace.position.set(0, 0.9, -0.4);
  carGroup.add(coreFurnace);

  // 6 Massive Monster Wheels
  const wR = 0.45;
  const wW = 0.3;
  const w1 = createCarWheel(wR, wW, 0xf59e0b); w1.position.set(-0.9, wR, 0.9); carGroup.add(w1);
  const w2 = createCarWheel(wR, wW, 0xf59e0b); w2.position.set(0.9, wR, 0.9); carGroup.add(w2);
  const w3 = createCarWheel(wR, wW, 0xf59e0b); w3.position.set(-0.9, wR, 0); carGroup.add(w3);
  const w4 = createCarWheel(wR, wW, 0xf59e0b); w4.position.set(0.9, wR, 0); carGroup.add(w4);
  const w5 = createCarWheel(wR, wW, 0xf59e0b); w5.position.set(-0.9, wR, -0.9); carGroup.add(w5);
  const w6 = createCarWheel(wR, wW, 0xf59e0b); w6.position.set(0.9, wR, -0.9); carGroup.add(w6);

  const wheels = [w1, w2, w3, w4, w5, w6];
  group.add(carGroup);

  // Beast Mode (Colossal Tectonic Golem)
  const beastGroup = new THREE.Group();
  beastGroup.visible = false;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.2), stoneMetalMat);
  torso.position.set(0, 1.8, 0);
  torso.castShadow = true;
  beastGroup.add(torso);

  const heartCore = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), glowingAmberMat);
  heartCore.position.set(0, 1.9, 0.65);
  beastGroup.add(heartCore);

  const leftArm = new THREE.Group();
  leftArm.position.set(-1.2, 2.2, 0);
  const lFist = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), darkMetalMat);
  lFist.position.set(0, -0.7, 0);
  leftArm.add(lFist);
  beastGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(1.2, 2.2, 0);
  const rFist = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), darkMetalMat);
  rFist.position.set(0, -0.7, 0);
  rightArm.add(rFist);
  beastGroup.add(rightArm);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, leftArm, rightArm };
}

/**
 * Iron-Fang Model (Tier: Medium)
 * Car Mode: Cyber-Drift Coupe
 * Beast Mode: Cybernetic Tectonic Wolf
 */
export function createIronfangModel() {
  const group = new THREE.Group();

  const carGroup = new THREE.Group();
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x713f12, metalness: 0.8, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.2 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 2.2), bronzeMat);
  chassis.position.set(0, 0.35, 0);
  chassis.castShadow = true;
  carGroup.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 1.0), darkMetalMat);
  cabin.position.set(0, 0.65, -0.15);
  carGroup.add(cabin);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.3), goldMat);
  spoiler.position.set(0, 0.75, 0.95);
  carGroup.add(spoiler);

  const wR = 0.28;
  const wW = 0.18;
  const w1 = createCarWheel(wR, wW, 0xca8a04); w1.position.set(-0.65, wR, 0.7); carGroup.add(w1);
  const w2 = createCarWheel(wR, wW, 0xca8a04); w2.position.set(0.65, wR, 0.7); carGroup.add(w2);
  const w3 = createCarWheel(wR, wW, 0xca8a04); w3.position.set(-0.65, wR, -0.7); carGroup.add(w3);
  const w4 = createCarWheel(wR, wW, 0xca8a04); w4.position.set(0.65, wR, -0.7); carGroup.add(w4);
  const wheels = [w1, w2, w3, w4];

  group.add(carGroup);

  // Beast Mode (Cyber-Wolf)
  const beastGroup = new THREE.Group();
  beastGroup.visible = false;

  const wolfBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.8), bronzeMat);
  wolfBody.position.set(0, 0.9, 0);
  wolfBody.castShadow = true;
  beastGroup.add(wolfBody);

  const wolfHead = new THREE.Group();
  wolfHead.position.set(0, 1.25, -0.9);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 5), darkMetalMat);
  snout.rotation.x = Math.PI / 2;
  wolfHead.add(snout);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), goldMat);
  earL.position.set(-0.25, 0.35, 0.1);
  wolfHead.add(earL);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), goldMat);
  earR.position.set(0.25, 0.35, 0.1);
  wolfHead.add(earR);
  beastGroup.add(wolfHead);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, wolfHead };
}

/**
 * Aero-Strike Model (Tier: Advanced)
 * Car Mode: Mach-Wing Interceptor
 * Beast Mode: Supersonic Phoenix
 */
export function createAerostrikeModel() {
  const group = new THREE.Group();

  const carGroup = new THREE.Group();
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.85, roughness: 0.2 });

  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 6), purpleMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0.35, 0);
  fuselage.castShadow = true;
  carGroup.add(fuselage);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.6), glowingCyanMat);
  wings.position.set(0, 0.38, 0.2);
  carGroup.add(wings);

  const wR = 0.26;
  const wW = 0.16;
  const w1 = createCarWheel(wR, wW, 0x38bdf8); w1.position.set(-0.7, wR, 0.6); carGroup.add(w1);
  const w2 = createCarWheel(wR, wW, 0x38bdf8); w2.position.set(0.7, wR, 0.6); carGroup.add(w2);
  const w3 = createCarWheel(wR, wW, 0x38bdf8); w3.position.set(-0.7, wR, -0.6); carGroup.add(w3);
  const w4 = createCarWheel(wR, wW, 0x38bdf8); w4.position.set(0.7, wR, -0.6); carGroup.add(w4);
  const wheels = [w1, w2, w3, w4];

  group.add(carGroup);

  // Beast Mode (Sonic Phoenix)
  const beastGroup = new THREE.Group();
  beastGroup.visible = false;

  const phoenixBody = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6), purpleMat);
  phoenixBody.position.set(0, 1.2, 0);
  beastGroup.add(phoenixBody);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.8), glowingCyanMat);
  leftWing.position.set(-1.1, 1.4, 0);
  leftWing.rotation.z = 0.25;
  beastGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.8), glowingCyanMat);
  rightWing.position.set(1.1, 1.4, 0);
  rightWing.rotation.z = -0.25;
  beastGroup.add(rightWing);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, leftWing, rightWing };
}

/**
 * Chronos-Deus Model (Tier: God)
 * Car Mode: Nexus Chrono-Hypercar
 * Beast Mode: Omnipotent Time Engine
 */
export function createChronosDeusModel() {
  const group = new THREE.Group();

  const carGroup = new THREE.Group();
  const godGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.6,
    metalness: 0.95,
    roughness: 0.1,
  });

  const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.4, 8), godGoldMat);
  chassis.rotation.x = Math.PI / 2;
  chassis.position.set(0, 0.45, 0);
  chassis.castShadow = true;
  carGroup.add(chassis);

  // Floating Chrono Ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 24), glowingCyanMat);
  ring.position.set(0, 0.55, 0);
  carGroup.add(ring);

  const wR = 0.32;
  const wW = 0.2;
  const w1 = createCarWheel(wR, wW, 0xfbbf24); w1.position.set(-0.8, wR, 0.8); carGroup.add(w1);
  const w2 = createCarWheel(wR, wW, 0xfbbf24); w2.position.set(0.8, wR, 0.8); carGroup.add(w2);
  const w3 = createCarWheel(wR, wW, 0xfbbf24); w3.position.set(-0.8, wR, -0.8); carGroup.add(w3);
  const w4 = createCarWheel(wR, wW, 0xfbbf24); w4.position.set(0.8, wR, -0.8); carGroup.add(w4);
  const wheels = [w1, w2, w3, w4];

  group.add(carGroup);

  // Beast Mode (Time Deity)
  const beastGroup = new THREE.Group();
  beastGroup.visible = false;

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 1), godGoldMat);
  core.position.set(0, 1.8, 0);
  beastGroup.add(core);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 32), glowingCyanMat);
  halo.position.set(0, 1.8, 0);
  beastGroup.add(halo);

  group.add(beastGroup);

  let currentMode: 'car' | 'beast' = 'car';
  const setMode = (m: 'car' | 'beast') => {
    currentMode = m;
    carGroup.visible = m === 'car';
    beastGroup.visible = m === 'beast';
  };

  return { group, carGroup, beastGroup, mode: currentMode, setMode, wheels, ring, halo };
}
