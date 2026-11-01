/**
 * Gearfall Meadow World Scene Setup.
 * Builds the explorable terrain, river, foliage, ruins, campfire, and environment lighting.
 */

import * as THREE from 'three';
import {
  createGrassTexture,
  createStoneTexture,
  createWaterTexture,
  getMeadowHeight,
  setupStudioEnvironment,
} from './threeUtils';
import {
  createAncientGearRuin,
  createGearTree,
  createCrystalCaveModel,
  createClockworkCitadelModel,
  createMagmaSanctumModel,
} from './proceduralModels';

export interface MeadowWorld {
  scene: THREE.Scene;
  terrainMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  decorations: THREE.Group;
  particles: THREE.Points;
  updateParticles: (dt: number) => void;
  crystalCave: any;
  citadel: any;
  magmaSanctum: any;
  unlockLocation: (id: string) => void;
}

export function buildGearfallMeadow(renderer: THREE.WebGLRenderer): MeadowWorld {
  const scene = new THREE.Scene();

  // Sky and Horizon fog
  const skyColor = new THREE.Color(0xb8e2f2);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(0xcbe6f5, 0.014);

  // Setup Studio Environment Reflection
  setupStudioEnvironment(scene, renderer);

  // 1. Lighting Rig
  // Warm Key Light (Sun)
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  dirLight.position.set(45, 60, 35);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 160;
  const shadowDist = 45;
  dirLight.shadow.camera.left = -shadowDist;
  dirLight.shadow.camera.right = shadowDist;
  dirLight.shadow.camera.top = shadowDist;
  dirLight.shadow.camera.bottom = -shadowDist;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  // Cool Sky / Warm Meadow Fill (HemisphereLight)
  const hemiLight = new THREE.HemisphereLight(0xdff2fd, 0x3d6b38, 1.1);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Soft Rim light
  const rimLight = new THREE.DirectionalLight(0xa5f3fc, 0.6);
  rimLight.position.set(-35, 20, -35);
  scene.add(rimLight);

  // 2. Terrain Generation using Meadow Heightmap
  const terrainSize = 180;
  const terrainSegments = 100;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getMeadowHeight(vx, vz);
    posAttr.setY(i, vy);
  }
  terrainGeo.computeVertexNormals();

  const grassTexture = createGrassTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 3. Gearfall Winding River
  const waterGeo = new THREE.PlaneGeometry(16, 120, 20, 40);
  waterGeo.rotateX(-Math.PI / 2);
  const waterPos = waterGeo.attributes.position;
  for (let i = 0; i < waterPos.count; i++) {
    const vz = waterPos.getZ(i);
    const riverXCenter = -20 + Math.sin(vz * 0.04) * 8;
    const curX = waterPos.getX(i);
    waterPos.setX(i, riverXCenter + (curX / 16) * 14);
    waterPos.setY(i, -0.6); // Water level
  }
  waterGeo.computeVertexNormals();

  const waterTexture = createWaterTexture();
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTexture,
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // River Wooden Bridge
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-20, getMeadowHeight(-20, 0) + 0.1, 0);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const bridgePlank = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4), woodMat);
  bridgePlank.castShadow = true;
  bridgePlank.receiveShadow = true;
  bridgeGroup.add(bridgePlank);

  // Bridge railings
  const railGeo = new THREE.BoxGeometry(14, 0.15, 0.15);
  const railL = new THREE.Mesh(railGeo, woodMat);
  railL.position.set(0, 0.6, -1.9);
  bridgeGroup.add(railL);
  const railR = railL.clone();
  railR.position.z = 1.9;
  bridgeGroup.add(railR);
  scene.add(bridgeGroup);

  // 4. Props & Foliage Group
  const decorations = new THREE.Group();

  // Plant ancient gear-trees
  const treePositions = [
    { x: 12, z: -15 },
    { x: 18, z: -25 },
    { x: -5, z: -35 },
    { x: 25, z: 10 },
    { x: 30, z: -8 },
    { x: -35, z: -18 },
    { x: -45, z: 20 },
    { x: -8, z: 32 },
    { x: 15, z: 42 },
    { x: -28, z: 45 },
    { x: 42, z: 28 },
    { x: -14, z: -55 },
    { x: 38, z: -40 },
    { x: -42, z: -40 },
  ];

  treePositions.forEach((pt) => {
    const tree = createGearTree();
    const y = getMeadowHeight(pt.x, pt.z);
    tree.position.set(pt.x, y, pt.z);
    const scale = 0.85 + Math.random() * 0.35;
    tree.scale.set(scale, scale, scale);
    tree.rotation.y = Math.random() * Math.PI * 2;
    decorations.add(tree);
  });

  // Ancient Fallen Gears / Ruins
  const gearRuins = [
    { x: 28, z: -18, r: 3.5, rotX: 0.3, rotZ: 0.4 },
    { x: -38, z: 12, r: 4.5, rotX: -0.2, rotZ: 0.8 },
    { x: 10, z: 50, r: 5.0, rotX: 0.5, rotZ: 0.1 },
    { x: -10, z: -48, r: 3.0, rotX: 0.1, rotZ: -0.5 },
  ];

  gearRuins.forEach((g) => {
    const ruin = createAncientGearRuin(g.r);
    const y = getMeadowHeight(g.x, g.z) + g.r * 0.4;
    ruin.position.set(g.x, y, g.z);
    ruin.rotation.x = g.rotX;
    ruin.rotation.z = g.rotZ;
    decorations.add(ruin);
  });

  // Chief Torren Outpost Campfire
  const outpostGroup = new THREE.Group();
  outpostGroup.position.set(4, getMeadowHeight(4, 4), 4);

  // Campfire stones
  const stoneMat = new THREE.MeshStandardMaterial({
    map: createStoneTexture(),
    roughness: 0.9,
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), stoneMat);
    stone.position.set(Math.cos(angle) * 0.8, 0.1, Math.sin(angle) * 0.8);
    stone.castShadow = true;
    outpostGroup.add(stone);
  }

  // Glowing fire embers
  const fireCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6b00 })
  );
  fireCore.position.set(0, 0.3, 0);
  outpostGroup.add(fireCore);

  const fireLight = new THREE.PointLight(0xff7700, 2.0, 8);
  fireLight.position.set(0, 0.6, 0);
  outpostGroup.add(fireLight);

  // Outpost Workbench & Gear crates
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
  crate1.position.set(2.2, 0.4, 0.5);
  crate1.castShadow = true;
  outpostGroup.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), crateMat);
  crate2.position.set(2.2, 1.1, 0.5);
  outpostGroup.add(crate2);

  decorations.add(outpostGroup);

  scene.add(decorations);

  // Secret Location 1: The Sunken Crystal Grotto (Cave at x: -36, z: -42)
  const crystalCave = createCrystalCaveModel();
  const caveY = getMeadowHeight(-36, -42);
  crystalCave.group.position.set(-36, caveY, -42);
  crystalCave.group.rotation.y = Math.PI * 0.25;
  scene.add(crystalCave.group);

  // Secret Location 2: Clockwork Citadel Facility (Building at x: 35, z: -38)
  const citadel = createClockworkCitadelModel();
  const citadelY = getMeadowHeight(35, -38);
  citadel.group.position.set(35, citadelY, -38);
  citadel.group.rotation.y = -Math.PI * 0.35;
  scene.add(citadel.group);

  // Secret Location 3: Magma Forge Sanctum (Sanctum at x: -12, z: 52)
  const magmaSanctum = createMagmaSanctumModel();
  const magmaY = getMeadowHeight(-12, 52);
  magmaSanctum.group.position.set(-12, magmaY, 52);
  magmaSanctum.group.rotation.y = Math.PI;
  scene.add(magmaSanctum.group);

  const unlockLocation = (id: string) => {
    if (id === 'crystal_cave') {
      crystalCave.barrierMesh.visible = false;
    } else if (id === 'clockwork_citadel') {
      citadel.doorL.position.x = -3.8;
      citadel.doorR.position.x = 3.8;
      citadel.centralGear.rotation.z += Math.PI;
    } else if (id === 'magma_sanctum') {
      magmaSanctum.barrierMesh.visible = false;
    }
  };

  // 5. Ambient Atmospheric Particles (Pollen & Aether Shimmer)
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 120;
    particlePositions[i + 1] = Math.random() * 14 + 1;
    particlePositions[i + 2] = (Math.random() - 0.5) * 120;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.28,
    transparent: true,
    opacity: 0.6,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const updateParticles = (dt: number) => {
    const pos = particleGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      let y = pos.getY(i) - dt * 0.4;
      if (y < 0.5) y = 14;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  };

  return {
    scene,
    terrainMesh,
    waterMesh,
    decorations,
    particles,
    updateParticles,
    crystalCave,
    citadel,
    magmaSanctum,
    unlockLocation,
  };
}
