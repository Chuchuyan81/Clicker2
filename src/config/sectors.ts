import { ResourceType, RarityLevel } from '../types';

// Типы
export type SectorId = 'asteroid_belt' | 'mars_orbit' | 'jupiter_moons' | 'saturn_rings' | 'kuiper_belt';

export type ResourceId = 
  | 'metal' | 'ice' | 'crystal' | 'iridium' // Tier 1
  | 'red_obsidian' | 'martian_dust' // Tier 2
  | 'frozen_gas' | 'liquid_metal_core' // Tier 3
  | 'ring_ice' | 'dark_matter_t4' // Tier 4 (renamed dark_matter to avoid collision if any)
  | 'antimatter' | 'alien_relics'; // Tier 5

export interface ResourceData {
  id: ResourceId;
  nameRu: string;
  nameEn: string;
  basePrice: number;
  spawnChance: number; // 0.0 - 1.0
  rarity: RarityLevel;
  maxHits: number;
  yield: number;
}

export interface SectorConfig {
  id: SectorId;
  name: string;
  unlockCost: number;
  tier: number;
  averageDistance: number;
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
    rarity: 'common',
    maxHits: 1,
    yield: 2,
  },
  ice: {
    id: 'ice',
    nameRu: 'Космический лед',
    nameEn: 'Space Ice',
    basePrice: 5,
    spawnChance: 0.25,
    rarity: 'uncommon',
    maxHits: 2,
    yield: 4,
  },
  crystal: {
    id: 'crystal',
    nameRu: 'Кристаллы',
    nameEn: 'Crystals',
    basePrice: 25,
    spawnChance: 0.1,
    rarity: 'rare',
    maxHits: 3,
    yield: 6,
  },
  iridium: {
    id: 'iridium',
    nameRu: 'Иридий',
    nameEn: 'Iridium',
    basePrice: 100,
    spawnChance: 0.05,
    rarity: 'legendary',
    maxHits: 3,
    yield: 6,
  },
  // Tier 2 - Mars Orbit
  red_obsidian: {
    id: 'red_obsidian',
    nameRu: 'Красный Обсидиан',
    nameEn: 'Red Obsidian',
    basePrice: 500,
    spawnChance: 0.7,
    rarity: 'common',
    maxHits: 2,
    yield: 10,
  },
  martian_dust: {
    id: 'martian_dust',
    nameRu: 'Марсианская Пыль',
    nameEn: 'Martian Dust',
    basePrice: 2000,
    spawnChance: 0.3,
    rarity: 'uncommon',
    maxHits: 3,
    yield: 20,
  },
  // Tier 3 - Jupiter Moons
  frozen_gas: {
    id: 'frozen_gas',
    nameRu: 'Замерзший Газ',
    nameEn: 'Frozen Gas',
    basePrice: 10000,
    spawnChance: 0.75,
    rarity: 'common',
    maxHits: 2,
    yield: 50,
  },
  liquid_metal_core: {
    id: 'liquid_metal_core',
    nameRu: 'Жидкометаллическое Ядро',
    nameEn: 'Liquid Metal Core',
    basePrice: 50000,
    spawnChance: 0.25,
    rarity: 'uncommon',
    maxHits: 4,
    yield: 100,
  },
  // Tier 4 - Saturn Rings
  ring_ice: {
    id: 'ring_ice',
    nameRu: 'Кольцевой Лед',
    nameEn: 'Ring Ice',
    basePrice: 100000,
    spawnChance: 0.8,
    rarity: 'common',
    maxHits: 3,
    yield: 250,
  },
  dark_matter_t4: {
    id: 'dark_matter_t4',
    nameRu: 'Темная материя',
    nameEn: 'Dark Matter',
    basePrice: 500000,
    spawnChance: 0.2,
    rarity: 'rare',
    maxHits: 5,
    yield: 500,
  },
  // Tier 5 - Kuiper Belt / Oort Cloud
  antimatter: {
    id: 'antimatter',
    nameRu: 'Антиматерия',
    nameEn: 'Antimatter',
    basePrice: 1000000,
    spawnChance: 0.9,
    rarity: 'common',
    maxHits: 4,
    yield: 1000,
  },
  alien_relics: {
    id: 'alien_relics',
    nameRu: 'Реликты пришельцев',
    nameEn: 'Alien Relics',
    basePrice: 5000000,
    spawnChance: 0.1,
    rarity: 'legendary',
    maxHits: 6,
    yield: 2500,
  },
};

export const SECTORS_CONFIG: Record<SectorId, SectorConfig> = {
  asteroid_belt: {
    id: 'asteroid_belt',
    name: 'Пояс Астероидов',
    unlockCost: 0,
    tier: 1,
    averageDistance: 500,
    resources: ['metal', 'ice', 'crystal', 'iridium'],
    maxUpgrades: { refinery: 10, storage: 10, hangar: 5 },
    radarDeepScanBasePrices: [1000, 4000, 16000],
  },
  mars_orbit: {
    id: 'mars_orbit',
    name: 'Орбита Марса',
    unlockCost: 50000,
    tier: 2,
    averageDistance: 700,
    resources: ['red_obsidian', 'martian_dust'],
    maxUpgrades: { refinery: 25, storage: 25, hangar: 10 },
    radarDeepScanBasePrices: [50000, 200000, 800000],
  },
  jupiter_moons: {
    id: 'jupiter_moons',
    name: 'Спутники Юпитера',
    unlockCost: 1500000,
    tier: 3,
    averageDistance: 900,
    resources: ['frozen_gas', 'liquid_metal_core'],
    maxUpgrades: { refinery: 40, storage: 40, hangar: 15 },
    radarDeepScanBasePrices: [1500000, 6000000, 24000000],
  },
  saturn_rings: {
    id: 'saturn_rings',
    name: 'Кольца Сатурна',
    unlockCost: 50000000,
    tier: 4,
    averageDistance: 1200,
    resources: ['ring_ice', 'dark_matter_t4'],
    maxUpgrades: { refinery: 60, storage: 60, hangar: 20 },
    radarDeepScanBasePrices: [50000000, 200000000, 800000000],
  },
  kuiper_belt: {
    id: 'kuiper_belt',
    name: 'Пояс Койпера',
    unlockCost: 1000000000,
    tier: 5,
    averageDistance: 1500,
    resources: ['antimatter', 'alien_relics'],
    maxUpgrades: { refinery: 100, storage: 100, hangar: 30 },
    radarDeepScanBasePrices: [1000000000, 4000000000, 16000000000],
  },
};
