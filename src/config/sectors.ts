// Типы
export type SectorId = 'asteroid_belt' | 'mars_orbit';

export type ResourceId = 
  | 'metal' | 'ice' | 'crystal' | 'iridium' // Tier 1
  | 'rust_dust' | 'red_obsidian' | 'mars_ice' | 'phobos_core'; // Tier 2

export interface ResourceData {
  id: ResourceId;
  nameRu: string;
  nameEn: string;
  basePrice: number;
  spawnChance: number; // 0.0 - 1.0
  maxHits: number;
  yield: number;
}

export interface SectorConfig {
  id: SectorId;
  name: string;
  unlockCost: number;
  resources: ResourceId[]; // Какие ресурсы спавнятся в этом секторе
  maxUpgrades: {
    refinery: number;
    storage: number;
    hangar: number;
  };
  radarDeepScanBasePrices: number[]; // Цены для апгрейда радара (уровни 1, 2, 3)
}

export const RESOURCE_CONFIG: Record<ResourceId, ResourceData> = {
  // Tier 1 - Asteroid Belt
  metal: {
    id: 'metal',
    nameRu: 'Металл',
    nameEn: 'Metal',
    basePrice: 1,
    spawnChance: 0.6,
    maxHits: 1,
    yield: 2,
  },
  ice: {
    id: 'ice',
    nameRu: 'Космический лед',
    nameEn: 'Space Ice',
    basePrice: 5,
    spawnChance: 0.25,
    maxHits: 2,
    yield: 4,
  },
  crystal: {
    id: 'crystal',
    nameRu: 'Кристаллы',
    nameEn: 'Crystals',
    basePrice: 25,
    spawnChance: 0.1,
    maxHits: 3,
    yield: 6,
  },
  iridium: {
    id: 'iridium',
    nameRu: 'Иридий',
    nameEn: 'Iridium',
    basePrice: 100,
    spawnChance: 0.05,
    maxHits: 3,
    yield: 6,
  },
  // Tier 2 - Mars Orbit
  rust_dust: {
    id: 'rust_dust',
    nameRu: 'Ржавая пыль',
    nameEn: 'Rust Dust',
    basePrice: 500,
    spawnChance: 0.6,
    maxHits: 1,
    yield: 2,
  },
  red_obsidian: {
    id: 'red_obsidian',
    nameRu: 'Красный Обсидиан',
    nameEn: 'Red Obsidian',
    basePrice: 2500,
    spawnChance: 0.25,
    maxHits: 2,
    yield: 4,
  },
  mars_ice: {
    id: 'mars_ice',
    nameRu: 'Марсианский Лед',
    nameEn: 'Mars Ice',
    basePrice: 12500,
    spawnChance: 0.1,
    maxHits: 3,
    yield: 6,
  },
  phobos_core: {
    id: 'phobos_core',
    nameRu: 'Ядро Фобоса',
    nameEn: 'Phobos Core',
    basePrice: 50000,
    spawnChance: 0.05,
    maxHits: 3,
    yield: 6,
  },
};

export const SECTORS_CONFIG: Record<SectorId, SectorConfig> = {
  asteroid_belt: {
    id: 'asteroid_belt',
    name: 'Пояс Астероидов',
    unlockCost: 0,
    resources: ['metal', 'ice', 'crystal', 'iridium'],
    maxUpgrades: { refinery: 10, storage: 10, hangar: 5 },
    radarDeepScanBasePrices: [1000, 4000, 16000],
  },
  mars_orbit: {
    id: 'mars_orbit',
    name: 'Орбита Марса',
    unlockCost: 50000,
    resources: ['rust_dust', 'red_obsidian', 'mars_ice', 'phobos_core'],
    maxUpgrades: { refinery: 20, storage: 20, hangar: 10 },
    radarDeepScanBasePrices: [50000, 200000, 800000],
  }
};
