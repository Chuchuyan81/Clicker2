import { Language } from './translations';
import { SectorId } from './config/sectors';
export type { Language };

export type ResourceType = 
  | "metal" | "ice" | "crystal" | "iridium" // Tier 1
  | "rust_dust" | "red_obsidian" | "mars_ice" | "phobos_core"; // Tier 2
export type DroneType = 'basic' | 'scout' | 'heavy';

export interface Resource {
  id: ResourceType;
  name: string;
  basePrice: number;
  rarity: number;
}

export type DroneState = 'flying_out' | 'offscreen_wait' | 'returning' | 'unloading_wait';
export type TransportState = 'idle' | 'flying_out' | 'offscreen_wait' | 'returning';

export interface Drone {
  id: string;
  type: DroneType;
  speed: number;        // время полета в одну сторону в секундах
  miningRate: number;   // ресурсов за цикл
  capacity: number;
  targetResource: ResourceType;
  progress: number;     // 0 to 1
  state: DroneState;
  // Параметры траектории
  angle: number;        // угол вылета
  curveOffset: number;  // смещение для кривизны (bezier)
  distance: number;     // дальность вылета
  timer: number;        // таймер для состояний ожидания (мс)
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
}

export interface Storage {
  capacity: number;
  current: Record<ResourceType, number>;
}

export interface Transport {
  state: TransportState;
  isActive: boolean;
  travelTime: number;
  progress: number; // 0 to 1
  timer: number;    // таймер для состояний ожидания (мс)
  // Параметры траектории
  angle: number;        // угол вылета
  curveOffset: number;  // смещение для кривизны (bezier)
  distance: number;     // дальность вылета
}

export interface Notification {
  id: string;
  type: 'sale' | 'info';
  value: string;
  x: number;
  y: number;
  opacity: number;
}

export interface GameState {
  credits: number;
  lastSeen: number;
  baseLevel: number;
  boostEndTime: number;
  boostMiningMultiplier: number;
  lastSaleTimestamp: number;
  resources: Record<ResourceType, Resource>;
  drones: Drone[];
  storage: Storage;
  transport: Transport;
  notifications: Notification[];
  upgrades: Record<string, Upgrade>;
  automationEnabled: boolean;
  language: Language;
  multipliers: {
    price: number;
    miningRate: number;
    speed: number;
  };
  asteroids: ClickableAsteroid[];
  isGameActive: boolean;
  currentSectorId: SectorId;
  discoveredResources: ResourceType[];
  radar: RadarState;
}

export interface ClickableAsteroid {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  hits: number;
  maxHits: number;
  resourceType: ResourceType;
}

export type RadarCellType = 'empty' | 'resource' | 'hazard';

export interface RadarCell {
  id: string; // Format: "x-y"
  x: number;
  y: number;
  type: RadarCellType;
  resourceDrop?: ResourceType;
  revealed: boolean;
  adjacentCount: number; // Count of resources+hazards in 8 neighbors
}

export interface RadarUpgrades {
  battery: number;   // Level (affects clicksRemaining)
  deepScan: number;  // Level (unlocks new resources)
  gridSize: number;  // Level (0: 5x5, 1: 6x6, 2: 8x8)
  sonar: number;     // Level (auto-reveal count)
}

export interface RadarState {
  energy: number;
  maxEnergy: number;
  energyTimerMs: number;
  rechargeRateMs: number;
  upgrades: RadarUpgrades;
  isActive: boolean;
  grid: RadarCell[];
  clicksRemaining: number;
  sessionEarnedCR: number;
  sessionResources: Record<ResourceType, number>;
}
