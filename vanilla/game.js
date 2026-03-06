/**
 * Asteroid Logistics — Vanilla JS версия
 * DOM-рендеринг, без Canvas/React/TypeScript
 */

const Assets = {
  base: {
    lvl1: "/assets/base/base_lvl1.png",
    lvl2: "/assets/base/base_lvl2.png"
  },
  drones: {
    basic: "/assets/drones/drone_basic.png",
    heavy: "/assets/drones/drone_heavy.png"
  },
  asteroids: [
    "/assets/environment/asteroid_1.png",
    "/assets/environment/asteroid_2.png"
  ]
};

// Fallback при отсутствии изображений
const FALLBACK_COLORS = {
  base: "#1e1e2a",
  drone: "#00f2ff",
  asteroid: "#64748b"
};

const AssetLoader = {
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  },

  async preloadAll() {
    const urls = [
      ...Object.values(Assets.base),
      ...Object.values(Assets.drones),
      ...Assets.asteroids
    ];
    await Promise.all(urls.map(src => this.loadImage(src)));
  }
};

function createBase(level = 1) {
  const base = document.createElement("div");
  base.className = "base game-object";

  const img = document.createElement("img");
  const src = level === 1 ? Assets.base.lvl1 : Assets.base.lvl2;
  img.src = src;
  img.alt = "Base";
  img.onerror = () => {
    img.style.display = "none";
    base.style.backgroundColor = FALLBACK_COLORS.base;
    base.style.borderRadius = "50%";
  };

  base.appendChild(img);
  return base;
}

function createDrone(type = "basic") {
  const drone = document.createElement("div");
  drone.className = "drone game-object";

  const img = document.createElement("img");
  const src = Assets.drones[type] || Assets.drones.basic;
  img.src = src;
  img.alt = "Drone";
  img.onerror = () => {
    img.style.display = "none";
    drone.style.backgroundColor = FALLBACK_COLORS.drone;
    drone.style.borderRadius = "4px";
    drone.style.minWidth = "12px";
    drone.style.minHeight = "12px";
  };

  drone.appendChild(img);
  drone.dataset.type = type;
  return drone;
}

function getRandomAsteroidSprite() {
  const list = Assets.asteroids;
  return list[Math.floor(Math.random() * list.length)];
}

function createAsteroid(size = 1) {
  const asteroid = document.createElement("div");
  asteroid.className = "asteroid game-object";

  const img = document.createElement("img");
  img.src = getRandomAsteroidSprite();
  img.alt = "Asteroid";
  img.onerror = () => {
    img.style.display = "none";
    asteroid.style.backgroundColor = FALLBACK_COLORS.asteroid;
    asteroid.style.borderRadius = "50%";
  };

  asteroid.appendChild(img);
  asteroid.style.width = (20 + size * 15) + "px";
  asteroid.style.height = (20 + size * 15) + "px";
  return asteroid;
}

// === Game State ===
const GameState = {
  credits: 0,
  baseLevel: 1,
  boostEndTime: 0,
  drones: [{ id: "d1", type: "basic", progress: 0, state: "mining" }],
  storage: { current: 0, capacity: 100 },
  transport: { active: false, progress: 0 },
  lastTime: 0,
  // New State
  logistics: {
    collector: {
      el: null,
      state: "idle", // idle, to_belt, mining, to_base, unloading
      timer: 0,
      startX: 0, startY: 0,
      targetX: 0, targetY: 0
    },
    transporter: {
      el: null,
      state: "idle", // idle, flying
      timer: 0
    }
  }
};

// === DOM References ===
let sceneEl, baseEl, droneContainerEl, asteroidContainerEl, beltEl;

