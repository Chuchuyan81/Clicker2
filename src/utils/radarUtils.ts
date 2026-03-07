import { RadarCell, RadarUpgrades, ResourceType } from '../types';

export const generateRadarGrid = (upgrades: RadarUpgrades): RadarCell[] => {
  const size = upgrades.gridSize === 0 ? 5 : upgrades.gridSize === 1 ? 6 : 8;
  const grid: RadarCell[] = [];
  const totalCells = size * size;

  const hazardCount = Math.floor(totalCells * 0.10);
  const resourceCount = Math.floor(totalCells * 0.25);

  // Initialize empty cells
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

  // Helper to get random available cells
  const getAvailableIndices = () => {
    return grid
      .map((cell, index) => (cell.type === 'empty' ? index : -1))
      .filter((index) => index !== -1);
  };

  // Place hazards
  for (let i = 0; i < hazardCount; i++) {
    const indices = getAvailableIndices();
    if (indices.length === 0) break;
    const randomIndex = indices[Math.floor(Math.random() * indices.length)];
    grid[randomIndex].type = 'hazard';
  }

  // Place resources
  for (let i = 0; i < resourceCount; i++) {
    const indices = getAvailableIndices();
    if (indices.length === 0) break;
    const randomIndex = indices[Math.floor(Math.random() * indices.length)];
    grid[randomIndex].type = 'resource';
    
    // Determine resource type based on deepScan level
    const rand = Math.random();
    let resType: ResourceType = 'metal';
    if (upgrades.deepScan === 1) {
      resType = rand < 0.3 ? 'ice' : 'metal';
    } else if (upgrades.deepScan === 2) {
      if (rand < 0.15) resType = 'crystal';
      else if (rand < 0.40) resType = 'ice';
      else resType = 'metal';
    } else if (upgrades.deepScan === 3) {
      if (rand < 0.10) resType = 'iridium';
      else if (rand < 0.25) resType = 'crystal';
      else if (rand < 0.50) resType = 'ice';
      else resType = 'metal';
    }
    grid[randomIndex].resourceDrop = resType;
  }

  // Calculate adjacentCount
  grid.forEach((cell) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const neighbor = grid.find((c) => c.x === nx && c.y === ny);
          if (neighbor && (neighbor.type === 'resource' || neighbor.type === 'hazard')) {
            count++;
          }
        }
      }
    }
    cell.adjacentCount = count;
  });

  // Sonar (Auto-reveal resources)
  if (upgrades.sonar > 0) {
    const resourceIndices = grid
      .map((cell, index) => (cell.type === 'resource' ? index : -1))
      .filter((index) => index !== -1);
    
    const revealCount = Math.min(upgrades.sonar, resourceIndices.length);
    for (let i = 0; i < revealCount; i++) {
      const randomIndex = Math.floor(Math.random() * resourceIndices.length);
      const index = resourceIndices.splice(randomIndex, 1)[0];
      grid[index].revealed = true;
    }
  }

  return grid;
};

export const revealEmptyCells = (grid: RadarCell[], startCell: RadarCell, size: number): RadarCell[] => {
  const newGrid = [...grid];
  const stack = [startCell];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const cell = stack.pop()!;
    if (visited.has(cell.id)) continue;
    visited.add(cell.id);

    const gridCell = newGrid.find(c => c.id === cell.id);
    if (gridCell) {
      gridCell.revealed = true;
      
      // If it's an empty cell with 0 adjacent neighbors, continue spreading
      if (gridCell.type === 'empty' && gridCell.adjacentCount === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = gridCell.x + dx;
            const ny = gridCell.y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
              const neighbor = newGrid.find(c => c.x === nx && c.y === ny);
              if (neighbor && !neighbor.revealed && neighbor.type === 'empty') {
                stack.push(neighbor);
              }
            }
          }
        }
      }
    }
  }

  return newGrid;
};
