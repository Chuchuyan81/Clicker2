import { RadarCell, RadarUpgrades, ResourceType, SectorId } from '../types';
import { SECTORS_CONFIG } from '../config/sectors';

export const generateRadarGrid = (upgrades: RadarUpgrades, sectorId: SectorId): RadarCell[] => {
  const size = upgrades.gridSize === 0 ? 5 : upgrades.gridSize === 1 ? 6 : 8;
  const totalCells = size * size;
  const grid: RadarCell[] = [];

  const sectorResources = SECTORS_CONFIG[sectorId].resources;

  // Initialize empty grid
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid.push({
        id: `${x}-${y}`,
        x,
        y,
        type: 'empty',
        revealed: false,
        adjacentCount: 0,
      });
    }
  }

  // Calculate counts
  const hazardCount = Math.floor(totalCells * 0.1);
  const resourceCount = Math.floor(totalCells * 0.25);

  const getRandomCell = (filter: (c: RadarCell) => boolean) => {
    const available = grid.filter(filter);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  // Place Hazards
  for (let i = 0; i < hazardCount; i++) {
    const cell = getRandomCell(c => c.type === 'empty');
    if (cell) cell.type = 'hazard';
  }

  // Place Resources
  for (let i = 0; i < resourceCount; i++) {
    const cell = getRandomCell(c => c.type === 'empty');
    if (cell) {
      cell.type = 'resource';
      cell.resourceDrop = getResourceByDeepScan(upgrades.deepScan, sectorResources);
    }
  }

  // Calculate Adjacent Counts
  grid.forEach(cell => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const neighbor = grid[ny * size + nx];
          if (neighbor.type !== 'empty') count++;
        }
      }
    }
    cell.adjacentCount = count;
  });

  // Sonar Logic: Auto-reveal N resource cells
  if (upgrades.sonar > 0) {
    const resources = grid.filter(c => c.type === 'resource');
    const toReveal = Math.min(upgrades.sonar, resources.length);
    for (let i = 0; i < toReveal; i++) {
      const idx = Math.floor(Math.random() * resources.length);
      const cell = resources.splice(idx, 1)[0];
      cell.revealed = true;
    }
  }

  return grid;
};

const getResourceByDeepScan = (level: number, sectorResources: ResourceType[]): ResourceType => {
  const rand = Math.random();
  const [res1, res2, res3, res4] = sectorResources;

  if (level === 0) return res1;
  if (level === 1) {
    if (rand < 0.3) return res2 || res1;
    return res1;
  }
  if (level === 2) {
    if (rand < 0.15) return res3 || res2 || res1;
    if (rand < 0.4) return res2 || res1;
    return res1;
  }
  // lvl 3+
  if (rand < 0.1) return res4 || res3 || res2 || res1;
  if (rand < 0.25) return res3 || res2 || res1;
  if (rand < 0.5) return res2 || res1;
  return res1;
};

export const revealEmptyCells = (grid: RadarCell[], startCell: RadarCell, size: number): RadarCell[] => {
  const newGrid = [...grid];
  const queue = [startCell];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const cell = queue.shift()!;
    if (visited.has(cell.id)) continue;
    visited.add(cell.id);

    const target = newGrid.find(c => c.id === cell.id);
    if (!target || target.type !== 'empty') continue;

    target.revealed = true;

    // If it's a "0" cell, reveal neighbors
    if (target.adjacentCount === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = target.x + dx;
          const ny = target.y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const neighbor = newGrid[ny * size + nx];
            if (!neighbor.revealed) queue.push(neighbor);
          }
        }
      }
    }
  }

  return newGrid;
};