function initDOM() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <header class="hud">
      <div class="logo" style="display: flex; align-items: center; gap: 0.5rem">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon-gold)" stroke-width="2" style="width: 24px;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span style="color: var(--neon-gold); font-weight: bold; font-size: 0.8rem; letter-spacing: 1px">ASTRO LOGISTICS</span>
      </div>
      <div class="credits">0 CR</div>
      <div style="flex: 1"></div>
      <div class="storage-bar"><div class="fill"></div></div>
      <div class="transport-bar"><div class="fill"></div></div>
    </header>
    <div class="scene">
      <div class="asteroid-belt" id="belt"></div>
      <div class="asteroids" id="asteroids"></div>
      <div class="game-area">
        <div class="base-container" id="baseContainer"></div>
        <div class="drones-container" id="droneContainer"></div>
      </div>
    </div>
    <footer class="actions">
      <button class="btn" id="btnOverclock">Overclock</button>
      <button class="btn" id="btnSend">Ship Cargo</button>
    </footer>
  `;

  sceneEl = document.querySelector(".scene");
  baseEl = document.getElementById("baseContainer");
  droneContainerEl = document.getElementById("droneContainer");
  asteroidContainerEl = document.getElementById("asteroids");
  beltEl = document.getElementById("belt");

  baseEl.appendChild(createBase(GameState.baseLevel));

  GameState.drones.forEach((d, i) => {
    const el = createDrone(d.type);
    droneContainerEl.appendChild(el);
  });

  // Init belt - more asteroids for better "abstract belt" feeling
  for (let i = 0; i < 25; i++) {
    spawnBeltAsteroid();
  }

  // Init collector drone - specialized look
  const colDrone = createDrone("heavy");
  colDrone.className = "collector-drone";
  sceneEl.appendChild(colDrone);
  GameState.logistics.collector.el = colDrone;

  // Init transporter
  const trans = document.createElement("div");
  trans.className = "transporter";
  trans.innerHTML = "<span>SHIP</span>";
  sceneEl.appendChild(trans);
  GameState.logistics.transporter.el = trans;

  document.getElementById("btnOverclock").onclick = () => {
    GameState.boostEndTime = Date.now() + 10000;
  };
  document.getElementById("btnSend").onclick = () => {
    if (!GameState.transport.active && GameState.storage.current > 0) {
      GameState.transport.active = true;
      GameState.transport.progress = 0;
    }
  };
}

function spawnBeltAsteroid() {
  const a = createAsteroid(0.3 + Math.random() * 0.7);
  a.className = "belt-asteroid";
  const size = 30 + Math.random() * 50;
  a.style.width = size + "px";
  a.style.height = size + "px";
  // Cover top and top-right (0 to 180px from top)
  a.style.top = (Math.random() * 180) + "px";
  a.style.left = "100%"; // Start off-screen right

  const duration = 25 + Math.random() * 45;
  a.style.animationDuration = duration + "s";
  a.style.animationDelay = -(Math.random() * duration) + "s";
  a.style.opacity = 0.4 + Math.random() * 0.6;

  beltEl.appendChild(a);
}

function updateUI() {
  const creditsEl = document.querySelector(".credits");
  const storageFill = document.querySelector(".storage-bar .fill");
  const transportFill = document.querySelector(".transport-bar .fill");

  if (creditsEl) creditsEl.textContent = Math.floor(GameState.credits) + " CR";
  if (storageFill) storageFill.style.width = (GameState.storage.current / GameState.storage.capacity * 100) + "%";
  if (transportFill) transportFill.style.width = (GameState.transport.progress * 100) + "%";
}

function updateDrones(deltaTime) {
  // Hide orbiting drones to avoid confusion with the collector drone
  for (let i = 0; i < droneContainerEl.children.length; i++) {
    droneContainerEl.children[i].style.display = "none";
  }
}

function updateLogistics(deltaTime) {
  const collector = GameState.logistics.collector;
  const transporter = GameState.logistics.transporter;

  if (!sceneEl || !collector.el || !transporter.el) return;
  const sceneRect = sceneEl.getBoundingClientRect();
  if (sceneRect.width === 0) return;

  const baseX = sceneRect.width / 2;
  const baseY = sceneRect.height / 2;

  // Collector Logic
  if (collector.state === "idle") {
    collector.state = "to_belt";
    collector.startX = baseX;
    collector.startY = baseY;
    // Target top-right quadrant
    collector.targetX = sceneRect.width * (0.6 + Math.random() * 0.35);
    collector.targetY = 40 + Math.random() * 140;
    collector.timer = 0;
    collector.el.style.opacity = "1";
    collector.el.style.display = "block";
  } else if (collector.state === "to_belt") {
    collector.timer += deltaTime / 4000;
    const t = Math.min(1, collector.timer);
    const x = collector.startX + (collector.targetX - collector.startX) * t;
    const y = collector.startY + (collector.targetY - collector.startY) * t;
    const dx = collector.targetX - collector.startX;
    const dy = collector.targetY - collector.startY;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    collector.el.style.transform = `translate(${x - 20}px, ${y - 20}px) rotate(${angle + 90}deg)`;

    if (t >= 1) {
      collector.state = "mining";
      collector.timer = 0;
      collector.el.style.opacity = "0"; // Vanish into the belt
    }
  } else if (collector.state === "mining") {
    collector.timer += deltaTime / 3000;
    if (collector.timer >= 1) {
      collector.state = "to_base";
      collector.timer = 0;
      collector.el.style.opacity = "1";
    }
  } else if (collector.state === "to_base") {
    collector.timer += deltaTime / 4000;
    const t = Math.min(1, collector.timer);
    const x = collector.targetX + (baseX - collector.targetX) * t;
    const y = collector.targetY + (baseY - collector.targetY) * t;
    const dx = baseX - collector.targetX;
    const dy = baseY - collector.targetY;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    collector.el.style.transform = `translate(${x - 20}px, ${y - 20}px) rotate(${angle + 90}deg)`;

    if (t >= 1) {
      collector.state = "unloading";
      collector.timer = 0;
      // Add local storage resources
      GameState.storage.current = Math.min(GameState.storage.capacity, GameState.storage.current + 20);
    }
  } else if (collector.state === "unloading") {
    collector.timer += deltaTime / 1000;
    collector.el.style.transform = `translate(${baseX - 20}px, ${baseY - 20}px)`;
    if (collector.timer >= 1) {
      collector.state = "idle";
    }
  }

  // Transporter Logic - fly ONLY when storage is >= capacity
  if (transporter.state === "idle") {
    if (GameState.storage.current >= GameState.storage.capacity) {
      transporter.state = "flying";
      transporter.timer = 0;
      transporter.el.style.display = "flex";
    } else {
      transporter.el.style.display = "none";
    }
  } else if (transporter.state === "flying") {
    transporter.timer += deltaTime / 12000;
    if (transporter.timer > 1.2) {
      transporter.state = "idle";
      GameState.credits += GameState.storage.current;
      GameState.storage.current = 0;
      transporter.el.style.display = "none";
    }

    const t = Math.min(1.1, transporter.timer);
    const startX = baseX;
    const startY = baseY;
    const endX = -200;
    const endY = sceneRect.height + 200;

    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    transporter.el.style.transform = `translate(${x - 25}px, ${y - 15}px) rotate(${angle}deg)`;
  }
}

function updateTransport(deltaTime) {
  // Legacy logic disabled
}

function gameLoop(timestamp) {
  const deltaTime = timestamp - (GameState.lastTime || timestamp);
  GameState.lastTime = timestamp;

  updateDrones(deltaTime);
  updateLogistics(deltaTime);
  updateUI();

  requestAnimationFrame(gameLoop);
}

function init() {
  initDOM();
  GameState.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", init);
