import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, ResourceType, Drone, Resource, DroneType, Upgrade } from '../types';
import { translations, Language } from '../translations';

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
};

const BOOST_DURATION_MS = 10_000;
const BOOST_MINING_MULTIPLIER = 1.5;

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
        const { drones, storage, multipliers, resources, automationEnabled, addCredits, language } = get();
        const t = (translations as any)[language];
        
        // Считаем общую скорость добычи
        const totalMiningRate = drones.reduce((sum, d) => sum + d.miningRate, 0) * multipliers.miningRate;
        const resourcesMined = Math.floor(totalMiningRate * seconds);
        
        let earnedCredits = 0;
        let finalResourcesInStorage = 0;

        const currentTotal = Object.values(storage.current).reduce((a, b) => a + b, 0);
        const capacity = storage.capacity;
        
        if (automationEnabled) {
          // Если есть автоматизация, считаем сколько циклов транспорта могло пройти
          const totalAfterMining = currentTotal + resourcesMined;
          if (totalAfterMining > capacity * 0.8) {
             const toSell = totalAfterMining; // Продаем всё накопленное + добытое
             earnedCredits = Math.floor(toSell * resources.metal.basePrice * multipliers.price);
             finalResourcesInStorage = 0;
          } else {
             finalResourcesInStorage = totalAfterMining;
          }
        } else {
          // Без автоматизации ресурсы просто копятся до лимита склада
          finalResourcesInStorage = Math.min(capacity, currentTotal + resourcesMined);
        }

        if (resourcesMined > 0 || earnedCredits > 0) {
          addCredits(earnedCredits);
          set((state) => ({
            storage: {
              ...state.storage,
              current: { ...state.storage.current, metal: finalResourcesInStorage }
            },
            lastSeen: Date.now()
          }));

          const msg = t.notifications.offline_income
            .replace('{resources}', resourcesMined.toString())
            .replace('{credits}', Math.floor(earnedCredits).toLocaleString());
            
          get().addNotification('info', msg);
        }
      },

      manualMine: (id, x, y) => {
        const { addResourceToStorage, asteroids } = get();
        const asteroid = asteroids.find(a => a.id === id);
        if (!asteroid) return;

        const added = addResourceToStorage('metal', 2);
        if (added) {
          set((state) => {
            const isLastHit = asteroid.hits >= 2; // 3-й клик удаляет
            return {
              asteroids: isLastHit 
                ? state.asteroids.filter(a => a.id !== id)
                : state.asteroids.map(a => a.id === id 
                    ? { ...a, hits: a.hits + 1, speed: 0.5, size: a.size * 0.9 } // Замедляем и немного уменьшаем
                    : a),
              notifications: [
                ...state.notifications,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'info',
                  value: '+2',
                  x,
                  y,
                  opacity: 1,
                }
              ]
            };
          });
        }
      },

      startGame: () => set({ isGameActive: true }),

      exitToMenu: () => set({ isGameActive: false }),

      resetGame: () => set({ ...INITIAL_STATE_DATA, isGameActive: true, lastSeen: Date.now() }),

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

            newAsteroids.push({
              id: `ast-${Math.random().toString(36).substr(2, 9)}`,
              x, y, angle,
              size: 15 + Math.random() * 20,
              speed: 2 + Math.random() * 4, // Было 5-15, стало 2-6
              hits: 0
            });
          }
          // ------------------------

          const boostActive = state.boostEndTime > now;
          const miningMultiplier = boostActive ? state.boostMiningMultiplier : 1;
          const resetBoost = !boostActive && state.boostMiningMultiplier > 1;

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
          const threshold = automationEnabled ? storage.capacity * 0.8 : storage.capacity;
          
          if (totalCurrent >= threshold && totalCurrent > 0) {
            startTransport();
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
      }),
    }
  )
);

