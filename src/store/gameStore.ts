import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, ResourceType, Drone, Resource, DroneType, Upgrade, RadarUpgrades, LogEntry, LogType } from '../types';
import { translations, Language } from '../translations';
import { generateRadarGrid, revealEmptyCells } from '../utils/radarUtils';
import { SECTORS_CONFIG, RESOURCE_CONFIG, SectorId } from '../config/sectors';

interface GameStore extends GameState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addCredits: (amount: number) => void;
  updateDrones: (deltaTime: number) => void;
  updateTransport: (deltaTime: number) => void;
  updateNotifications: (deltaTime: number) => void;
  startTransport: () => void;
  addResourceToStorage: (type: ResourceType, amount: number) => boolean;
  addNotification: (type: 'sale' | 'info', value: string) => void;
  activateMiningBurst: () => void;
  buyDrone: (type: DroneType) => boolean;
  purchaseUpgrade: (id: string) => boolean;
  setLanguage: (lang: Language) => void;
  applyOfflineProgress: (seconds: number) => void;
  manualMine: (id: string, x: number, y: number) => void;
  startGame: () => void;
  exitToMenu: () => void;
  resetGame: () => void;
  warpToSector: (id: SectorId) => void;
  replenishEnergy: () => void; // New action for Tier 4
  startRadarScan: () => void;
  clickRadarCell: (id: string) => void;
  closeRadar: () => void;
  upgradeRadar: (id: keyof RadarUpgrades) => boolean;
  completeIntro: () => void;
  nextTutorialStep: () => void;
  addLog: (text: string, type?: LogType) => void;
  reduceDebt: (amount: number) => void;
}

const DRONE_CONFIGS: Record<DroneType, { speed: number, miningRate: number, cost: number, name: string, capacity: number }> = {
  basic: { name: 'Basic Drone', speed: 3, miningRate: 5, cost: 50, capacity: 50 },
  scout: { name: 'Scout Drone', speed: 2.5, miningRate: 3, cost: 150, capacity: 20 },
  heavy: { name: 'Heavy Hauler', speed: 8, miningRate: 25, cost: 300, capacity: 200 },
};

const INITIAL_UPGRADES: Record<string, Upgrade> = {
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    description: 'Increases selling price of resources',
    baseCost: 100,
    cost: 100,
    level: 0,
    maxLevel: 10,
    costMultiplier: 1.8,
  },
  cargo_bay: {
    id: 'cargo_bay',
    name: 'Cargo Bay',
    description: 'Increases maximum storage capacity',
    baseCost: 150,
    cost: 150,
    level: 0,
    maxLevel: 10,
    costMultiplier: 2,
  },
  hangar: {
    id: 'hangar',
    name: 'Hangar',
    description: 'Increases maximum number of drones',
    baseCost: 200,
    cost: 200,
    level: 0,
    maxLevel: 5,
    costMultiplier: 3,
  },
  automation: {
    id: 'automation',
    name: 'Automation',
    description: 'Auto-launches transport at 80% storage',
    baseCost: 500,
    cost: 500,
    level: 0,
    maxLevel: 1,
    costMultiplier: 1,
  },
};

const INITIAL_RESOURCES: Record<ResourceType, Resource> = Object.entries(RESOURCE_CONFIG).reduce((acc, [id, data]) => {
  acc[id as ResourceType] = {
    id: id as ResourceType,
    name: data.nameRu,
    basePrice: data.basePrice,
    rarity: data.spawnChance,
  };
  return acc;
}, {} as Record<ResourceType, Resource>);

const BOOST_DURATION_MS = 10_000;
const BOOST_MINING_MULTIPLIER = 1.5;

const INITIAL_RADAR_STATE = {
  energy: 3,
  maxEnergy: 3,
  energyTimerMs: 0,
  rechargeRateMs: 300_000, // 5 minutes
  upgrades: {
    battery: 0,
    deepScan: 0,
    gridSize: 0,
    sonar: 0,
  },
  isActive: false,
  grid: [],
  clicksRemaining: 0,
  sessionEarnedCR: 0,
  sessionResources: Object.keys(RESOURCE_CONFIG).reduce((acc, id) => {
    acc[id as ResourceType] = 0;
    return acc;
  }, {} as Record<ResourceType, number>),
};

