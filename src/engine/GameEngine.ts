import { useGameStore } from '../store/gameStore';

export class GameEngine {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.lastTime = performance.now();
  }

  public start() {
    this.loop();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private loop = () => {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.update(deltaTime);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    const { updateDrones, updateTransport, updateNotifications } = useGameStore.getState();
    
    // Update logic
    updateDrones(deltaTime);
    updateTransport(deltaTime);
    updateNotifications(deltaTime);
  }
}

export const gameEngine = new GameEngine();
