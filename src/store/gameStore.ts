import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, ResourceType, Drone, Resource, DroneType, Upgrade, RadarUpgrades } from '../types';
import { translations, Language } from '../translations';
import { generateRadarGrid, revealEmptyCells } from '../utils/radarUtils';

interface GameStore extends GameState {
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
  startRadarScan: () => void;
  clickRadarCell: (id: string) => void;
  closeRadar: () => void;
  upgradeRadar: (id: keyof RadarUpgrades) => boolean;
}

const DRONE_CONFIGS: Record<DroneType, { speed: number, miningRate: number, cost: number, name: string }> = {
  basic: { name: 'Basic Drone', speed: 3, miningRate: 5, cost: 50 },
  scout: { name: 'Scout Drone', speed: 2.5, miningRate: 3, cost: 150 },
  heavy: { name: 'Heavy Hauler', speed: 8, miningRate: 25, cost: 300 },
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

const INITIAL_RESOURCES: Record<ResourceType, Resource> = {
  metal: {
    id: 'metal',
    name: 'Металл',
    basePrice: 1,
    rarity: 1,
  },
  ice: {
    id: 'ice',
    name: 'Космический лед',
    basePrice: 5,
    rarity: 0.5,
  },
  crystal: {
    id: 'crystal',
    name: 'Кристаллы',
    basePrice: 25,
    rarity: 0.2,
  },
  iridium: {
    id: 'iridium',
    name: 'Иридий',
    basePrice: 100,
    rarity: 0.05,
  },
};

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
  sessionResources: {
    metal: 0,
    ice: 0,
    crystal: 0,
    iridium: 0,
  },
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
    current: {
      metal: 0,
      ice: 0,
      crystal: 0,
      iridium: 0,
    },
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
  discoveredResources: ['metal' as ResourceType],
  radar: INITIAL_RADAR_STATE,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE_DATA,

      addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),

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
                capacity: 50,
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
        const { credits, upgrades } = get();
        const upgrade = upgrades[id];

        if (credits >= upgrade.cost && upgrade.level < upgrade.maxLevel) {
          const newLevel = upgrade.level + 1;
          const newCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, newLevel));
          
          set((state) => {
            const newUpgrades = {
              ...state.upgrades,
              [id]: { ...upgrade, level: newLevel, cost: newCost }
            };

            const newMultipliers = { ...state.multipliers };
            let newStorageCapacity = state.storage.capacity;
            let newAutomationEnabled = state.automationEnabled;

            if (id === 'refinery') newMultipliers.price = 1 + newLevel * 0.2;
            if (id === 'cargo_bay') newStorageCapacity = 100 + newLevel * 50;
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
        const { drones, storage, multipliers, resources, automationEnabled, addCredits, language, radar } = get();
        const t = (translations as any)[language];
        
        // Calculate offline radar energy recharge
        let newEnergy = radar.energy;
        let newEnergyTimer = radar.energyTimerMs + (seconds * 1000);
        
        while (newEnergy < radar.maxEnergy && newEnergyTimer >= radar.rechargeRateMs) {
          newEnergy += 1;
          newEnergyTimer -= radar.rechargeRateMs;
        }
        if (newEnergy >= radar.maxEnergy) newEnergyTimer = 0;
        
        // Calculate mined resources per type
        const minedByType: Partial<Record<ResourceType, number>> = {};
        drones.forEach(d => {
          const amount = Math.floor(d.miningRate * multipliers.miningRate * seconds);
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
            earnedCredits += amount * resources[resType].basePrice * multipliers.price;
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
        const { addResourceToStorage, asteroids, discoveredResources } = get();
        const asteroid = asteroids.find(a => a.id === id);
        if (!asteroid) return;

        // Check for first discovery
        if (!discoveredResources.includes(asteroid.resourceType)) {
          set((state) => ({
            discoveredResources: [...state.discoveredResources, asteroid.resourceType]
          }));
          // We'll handle the visual popup via a specific notification type or listener
          const t = (translations as any)[get().language];
          get().addNotification('info', `NEW: ${t.resources[asteroid.resourceType]}`);
        }

        const isLastHit = asteroid.hits + 1 >= asteroid.maxHits;
        const amount = isLastHit ? asteroid.maxHits * 2 : 0;
        
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

      resetGame: () => set({ ...INITIAL_STATE_DATA, isGameActive: true, lastSeen: Date.now() }),

      startRadarScan: () => {
        const { radar } = get();
        if (radar.energy <= 0 || radar.isActive) return;
        
        const grid = generateRadarGrid(radar.upgrades);
        const clicksRemaining = 10 + (radar.upgrades.battery * 2);

        set((state) => ({
          radar: {
            ...state.radar,
            energy: state.radar.energy - 1,
            isActive: true,
            sessionEarnedCR: 0,
            sessionResources: { metal: 0, ice: 0, crystal: 0, iridium: 0 },
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
        let newSessionResources = { ...radar.sessionResources };
        let newDiscoveredResources = [...discoveredResources];

        const targetCell = newGrid.find(c => c.id === id)!;
        targetCell.revealed = true;

        if (targetCell.type === 'hazard') {
          newClicksRemaining = Math.max(0, newClicksRemaining - 3);
          // Add info notification about penalty
          const t = (translations as any)[get().language];
          get().addNotification('info', t.notifications?.radar_hazard || 'HAZARD! -3 Pulses');
        } else if (targetCell.type === 'resource' && targetCell.resourceDrop) {
          const resType = targetCell.resourceDrop;
          newSessionResources[resType] += 1;
          
          // Discovery logic
          if (!newDiscoveredResources.includes(resType)) {
            newDiscoveredResources.push(resType);
          }

          // Storage check
          const currentTotal = Object.values(storage.current).reduce((a, b) => a + b, 0);
          if (currentTotal < storage.capacity) {
            addResourceToStorage(resType, 1);
          } else {
            // Auto-sell overflow
            const price = resources[resType].basePrice * multipliers.price;
            addCredits(price);
            newSessionEarnedCR += price;
            // Notification about overflow
            get().addNotification('info', `OVERFLOW: +${Math.floor(price)} CR`);
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
        const { credits, radar } = get();
        const level = radar.upgrades[id];
        
        let cost = 0;
        let maxLevel = 99;
        if (id === 'battery') cost = 200 * Math.pow(2, level);
        if (id === 'deepScan') { cost = 500 * Math.pow(3, level); maxLevel = 3; }
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

      updateDrones: (deltaTime) => {
        set((state) => {
          const now = Date.now();
          
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

            const rand = Math.random();
            let resType: ResourceType = 'metal';
            let maxHits = 1;
            
            if (rand < 0.05) { resType = 'iridium'; maxHits = 3; }
            else if (rand < 0.15) { resType = 'crystal'; maxHits = 3; }
            else if (rand < 0.40) { resType = 'ice'; maxHits = 2; }
            else { resType = 'metal'; maxHits = 1; }

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
            
            // deltaTime is in ms
            if (droneState === 'flying_out' || droneState === 'returning') {
              // Скорость полета зависит от базовой скорости и буста
              const progressIncrement = (deltaTime / 1000) / (drone.speed / speedMultiplier) * miningMultiplier;
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
                const amount = drone.miningRate * state.multipliers.miningRate * (boostActive ? state.boostMiningMultiplier : 1);
                const added = get().addResourceToStorage(drone.targetResource, amount);
                
                if (added) {
                  timer = 0;
                  droneState = 'flying_out';
                  progress = 0;
                  // Новые случайные параметры полета (верхняя половина)
                  angle = Math.PI + Math.random() * Math.PI;
                  curveOffset = (Math.random() - 0.5) * 100;
                  distance = 500 + Math.random() * 300;
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
          totalEarned += amount * resource.basePrice * multipliers.price;
          newStorageCurrent[resId] = 0;
        });

        if (totalEarned > 0) {
          addCredits(totalEarned);
          get().addNotification('sale', `+${Math.floor(totalEarned)} CR`);
          
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
        discoveredResources: state.discoveredResources,
        radar: state.radar,
      }),
    }
  )
);