const INITIAL_STATE_DATA = {
  credits: 0,
  lastSeen: Date.now(),
  baseLevel: 1,
  boostEndTime: 0,
  boostMiningMultiplier: 1,
  lastSaleTimestamp: 0,
  resources: INITIAL_RESOURCES,
  automationEnabled: false,
  language: 'ru' as Language,
  upgrades: INITIAL_UPGRADES,
  asteroids: [],
  drones: [
    {
      id: 'drone-1',
      type: 'basic' as DroneType,
      speed: 3,
      miningRate: 5,
      capacity: 50,
      targetResource: 'metal' as ResourceType,
      progress: 0,
      state: 'flying_out' as const,
      angle: Math.PI + Math.random() * Math.PI,
      curveOffset: (Math.random() - 0.5) * 100,
      distance: 500 + Math.random() * 300,
      timer: 0,
    },
  ],
  storage: {
    capacity: 100,
    current: Object.keys(RESOURCE_CONFIG).reduce((acc, id) => {
      acc[id as ResourceType] = 0;
      return acc;
    }, {} as Record<ResourceType, number>),
  },
  transport: {
    state: 'idle' as const,
    isActive: false,
    travelTime: 10,
    progress: 0,
    timer: 0,
    angle: 0,
    curveOffset: 0,
    distance: 0,
  },
  notifications: [],
  multipliers: {
    price: 1,
    miningRate: 1,
    speed: 1,
  },
  isGameActive: false,
  isWarping: false,
  currentSectorId: 'asteroid_belt' as SectorId,
  discoveredResources: ['metal' as ResourceType],
  radar: INITIAL_RADAR_STATE,
  energyLevel: 100, // 0-100 for Tier 4
  hasSeenIntro: false,
  tutorialStep: 0,
  corporateDebt: 999_999_999_999,
  gameLogs: [],
  _hasHydrated: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE_DATA,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),

      reduceDebt: (amount) => set((state) => ({
        corporateDebt: Math.max(0, state.corporateDebt - amount)
      })),

      addLog: (text, type = 'INFO') => set((state) => ({
        gameLogs: [
          {
            id: Math.random().toString(36).substring(2, 9),
            type,
            text,
            timestamp: Date.now()
          },
          ...state.gameLogs.slice(0, 49) // Keep last 50
        ]
      })),

      addNotification: (type, value) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            id: Math.random().toString(36).substr(2, 9),
            type,
            value,
            x: 50 + (Math.random() - 0.5) * 10,
            y: 40 + (Math.random() - 0.5) * 10,
            opacity: 1,
          }
        ],
        ...(type === 'sale' ? { lastSaleTimestamp: Date.now() } : {}),
      })),

      activateMiningBurst: () => set((state) => ({
        boostEndTime: Date.now() + BOOST_DURATION_MS,
        boostMiningMultiplier: BOOST_MINING_MULTIPLIER,
      })),

      buyDrone: (type) => {
        const { credits, drones, upgrades } = get();
        const config = DRONE_CONFIGS[type];
        const maxDrones = 1 + (upgrades.hangar?.level || 0);

        if (credits >= config.cost && drones.length < maxDrones) {
          set((state) => ({
            credits: state.credits - config.cost,
            drones: [
              ...state.drones,
              {
                id: `drone-${Math.random().toString(36).substr(2, 9)}`,
                type,
                speed: config.speed,
                miningRate: config.miningRate,
                capacity: config.capacity,
                targetResource: 'metal',
                progress: 0,
                state: 'flying_out',
                angle: Math.PI + Math.random() * Math.PI,
                curveOffset: (Math.random() - 0.5) * 100,
                distance: 500 + Math.random() * 300,
                timer: 0,
              }
            ]
          }));
          const t = (translations as any)[get().language];
          get().addNotification('info', t.notifications.new_drone.replace('{name}', config.name));
          return true;
        }
        return false;
      },

      purchaseUpgrade: (id) => {
        const { credits, upgrades, currentSectorId } = get();
        const upgrade = upgrades[id];
        const sector = SECTORS_CONFIG[currentSectorId];
        
        let maxLevel = upgrade.maxLevel;
        if (id === 'refinery') maxLevel = sector.maxUpgrades.refinery;
        if (id === 'cargo_bay') maxLevel = sector.maxUpgrades.storage;
        if (id === 'hangar') maxLevel = sector.maxUpgrades.hangar;

        if (credits >= upgrade.cost && upgrade.level < maxLevel) {
          const newLevel = upgrade.level + 1;
          
          // --- Soft Exponential Cost Scaling ---
          // prevents Infinity and allows deeper progression
          let newCost = 0;
          if (newLevel <= 20) {
            newCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, newLevel));
          } else {
            // After level 20, growth slows down to linear-exponential mix
            const costAt20 = upgrade.baseCost * Math.pow(upgrade.costMultiplier, 20);
            const linearFactor = upgrade.baseCost * upgrade.costMultiplier * (newLevel - 20);
            newCost = Math.floor(costAt20 + linearFactor * Math.pow(1.1, newLevel - 20));
          }
          
          set((state) => {
            const newUpgrades = {
              ...state.upgrades,
              [id]: { ...upgrade, level: newLevel, cost: newCost }
            };

            const newMultipliers = { ...state.multipliers };
            let newStorageCapacity = state.storage.capacity;
            let newAutomationEnabled = state.automationEnabled;

            if (id === 'refinery') newMultipliers.price = 1 + newLevel * 0.2;
            if (id === 'cargo_bay') newStorageCapacity = Math.floor(100 * Math.pow(1.5, newLevel));
            if (id === 'automation') newAutomationEnabled = true;

            return {
              credits: state.credits - upgrade.cost,
              upgrades: newUpgrades,
              multipliers: newMultipliers,
              storage: { ...state.storage, capacity: newStorageCapacity },
              automationEnabled: newAutomationEnabled,
              baseLevel: 1 + Math.floor(Object.values(newUpgrades).reduce((sum, u) => sum + u.level, 0) / 3)
            };
          });

        const t = (translations as any)[get().language];
        get().addNotification('info', (t.notifications.upgrade_success as string)
            .replace('{name}', (t.upgrades as any)[id].name)
            .replace('{level}', newLevel.toString()));
          return true;
        }
        return false;
      },

      setLanguage: (lang) => set({ language: lang }),

      updateNotifications: (deltaTime) => set((state) => {
        const updated = state.notifications
          .map(n => ({
            ...n,
            y: n.y - (deltaTime / 1000) * 10, // Move up
            opacity: n.opacity - (deltaTime / 1000) * 0.5 // Fade out
          }))
          .filter(n => n.opacity > 0);
        return { notifications: updated };
      }),

      addResourceToStorage: (type, amount) => {
        const { storage } = get();
        const currentAmount = storage.current[type] || 0;
        const totalCurrent = Object.values(storage.current).reduce((a, b) => a + b, 0);

        if (totalCurrent + amount > storage.capacity) {
          // Storage is full, add what we can
          const available = storage.capacity - totalCurrent;
          if (available > 0) {
            set((state) => ({
              storage: {
                ...state.storage,
                current: {
                  ...state.storage.current,
                  [type]: currentAmount + available,
                },
              },
            }));
            return true;
          }
          return false;
        }

        set((state) => ({
          storage: {
            ...state.storage,
            current: {
              ...state.storage.current,
              [type]: currentAmount + amount,
            },
          },
        }));
        return true;
      },

      applyOfflineProgress: (seconds: number) => {
        const { drones, storage, multipliers, resources, automationEnabled, addCredits, language, radar, currentSectorId } = get();
        const t = (translations as any)[language];
        
        // Tier 5 Bonus: 2.0x time multiplier
        const effectiveSeconds = currentSectorId === 'kuiper_belt' ? seconds * 2 : seconds;

        // Calculate offline radar energy recharge
        let newEnergy = radar.energy;
        let newEnergyTimer = radar.energyTimerMs + (effectiveSeconds * 1000);
        
        while (newEnergy < radar.maxEnergy && newEnergyTimer >= radar.rechargeRateMs) {
          newEnergy += 1;
          newEnergyTimer -= radar.rechargeRateMs;
        }
        if (newEnergy >= radar.maxEnergy) newEnergyTimer = 0;
        
        // Calculate mined resources per type
        const minedByType: Partial<Record<ResourceType, number>> = {};
        drones.forEach(d => {
          const amount = Math.floor(d.miningRate * multipliers.miningRate * effectiveSeconds);
          minedByType[d.targetResource] = (minedByType[d.targetResource] || 0) + amount;
        });
        
        const totalResourcesMined = Object.values(minedByType).reduce((a, b) => a + b, 0);
        let earnedCredits = 0;
        const newStorageCurrent = { ...storage.current };
        const capacity = storage.capacity;
        
        // Add to storage
        Object.entries(minedByType).forEach(([type, amount]) => {
          const resType = type as ResourceType;
          newStorageCurrent[resType] = (newStorageCurrent[resType] || 0) + amount;
        });

        const currentTotal = Object.values(newStorageCurrent).reduce((a, b) => a + b, 0);
        
        if (automationEnabled && currentTotal > capacity * 0.8) {
        // Sell everything
        Object.entries(newStorageCurrent).forEach(([type, amount]) => {
          const resType = type as ResourceType;
          if (resources[resType]) {
            earnedCredits += amount * resources[resType].basePrice * multipliers.price;
          }
          newStorageCurrent[resType] = 0;
        });
        } else if (currentTotal > capacity) {
          // Cap storage proportionally
          const factor = capacity / currentTotal;
          Object.keys(newStorageCurrent).forEach(type => {
            const resType = type as ResourceType;
            newStorageCurrent[resType] = Math.floor(newStorageCurrent[resType] * factor);
          });
        }

        if (totalResourcesMined > 0 || earnedCredits > 0) {
          if (earnedCredits > 0) addCredits(earnedCredits);
          set((state) => ({
            storage: {
              ...state.storage,
              current: newStorageCurrent
            },
            radar: {
              ...state.radar,
              energy: newEnergy,
              energyTimerMs: newEnergyTimer
            },
            lastSeen: Date.now()
          }));

          const msg = t.notifications.offline_income
            .replace('{resources}', totalResourcesMined.toLocaleString())
            .replace('{credits}', Math.floor(earnedCredits).toLocaleString());
            
          get().addNotification('info', msg);
        }
      },

      manualMine: (id, x, y) => {
        const { addResourceToStorage, asteroids, discoveredResources, upgrades } = get();
        const asteroid = asteroids.find(a => a.id === id);
        if (!asteroid) return;

        // Check for first discovery
        if (!discoveredResources.includes(asteroid.resourceType)) {
          set((state) => ({
            discoveredResources: [...state.discoveredResources, asteroid.resourceType]
          }));
          // We'll handle the visual popup via a specific notification type or listener
          const t = (translations as any)[get().language];
          get().addNotification('info', t.notifications.new_resource.replace('{name}', t.resources[asteroid.resourceType]));
        }

        const isLastHit = asteroid.hits + 1 >= asteroid.maxHits;
        const refineryLevel = upgrades.refinery?.level || 0;
        const baseAmount = asteroid.maxHits * 2;
        const amount = isLastHit ? Math.floor(baseAmount * (1 + refineryLevel * 0.15)) : 0;
        
        let added = true;
        if (amount > 0) {
          added = addResourceToStorage(asteroid.resourceType, amount);
        }

        if (added) {
          set((state) => ({
            asteroids: isLastHit 
              ? state.asteroids.filter(a => a.id !== id)
              : state.asteroids.map(a => a.id === id 
                  ? { ...a, hits: a.hits + 1, speed: 0.3, size: a.size * 0.95 }
                  : a),
            notifications: amount > 0 ? [
              ...state.notifications,
              {
                id: Math.random().toString(36).substr(2, 9),
                type: 'info',
                value: `+${amount}`,
                x,
                y,
                opacity: 1,
              }
            ] : state.notifications
          }));
        }
      },

      startGame: () => set({ isGameActive: true }),

      exitToMenu: () => set({ isGameActive: false }),

      resetGame: () => set({ ...INITIAL_STATE_DATA, isGameActive: true, lastSeen: Date.now(), hasSeenIntro: false, tutorialStep: 0 }),

      replenishEnergy: () => {
        if (get().currentSectorId !== 'kuiper_belt') return;
        set((state) => ({ energyLevel: Math.min(100, state.energyLevel + 5) }));
      },

      warpToSector: (sectorId) => {
        const { credits, currentSectorId, storage, radar, upgrades } = get();
        const currentSector = SECTORS_CONFIG[currentSectorId];
        const targetSector = SECTORS_CONFIG[sectorId];

        if (sectorId === currentSectorId) return;

        // Gates Check
        const canAfford = credits >= targetSector.unlockCost;
        const refineryOk = upgrades.refinery.level >= currentSector.maxUpgrades.refinery;
        const storageOk = upgrades.cargo_bay.level >= currentSector.maxUpgrades.storage;
        const hangarOk = upgrades.hangar.level >= currentSector.maxUpgrades.hangar;

        if (!canAfford || !refineryOk || !storageOk || !hangarOk) return;

        // Start warping
        set((state) => ({
          isWarping: true,
          credits: state.credits - targetSector.unlockCost,
          currentSectorId: sectorId,
          asteroids: [], // Clear asteroids
          storage: {
            ...state.storage,
            current: Object.keys(RESOURCE_CONFIG).reduce((acc, id) => {
              acc[id as ResourceType] = 0;
              return acc;
            }, {} as Record<ResourceType, number>),
          },
          radar: {
            ...state.radar,
            upgrades: {
              ...state.radar.upgrades,
              deepScan: 0, // Reset Deep Scan
            }
          }
        }));

        // End warping after 1 second
        setTimeout(() => {
          set({ isWarping: false });
          const t = (translations as any)[get().language];
          const sectorName = t.warp_menu.sector_names[targetSector.id];
          get().addNotification('info', t.notifications.warp_success.replace('{name}', sectorName));
        }, 1000);
      },

      startRadarScan: () => {
        const { radar, currentSectorId } = get();
        if (radar.energy <= 0 || radar.isActive) return;
        
        const grid = generateRadarGrid(radar.upgrades, currentSectorId);
        const clicksRemaining = 10 + (radar.upgrades.battery * 2);

        get().addLog('Сектор просканирован. Обнаружены плотные залежи.', 'INFO');

        set((state) => ({
          radar: {
            ...state.radar,
            energy: state.radar.energy - 1,
            isActive: true,
            sessionEarnedCR: 0,
            sessionResources: Object.keys(RESOURCE_CONFIG).reduce((acc, id) => {
              acc[id as ResourceType] = 0;
              return acc;
            }, {} as Record<ResourceType, number>),
            grid,
            clicksRemaining,
          }
        }));
      },

      clickRadarCell: (id) => {
        const { radar, storage, resources, multipliers, addResourceToStorage, addCredits, discoveredResources } = get();
        if (radar.clicksRemaining <= 0 || !radar.isActive) return;

        const cell = radar.grid.find(c => c.id === id);
        if (!cell || cell.revealed) return;

        let newGrid = [...radar.grid];
        let newClicksRemaining = radar.clicksRemaining - 1;
        let newSessionEarnedCR = radar.sessionEarnedCR;
        const newSessionResources = { ...radar.sessionResources };
        let newDiscoveredResources = [...discoveredResources];

        const targetCell = newGrid.find(c => c.id === id)!;
        targetCell.revealed = true;

        if (targetCell.type === 'hazard') {
          newClicksRemaining = Math.max(0, newClicksRemaining - 3);
          const t = (translations as any)[get().language];
          get().addNotification('info', t.notifications?.radar_hazard || 'HAZARD! -3 Pulses');
        } else if (targetCell.type === 'resource' && targetCell.resourceDrop) {
          const resType = targetCell.resourceDrop;
          
          // --- Алгоритм "Плотных залежей" (Step 3) ---
          const baseStorageMax = storage.capacity;
          const volumeFound = Math.max(5, Math.floor(baseStorageMax * 0.05));
          
          const totalStored = Object.values(storage.current).reduce((a, b) => a + b, 0);
          const freeSpace = baseStorageMax - totalStored;

          if (volumeFound <= freeSpace) {
            // Влезает полностью
            addResourceToStorage(resType, volumeFound);
          } else {
            // Часть влезает, часть в Overflow
            const overflowVolume = volumeFound - Math.max(0, freeSpace);
            if (freeSpace > 0) {
              addResourceToStorage(resType, freeSpace);
            }
            
            // Штрафная продажа (75% цены)
            const resource = resources[resType];
            const resourcePrice = resource ? (resource.basePrice * multipliers.price) : 0;
            const creditsEarned = Math.floor(overflowVolume * resourcePrice * 0.75);
            
            addCredits(creditsEarned);
            newSessionEarnedCR += creditsEarned;
            const t = (translations as any)[get().language];
            get().addNotification('info', t.notifications.overflow.replace('{credits}', creditsEarned.toString()));
          }

          // Статистика сессии
          newSessionResources[resType] += volumeFound;

          // Система открытий
          if (!newDiscoveredResources.includes(resType)) {
            newDiscoveredResources.push(resType);
            const t = (translations as any)[get().language];
            get().addNotification('info', t.ui.resource_identified || 'NEW RESOURCE!');
            get().addLog(`Обнаружен новый ресурс: ${t.resources[resType]}.`, 'INFO');
          }
        } else if (targetCell.type === 'empty' && targetCell.adjacentCount === 0) {
          const size = Math.sqrt(radar.grid.length);
          newGrid = revealEmptyCells(newGrid, targetCell, size);
        }

        set((state) => ({
          discoveredResources: newDiscoveredResources,
          radar: {
            ...state.radar,
            grid: newGrid,
            clicksRemaining: newClicksRemaining,
            sessionEarnedCR: newSessionEarnedCR,
            sessionResources: newSessionResources,
          }
        }));
      },

      closeRadar: () => set((state) => ({
        radar: { ...state.radar, isActive: false, grid: [] }
      })),

      upgradeRadar: (id) => {
        const { credits, radar, currentSectorId } = get();
        const level = radar.upgrades[id];
        const sector = SECTORS_CONFIG[currentSectorId];
        
        let cost = 0;
        let maxLevel = 99;
        if (id === 'battery') cost = 200 * Math.pow(2, level);
        if (id === 'deepScan') { 
          cost = sector.radarDeepScanBasePrices[level]; 
          maxLevel = 3; 
        }
        if (id === 'gridSize') { cost = 1000 * Math.pow(4, level); maxLevel = 2; }
        if (id === 'sonar') cost = 300 * Math.pow(2.5, level);

        if (credits >= cost && level < maxLevel) {
          set((state) => ({
            credits: state.credits - cost,
            radar: {
              ...state.radar,
              upgrades: {
                ...state.radar.upgrades,
                [id]: level + 1
              }
            }
          }));
          
          const t = (translations as any)[get().language];
          const upgName = t.radar_upgrades?.[id]?.name || id;
          get().addNotification('info', (t.notifications.upgrade_success as string)
            .replace('{name}', upgName)
            .replace('{level}', (level + 1).toString()));
          return true;
        }
        return false;
      },

      completeIntro: () => {
        const t = (translations as any)[get().language];
        set({ hasSeenIntro: true, tutorialStep: 1 });
        get().addLog(t.tutorial.step1, 'CORP');
      },

      nextTutorialStep: () => set((state) => {
        const newStep = state.tutorialStep + 1;
        const t = (translations as any)[state.language];
        const tutorialMsg = (t.tutorial as any)[`step${newStep}`];
        
        if (tutorialMsg) {
          get().addLog(tutorialMsg, 'CORP');
        }
        
        return { tutorialStep: newStep };
      }),

      updateDrones: (deltaTime) => {
        set((state) => {
          const now = Date.now();
          const { currentSectorId, tutorialStep, credits, storage, drones, discoveredResources, corporateDebt } = state;
          
          // --- Corporate Debt Interest (0.001% per minute) ---
          const interestRatePerSec = 0.00001 / 60;
          const newDebt = corporateDebt > 0 ? corporateDebt + (corporateDebt * interestRatePerSec * (deltaTime / 1000)) : 0;

          // --- Tier 4: Energy Logic ---
          let newEnergyLevel = state.energyLevel;
          if (currentSectorId === 'kuiper_belt') {
            newEnergyLevel = Math.max(0, newEnergyLevel - (deltaTime / 1000));
          } else {
            newEnergyLevel = 100; // Reset or keep 100 in other sectors
          }
          const energyPenalty = (currentSectorId === 'kuiper_belt' && newEnergyLevel < 20) ? 0.5 : 1;

          // --- Warning Logs ---
          const totalStored = Object.values(storage.current).reduce((a, b) => a + b, 0);
          if (totalStored > storage.capacity * 0.9 && !state.gameLogs.some(l => l.text.includes("Склад заполнен") && now - l.timestamp < 30000)) {
            get().addLog('ВНИМАНИЕ: Склад заполнен на 90%!', 'WARNING');
          }
          if (newEnergyLevel < 20 && currentSectorId === 'kuiper_belt' && !state.gameLogs.some(l => l.text.includes("Энергия на исходе") && now - l.timestamp < 30000)) {
            get().addLog('ВНИМАНИЕ: Энергия на исходе. Срочно зарядите базу!', 'WARNING');
          }

          // --- Tutorial Progress Logic ---
          let newTutorialStep = tutorialStep;
          let logsToPush: string[] = [];
          const trans = (translations as any)[state.language];

          if (tutorialStep === 1) {
            const totalStored = Object.values(storage.current).reduce((a, b) => a + b, 0);
            if (totalStored >= 10) { newTutorialStep = 2; logsToPush.push(trans.tutorial.step2); }
          } else if (tutorialStep === 2) {
            const totalStored = Object.values(storage.current).reduce((a, b) => a + b, 0);
            if (totalStored >= storage.capacity * 0.2 && credits > 0) { newTutorialStep = 3; logsToPush.push(trans.tutorial.step3); }
          } else if (tutorialStep === 3) {
            if (drones.length > 1) { newTutorialStep = 4; logsToPush.push(trans.tutorial.step4); }
          } else if (tutorialStep === 4) {
            if (discoveredResources.includes('ice')) { newTutorialStep = 5; logsToPush.push(trans.tutorial.step5); }
          } else if (tutorialStep === 5) {
            if (credits >= 5000) { newTutorialStep = 6; logsToPush.push(trans.tutorial.step6); }
          }

          let currentLogs = state.gameLogs;
          if (logsToPush.length > 0) {
            const newEntries = logsToPush.map(text => ({
              id: Math.random().toString(36).substring(2, 9),
              type: 'CORP' as LogType,
              text,
              timestamp: now
            }));
            currentLogs = [...newEntries, ...currentLogs.slice(0, 50 - newEntries.length)];
          }
          // -------------------------------

          // --- Логика астероидов ---
          let newAsteroids = state.asteroids.map(a => {
            const nextX = a.x + Math.cos(a.angle) * a.speed * (deltaTime / 1000);
            const nextY = a.y + Math.sin(a.angle) * a.speed * (deltaTime / 1000);
            return { ...a, x: nextX, y: nextY };
          }).filter(a => a.x > -10 && a.x < 110 && a.y > -10 && a.y < 110);

          if (newAsteroids.length < 5 && Math.random() < 0.02) {
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x = 0, y = 0, angle = 0;
            if (side === 0) { x = Math.random() * 100; y = -5; angle = Math.PI / 4 + Math.random() * Math.PI / 2; }
            else if (side === 1) { x = 105; y = Math.random() * 100; angle = Math.PI * 0.75 + Math.random() * Math.PI / 2; }
            else if (side === 2) { x = Math.random() * 100; y = 105; angle = -Math.PI / 4 - Math.random() * Math.PI / 2; }
            else { x = -5; y = Math.random() * 100; angle = -Math.PI / 4 + Math.random() * Math.PI / 2; }

            const { currentSectorId } = get();
            const sectorResources = SECTORS_CONFIG[currentSectorId].resources;
            
            // Расчет общего веса для вероятностей
            let totalWeight = 0;
            const resDataList = sectorResources.map(id => {
              const data = RESOURCE_CONFIG[id];
              totalWeight += data.spawnChance;
              return { weight: data.spawnChance, ...data };
            });

            const rand = Math.random() * totalWeight;
            let resType: ResourceType = sectorResources[0];
            let maxHits = 1;
            let currentWeight = 0;

            for (const res of resDataList) {
              currentWeight += res.weight;
              if (rand <= currentWeight) {
                resType = res.id as ResourceType;
                maxHits = res.maxHits;
                break;
              }
            }

            newAsteroids.push({
              id: `ast-${Math.random().toString(36).substr(2, 9)}`,
              x, y, angle,
              size: 15 + Math.random() * 20 + (maxHits * 10),
              speed: 1.0 + Math.random() * 2,
              hits: 0,
              maxHits,
              resourceType: resType
            });
          }
          // ------------------------

          const boostActive = state.boostEndTime > now;
          const miningMultiplier = boostActive ? state.boostMiningMultiplier : 1;
          const resetBoost = !boostActive && state.boostMiningMultiplier > 1;

          // --- Radar Energy Recharge ---
          let newRadar = { ...state.radar };
          if (newRadar.energy < newRadar.maxEnergy) {
            newRadar.energyTimerMs += deltaTime;
            if (newRadar.energyTimerMs >= newRadar.rechargeRateMs) {
              newRadar.energy += 1;
              newRadar.energyTimerMs = 0;
            }
          } else {
            newRadar.energyTimerMs = 0;
          }

          const newDrones = state.drones.map((drone) => {
            let { progress, state: droneState, timer, angle, curveOffset, distance } = drone;
            const speedMultiplier = state.multipliers.speed;
            
            // --- Tier 3: Turbulence Logic ---
            if (currentSectorId === 'saturn_rings' && (droneState === 'flying_out' || droneState === 'returning')) {
              // Добавляем микро-отклонения к дальности и кривизне в каждом кадре
              if (Math.random() < 0.05) {
                curveOffset += (Math.random() - 0.5) * 10;
                distance += (Math.random() - 0.5) * 5;
              }
            }

            // deltaTime is in ms
            if (droneState === 'flying_out' || droneState === 'returning') {
              // Скорость полета зависит от базовой скорости, буста и пенальти энергии
              const progressIncrement = (deltaTime / 1000) / (drone.speed / speedMultiplier) * miningMultiplier * energyPenalty;
              progress += progressIncrement;

              if (progress >= 1) {
                progress = 1;
                if (droneState === 'flying_out') {
                  droneState = 'offscreen_wait';
                  timer = 1000; // 1 секунда за экраном
                } else {
                  droneState = 'unloading_wait';
                  timer = 1000; // 1 секунда разгрузки
                }
              }
            } else if (droneState === 'offscreen_wait') {
              timer -= deltaTime;
              if (timer <= 0) {
                timer = 0;
                droneState = 'returning';
                progress = 0; // Начинаем возврат
              }
            } else if (droneState === 'unloading_wait') {
              timer -= deltaTime;
              if (timer <= 0) {
                // Пытаемся разгрузиться
                const amount = drone.miningRate * state.multipliers.miningRate * (boostActive ? state.boostMiningMultiplier : 1) * energyPenalty;
                const added = get().addResourceToStorage(drone.targetResource, amount);
                
                if (added) {
                  timer = 0;
                  droneState = 'flying_out';
                  progress = 0;
                  // Новые случайные параметры полета (верхняя половина)
                  angle = Math.PI + Math.random() * Math.PI;
                  curveOffset = (Math.random() - 0.5) * 100;
                  distance = 500 + Math.random() * 300;

                  // --- Auto-Target Best Resource ---
                  const sector = SECTORS_CONFIG[currentSectorId];
                  const discovered = state.discoveredResources;
                  const availableInSector = sector.resources.filter(r => discovered.includes(r));
                  
                  if (availableInSector.length > 0) {
                    // Find resource with highest base price
                    const bestRes = availableInSector.reduce((best, current) => {
                      const bestPrice = RESOURCE_CONFIG[best]?.basePrice || 0;
                      const currentPrice = RESOURCE_CONFIG[current]?.basePrice || 0;
                      return currentPrice > bestPrice ? current : best;
                    }, availableInSector[0]);
                    
                    return { ...drone, progress, state: droneState, timer, angle, curveOffset, distance, targetResource: bestRes };
                  }
                } else {
                  timer = 0; // Ждем у базы (состояние unloading_wait с таймером 0 означает "готов, но склад полон")
                }
              }
            }

            return { ...drone, progress, state: droneState, timer, angle, curveOffset, distance };
          });

          return {
            drones: newDrones,
            asteroids: newAsteroids,
            radar: newRadar,
            energyLevel: newEnergyLevel,
            tutorialStep: newTutorialStep,
            gameLogs: currentLogs,
            corporateDebt: newDebt,
            lastSeen: now, // Обновляем lastSeen в каждом тике
            ...(resetBoost ? { boostMiningMultiplier: 1 } : {}),
          };
        });
      },

      startTransport: () => {
        const { storage, resources, multipliers, addCredits } = get();
        
        // Считаем доход СРАЗУ при вылете
        let totalEarned = 0;
        const newStorageCurrent = { ...storage.current };

        (Object.keys(newStorageCurrent) as ResourceType[]).forEach((resId) => {
          const amount = newStorageCurrent[resId];
          const resource = resources[resId];
          if (resource) {
            totalEarned += amount * resource.basePrice * multipliers.price;
          }
          newStorageCurrent[resId] = 0;
        });

        if (totalEarned > 0) {
          addCredits(totalEarned);
          get().reduceDebt(totalEarned);
          get().addNotification('sale', `+${Math.floor(totalEarned)} CR`);
          get().addLog(`Транспорт отправлен. Доход: ${Math.floor(totalEarned)} CR.`, 'INFO');
          
          if (Math.random() < 0.1) {
            const corpMsgs = [
              "Твое дыхание стоит нам 0.02 CR в минуту. Работай быстрее.",
              "Корпорация напоминает: сон — это роскошь, которую ты пока не заслужил.",
              "Твое корыто все еще в долгах. Не расслабляйся.",
              "Каждый клик приближает тебя к свободе (но это не точно)."
            ];
            get().addLog(corpMsgs[Math.floor(Math.random() * corpMsgs.length)], 'CORP');
          }
          
          set((state) => ({
            storage: { ...state.storage, current: newStorageCurrent },
            transport: { 
              ...state.transport, 
              isActive: true, 
              state: 'flying_out', 
              progress: 0, 
              timer: 0,
              angle: (0.1 + Math.random() * 0.8) * Math.PI,
              curveOffset: (Math.random() - 0.5) * 150,
              distance: 600 + Math.random() * 200,
            },
          }));
        }
      },

      updateTransport: (deltaTime) => {
        const { transport, storage, startTransport, automationEnabled } = get();
        
        if (!transport.isActive) {
          const totalCurrent = Object.values(storage.current).reduce((a, b) => a + b, 0);
          
          // Only auto-start if automation is enabled
          if (automationEnabled) {
            const threshold = storage.capacity * 0.8;
            if (totalCurrent >= threshold && totalCurrent > 0) {
              startTransport();
            }
          }
          return;
        }

        const { state: transportState, progress, timer, travelTime } = transport;

        if (transportState === 'flying_out' || transportState === 'returning') {
          let newProgress = progress + (deltaTime / 1000) / (travelTime / 2);
          
          if (newProgress >= 1) {
            newProgress = 1;
            if (transportState === 'flying_out') {
              set((state) => ({
                transport: { ...state.transport, state: 'offscreen_wait', progress: 1, timer: 1000 }
              }));
            } else {
              set((state) => ({
                transport: { ...state.transport, state: 'idle', isActive: false, progress: 0, timer: 0 }
              }));
            }
          } else {
            set((state) => ({
              transport: { ...state.transport, progress: newProgress }
            }));
          }
        } else if (transportState === 'offscreen_wait') {
          let newTimer = timer - deltaTime;
          if (newTimer <= 0) {
            set((state) => ({
              transport: { ...state.transport, state: 'returning', progress: 0, timer: 0 },
            }));
          } else {
            set((state) => ({
              transport: { ...state.transport, timer: newTimer }
            }));
          }
        }
      },
    }),
    {
      name: 'asteroid-logistics-save',
      partialize: (state) => ({
        credits: state.credits,
        baseLevel: state.baseLevel,
        drones: state.drones,
        storage: state.storage,
        upgrades: state.upgrades,
        automationEnabled: state.automationEnabled,
        language: state.language,
        multipliers: state.multipliers,
        lastSeen: state.lastSeen,
        isGameActive: state.isGameActive,
        isWarping: false, // Don't persist warp state as active
        currentSectorId: state.currentSectorId,
        discoveredResources: state.discoveredResources,
        radar: state.radar,
        hasSeenIntro: state.hasSeenIntro,
        tutorialStep: state.tutorialStep,
        corporateDebt: state.corporateDebt,
        gameLogs: state.gameLogs || [],
      }),
      onRehydrateStorage: (state) => {
        return (rehydratedState: any, error) => {
          if (rehydratedState) {
            // Data Migration: Remove resources from storage that no longer exist
            if (rehydratedState.storage?.current) {
              const validResources = Object.keys(RESOURCE_CONFIG);
              Object.keys(rehydratedState.storage.current).forEach(key => {
                if (!validResources.includes(key)) {
                  delete rehydratedState.storage.current[key];
                }
              });
            }
            // Ensure discoveredResources only contains valid types
            if (rehydratedState.discoveredResources) {
              rehydratedState.discoveredResources = rehydratedState.discoveredResources.filter(
                (res: string) => Object.keys(RESOURCE_CONFIG).includes(res)
              );
            }
            rehydratedState.setHasHydrated(true);
          }
        };
      },
    }
  )
);

