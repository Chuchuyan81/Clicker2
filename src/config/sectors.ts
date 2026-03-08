// Типы
export type SectorId = 'asteroid_belt' | 'mars_orbit' | 'saturn_rings' | 'kuiper_belt' | 'accretion_disk';

export type ResourceId = 
  | 'metal' | 'ice' | 'crystal' | 'iridium' // Tier 1
  | 'rust_dust' | 'red_obsidian' | 'mars_ice' | 'phobos_core' // Tier 2
  | 'liquid_methane' | 'dark_matter' | 'hexagonal_ice' // Tier 3
  | 'frozen_nitrogen' | 'isotope_238' // Tier 4
  | 'exotic_matter' | 'pure_energy'; // Tier 5

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
  // Tier 3 - Saturn Rings
  liquid_methane: {
    id: 'liquid_methane',
    nameRu: 'Жидкий метан',
    nameEn: 'Liquid Methane',
    basePrice: 150,
    spawnChance: 0.6,
    maxHits: 1,
    yield: 2,
  },
  dark_matter: {
    id: 'dark_matter',
    nameRu: 'Темная материя',
    nameEn: 'Dark Matter',
    basePrice: 500,
    spawnChance: 0.3,
    maxHits: 2,
    yield: 4,
  },
  hexagonal_ice: {
    id: 'hexagonal_ice',
    nameRu: 'Гексагональный лед',
    nameEn: 'Hexagonal Ice',
    basePrice: 1200,
    spawnChance: 0.1,
    maxHits: 3,
    yield: 6,
  },
  // Tier 4 - Kuiper Belt
  frozen_nitrogen: {
    id: 'frozen_nitrogen',
    nameRu: 'Замерзший азот',
    nameEn: 'Frozen Nitrogen',
    basePrice: 2500,
    spawnChance: 0.7,
    maxHits: 1,
    yield: 2,
  },
  isotope_238: {
    id: 'isotope_238',
    nameRu: 'Изотоп-238',
    nameEn: 'Isotope-238',
    basePrice: 8000,
    spawnChance: 0.3,
    maxHits: 3,
    yield: 6,
  },
  // Tier 5 - Accretion Disk
  exotic_matter: {
    id: 'exotic_matter',
    nameRu: 'Экзотическая материя',
    nameEn: 'Exotic Matter',
    basePrice: 50000,
    spawnChance: 0.8,
    maxHits: 2,
    yield: 4,
  },
  pure_energy: {
    id: 'pure_energy',
    nameRu: 'Чистая энергия',
    nameEn: 'Pure Energy',
    basePrice: 200000,
    spawnChance: 0.2,
    maxHits: 4,
    yield: 10,
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
    maxUpgrades: { refinery: 25, storage: 25, hangar: 10 },
    radarDeepScanBasePrices: [50000, 200000, 800000],
  },
  saturn_rings: {
    id: 'saturn_rings',
    name: 'Кольца Сатурна',
    unlockCost: 250000,
    resources: ['liquid_methane', 'dark_matter', 'hexagonal_ice'],
    maxUpgrades: { refinery: 40, storage: 40, hangar: 15 },
    radarDeepScanBasePrices: [250000, 1000000, 4000000],
  },
  kuiper_belt: {
    id: 'kuiper_belt',
    name: 'Пояс Койпера',
    unlockCost: 1500000,
    resources: ['frozen_nitrogen', 'isotope_238'],
    maxUpgrades: { refinery: 60, storage: 60, hangar: 20 },
    radarDeepScanBasePrices: [1500000, 6000000, 24000000],
  },
  accretion_disk: {
    id: 'accretion_disk',
    name: 'Аккреционный диск',
    unlockCost: 10000000,
    resources: ['exotic_matter', 'pure_energy'],
    maxUpgrades: { refinery: 100, storage: 100, hangar: 30 },
    radarDeepScanBasePrices: [10000000, 40000000, 160000000],
  },
};
