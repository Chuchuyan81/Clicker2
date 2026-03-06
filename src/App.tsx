import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { gameEngine } from './engine/GameEngine';
import CentralScene from './ui/CentralScene';
import UpgradeModal from './ui/UpgradeModal';
import { Wallet, Package, Rocket, Zap, Sliders, Layout, Lock } from 'lucide-react';
import { translations } from './translations';

const App: React.FC = () => {
  useEffect(() => {
    gameEngine.start();
    return () => gameEngine.stop();
  }, []);

  const { credits, drones, storage, transport, startTransport, activateMiningBurst, boostEndTime, lastSaleTimestamp, language } = useGameStore();
  const [, setBoostTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'upgrades' | 'drones' | 'settings'>('upgrades');

  const t = translations[language];
  const boostActive = boostEndTime > Date.now();
  const boostRemainingSec = Math.max(0, Math.ceil((boostEndTime - Date.now()) / 1000));

  useEffect(() => {
    if (!boostActive) return;
    const id = setInterval(() => setBoostTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [boostActive, boostEndTime]);

  const [isShaking, setIsShaking] = useState(false);
  useEffect(() => {
    if (lastSaleTimestamp > 0) {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 350);
      return () => clearTimeout(t);
    }
  }, [lastSaleTimestamp]);

  const currentStorage = Object.values(storage.current).reduce((a, b) => a + b, 0);
  const storageFillRatio = currentStorage / storage.capacity;

  const openUpgradeModal = (tab: 'upgrades' | 'drones') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const unlocked = credits >= 100 || drones.length > 1;

  return (
    <div className="h-screen w-screen flex flex-col bg-space-900 overflow-hidden text-white font-sans">
      
      {/* 🔝 HUD (Верхняя панель) */}
      <header className="h-16 border-b border-space-700 bg-space-800/80 backdrop-blur-md flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="text-neon-gold w-6 h-6 drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
            <span className="text-2xl font-orbitron neon-text-gold tabular-nums tracking-wider transition-transform duration-100 hover:scale-[1.02] shadow-[0_0_8px_rgba(255,215,0,0.3)]">
              {Math.floor(credits).toLocaleString()} <span className="text-xs">CR</span>
            </span>
          </div>
          {boostActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neon-blue/20 border border-neon-blue">
              <Zap className="text-neon-blue w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono text-neon-blue">{boostRemainingSec}s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className={`flex flex-col items-end gap-1 transition-all duration-300 ${storageFillRatio >= 1 ? 'ring-2 ring-neon-blue rounded-lg px-2 py-1 shadow-[0_0_20px_rgba(0,242,255,0.4)] animate-pulse' : ''}`}>
            <div className="flex items-center gap-2 text-[10px] uppercase font-orbitron text-gray-400">
              <Package size={12} /> {t.ui.storage} {Math.round(storageFillRatio * 100)}%
            </div>
            <div className="w-32 bg-space-700 h-1.5 rounded-full overflow-hidden border border-space-600">
              <div 
                className={`h-full transition-all duration-300 ${storageFillRatio > 0.9 ? 'bg-red-500 animate-pulse' : storageFillRatio > 0.7 ? 'bg-orange-500' : 'bg-neon-blue'}`} 
                style={{ width: `${storageFillRatio * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[10px] uppercase font-orbitron text-gray-400">
              <Rocket size={12} /> {t.ui.transport} {transport.isActive ? (transport.state === 'offscreen_wait' ? t.ui.status_loading : t.ui.status_en_route) : t.ui.status_ready}
            </div>
            <div className="w-32 bg-space-700 h-1.5 rounded-full overflow-hidden border border-space-600">
              <div 
                className="h-full bg-green-500 transition-all duration-100" 
                style={{ width: `${transport.progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 🌌 Центральная сцена — растягивается на весь свободный экран */}
      <div className={`flex-1 min-h-0 flex flex-col ${isShaking ? 'animate-shake' : ''}`}>
        <CentralScene />
      </div>

      {/* 🔘 Нижняя панель действий */}
      <footer className="h-24 border-t border-space-700 bg-space-800/80 backdrop-blur-md flex items-center px-6 justify-around z-50">
        <button 
          onClick={() => activateMiningBurst()} 
          className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 neon-border w-20 h-20 cursor-pointer
            ${boostActive ? 'bg-neon-blue/20 ring-2 ring-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'hover:bg-space-700 bg-space-800 active:scale-95'}`}
        >
          <Zap className={`mb-1 ${boostActive ? 'text-neon-blue animate-pulse' : 'text-neon-blue group-hover:scale-110'} transition-transform`} />
          <span className="text-[10px] font-orbitron uppercase text-gray-400">
            {boostActive ? `${boostRemainingSec}s` : t.ui.overclock}
          </span>
        </button>

        <button 
          onClick={() => !transport.isActive && currentStorage > 0 && startTransport()}
          disabled={transport.isActive || currentStorage === 0}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 w-20 h-20 neon-border cursor-pointer
            ${transport.isActive || currentStorage === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-space-700 bg-space-800 active:scale-95'}`}
        >
          <Rocket className="text-neon-gold mb-1" />
          <span className="text-[10px] font-orbitron uppercase text-gray-400">{t.ui.send}</span>
        </button>

        <button 
          onClick={() => unlocked && openUpgradeModal('upgrades')}
          className={`group/lock relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 neon-border w-20 h-20
            ${unlocked ? 'bg-space-800 hover:bg-space-700 active:scale-95 cursor-pointer' : 'bg-space-800 opacity-60 cursor-not-allowed'}`}
          disabled={!unlocked}
        >
          {!unlocked && (
            <div className="absolute -top-0.5 -right-0.5 bg-space-700 rounded p-0.5"><Lock className="text-gray-400 w-2.5 h-2.5" /></div>
          )}
          <Sliders className={`${unlocked ? 'text-neon-blue' : 'text-white'} mb-1`} />
          <span className="text-[10px] font-orbitron uppercase text-gray-400">{t.ui.upgrades}</span>
          {!unlocked && (
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-space-700 text-[9px] opacity-0 group-hover/lock:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-space-600">{t.ui.unlock_at} 100 CR</span>
          )}
        </button>

        <button 
          onClick={() => unlocked && openUpgradeModal('drones')}
          className={`group/lock relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 neon-border w-20 h-20
            ${unlocked ? 'bg-space-800 hover:bg-space-700 active:scale-95 cursor-pointer' : 'bg-space-800 opacity-60 cursor-not-allowed'}`}
          disabled={!unlocked}
        >
          {!unlocked && (
            <div className="absolute -top-0.5 -right-0.5 bg-space-700 rounded p-0.5"><Lock className="text-gray-400 w-2.5 h-2.5" /></div>
          )}
          <Layout className={`${unlocked ? 'text-neon-blue' : 'text-white'} mb-1`} />
          <span className="text-[10px] font-orbitron uppercase text-gray-400">{t.ui.drones}</span>
          {!unlocked && (
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-space-700 text-[9px] opacity-0 group-hover/lock:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-space-600">{t.ui.unlock_at} 100 CR</span>
          )}
        </button>
      </footer>

      {/* Stats Overlay (Bottom Right) */}
      <div className="absolute bottom-28 right-6 text-right pointer-events-none opacity-60">
        <div className="text-[10px] font-orbitron text-gray-400 uppercase tracking-widest">{t.ui.efficiency}</div>
        <div className="text-xl font-mono">{(drones.reduce((sum, d) => sum + d.miningRate, 0)).toFixed(1)}/s</div>
      </div>

      <UpgradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialTab={modalTab} 
      />
    </div>
  );
};

export default App;
