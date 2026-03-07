import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { gameEngine } from './engine/GameEngine';
import CentralScene from './ui/CentralScene';
import UpgradeModal from './ui/UpgradeModal';
import MainMenu from './ui/MainMenu';
import RadarOverlay from './ui/RadarOverlay';
import { Wallet, Package, Rocket, Zap, Sliders, Lock, Home, Database } from 'lucide-react';
import { translations } from './translations';

const App: React.FC = () => {
  useEffect(() => {
    gameEngine.start();
    return () => gameEngine.stop();
  }, []);

  const { 
    credits, drones, storage, transport, startTransport, activateMiningBurst, 
    boostEndTime, lastSaleTimestamp, language, isGameActive, exitToMenu,
    radar, startRadarScan
  } = useGameStore();
  const [, setBoostTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'upgrades' | 'drones' | 'archive'>('upgrades');

  const t = (translations as any)[language];
  const boostActive = boostEndTime > Date.now();
  const boostRemainingSec = Math.max(0, Math.ceil((boostEndTime - Date.now()) / 1000));

  const radarTimerSec = Math.max(0, Math.ceil((radar.rechargeRateMs - radar.energyTimerMs) / 1000));
  const radarTimerFormatted = `${Math.floor(radarTimerSec / 60)}:${(radarTimerSec % 60).toString().padStart(2, '0')}`;

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

  const openUpgradeModal = (tab: 'upgrades' | 'drones' | 'archive') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const unlocked = credits >= 100 || drones.length > 1;

  if (!isGameActive) {
    return <MainMenu />;
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-space-900 overflow-hidden text-white font-sans selection:bg-neon-blue/30">
      
      {/* 🔝 HUD (Верхняя панель) */}
      <header className="h-16 border-b border-space-700 bg-space-800/80 backdrop-blur-md flex items-center px-3 md:px-6 justify-between z-50 shrink-0">
        {/* Left Side: Home & Credits */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button 
            onClick={exitToMenu}
            className="p-2 rounded-lg bg-space-700 border border-space-600 hover:bg-space-600 transition-colors cursor-pointer"
          >
            <Home size={18} className="text-gray-300" />
          </button>
          
          <div className="flex items-center gap-2 ml-1">
            <Wallet className="text-neon-gold w-5 h-5 md:w-6 md:h-6 drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
            <span className="text-lg md:text-2xl font-orbitron neon-text-gold tabular-nums tracking-wider transition-transform duration-100 hover:scale-[1.02]">
              {Math.floor(credits).toLocaleString()} <span className="text-[10px] md:text-xs">CR</span>
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 md:gap-8 flex-1 justify-end max-w-[500px]">
          {/* Storage Bar - Expanded */}
          <div className={`flex flex-col items-stretch gap-1 flex-1 transition-all duration-300 min-w-0 ${storageFillRatio >= 1 ? 'ring-1 ring-neon-blue rounded-lg px-2 py-1 shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse' : ''}`}>
            <div className="flex items-center justify-between text-[8px] md:text-[10px] uppercase font-orbitron text-gray-400">
              <span className="flex items-center gap-1 truncate"><Package size={10} /> {t.ui.storage}</span>
              <span className="tabular-nums shrink-0">{Math.floor(currentStorage)}/{storage.capacity}</span>
            </div>
            <div className="bg-space-700 h-1.5 md:h-3 rounded-full overflow-hidden border border-space-600">
              <div 
                className={`h-full transition-all duration-300 ${storageFillRatio > 0.9 ? 'bg-red-500 animate-pulse' : storageFillRatio > 0.7 ? 'bg-orange-500' : 'bg-neon-blue'}`} 
                style={{ width: `${storageFillRatio * 100}%` }}
              />
            </div>
            
            {/* Resource Breakdown */}
            <button 
              onClick={() => openUpgradeModal('archive')}
              className="flex gap-2 mt-1 px-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
            >
              {Object.entries(storage.current).map(([type, amount]) => {
                if (amount === 0) return null;
                const colors = {
                  metal: 'bg-slate-500',
                  ice: 'bg-blue-400',
                  crystal: 'bg-purple-500',
                  iridium: 'bg-amber-500'
                };
                return (
                  <div key={type} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors[type as keyof typeof colors]}`} />
                    <span className="text-[7px] md:text-[8px] font-mono text-gray-400">{Math.floor(amount)}</span>
                  </div>
                );
              })}
            </button>
          </div>

          {/* Transport Status - Simple Badge */}
          <div className="flex flex-col items-center gap-1 min-w-[65px] md:min-w-[100px] shrink-0">
            <div className="text-[8px] md:text-[10px] uppercase font-orbitron text-gray-400 flex items-center gap-1">
              <Rocket size={10} /> {t.ui.transport}
            </div>
            <div className={`px-1.5 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-orbitron border uppercase tracking-wider transition-all
              ${!transport.isActive 
                ? 'border-gray-700 text-gray-600 bg-space-800' 
                : transport.state === 'offscreen_wait'
                  ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.2)] animate-pulse'
                  : 'border-green-500 text-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              }`}>
              {!transport.isActive ? t.ui.status_ready : (transport.state === 'offscreen_wait' ? t.ui.status_loading : t.ui.status_en_route)}
            </div>
          </div>
        </div>
      </header>

      {/* 🌌 Центральная сцена */}
      <div className={`flex-1 min-h-0 flex flex-col ${isShaking ? 'animate-shake' : ''}`}>
        <CentralScene />
      </div>

      {/* 🔘 Нижняя панель действий */}
      <footer className="h-20 md:h-24 border-t border-space-700 bg-space-800/80 backdrop-blur-md flex items-center px-4 md:px-6 justify-center gap-2 md:gap-6 z-50 shrink-0">
        <button 
          onClick={() => activateMiningBurst()} 
          className={`group relative flex-1 max-w-[80px] md:max-w-[100px] flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all duration-200 neon-border h-16 md:h-20 cursor-pointer
            ${boostActive ? 'bg-neon-blue/20 ring-2 ring-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'hover:bg-space-700 bg-space-800 active:scale-95'}`}
        >
          <Zap size={18} className={`mb-1 ${boostActive ? 'text-neon-blue animate-pulse' : 'text-neon-blue md:group-hover:scale-110'} transition-transform`} />
          <span className="text-[8px] md:text-[10px] font-orbitron uppercase text-gray-400 text-center">
            {boostActive ? `${boostRemainingSec}s` : t.ui.overclock}
          </span>
        </button>

        <button 
          onClick={() => !transport.isActive && currentStorage >= storage.capacity * 0.2 && startTransport()}
          disabled={transport.isActive || currentStorage < storage.capacity * 0.2}
          className={`relative flex-1 max-w-[80px] md:max-w-[100px] flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all duration-200 h-16 md:h-20 neon-border cursor-pointer
            ${transport.isActive || currentStorage < storage.capacity * 0.2 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-space-700 bg-space-800 active:scale-95'}`}
        >
          <Rocket size={18} className="text-neon-gold mb-1" />
          <span className="text-[8px] md:text-[10px] font-orbitron uppercase text-gray-400 text-center">{t.ui.send}</span>
          {currentStorage < storage.capacity * 0.2 && !transport.isActive && (
            <span className="absolute -top-4 md:-top-6 text-[7px] md:text-[8px] text-gray-500 font-mono whitespace-nowrap">min 20%</span>
          )}
        </button>

        <button 
          onClick={() => radar.energy > 0 && startRadarScan()} 
          disabled={radar.energy <= 0 || radar.isActive}
          className={`group relative flex-1 max-w-[80px] md:max-w-[100px] flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all duration-200 neon-border h-16 md:h-20 cursor-pointer
            ${radar.energy > 0 ? 'hover:bg-space-700 bg-space-800 active:scale-95' : 'bg-space-800 opacity-50 cursor-not-allowed'}`}
        >
          <div className="relative mb-1">
            <Database size={18} className="text-neon-blue" />
            <div className="absolute -top-1 -right-1 flex gap-0.5">
              {Array.from({ length: radar.maxEnergy }).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${i < radar.energy ? 'bg-neon-blue' : 'bg-gray-600'}`} />
              ))}
            </div>
          </div>
          <span className="text-[8px] md:text-[10px] font-orbitron uppercase text-gray-400 text-center">
            {radar.energy < radar.maxEnergy ? radarTimerFormatted : t.ui.start_scan}
          </span>
        </button>

        <button 
          onClick={() => unlocked && openUpgradeModal('upgrades')}
          className={`group/lock relative flex-1 max-w-[80px] md:max-w-[100px] flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all duration-200 neon-border h-16 md:h-20
            ${unlocked ? 'bg-space-800 hover:bg-space-700 active:scale-95 cursor-pointer' : 'bg-space-800 opacity-60 cursor-not-allowed'}`}
          disabled={!unlocked}
        >
          {!unlocked && (
            <div className="absolute -top-0.5 -right-0.5 bg-space-700 rounded p-0.5"><Lock size={10} className="text-gray-400" /></div>
          )}
          <Sliders size={18} className={`${unlocked ? 'text-neon-blue' : 'text-white'} mb-1`} />
          <span className="text-[8px] md:text-[10px] font-orbitron uppercase text-gray-400 text-center">{t.ui.upgrades}</span>
          {!unlocked && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-space-700 text-[8px] opacity-0 group-hover/lock:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-space-600">{t.ui.unlock_at} 100 CR</span>
          )}
        </button>
      </footer>

      {/* Stats Overlay (Bottom Right) */}
      <div className="absolute bottom-24 md:bottom-28 right-4 md:right-6 text-right pointer-events-none opacity-60">
        <div className="text-[8px] md:text-[10px] font-orbitron text-gray-400 uppercase tracking-widest">{t.ui.efficiency}</div>
        <div className="text-base md:text-xl font-mono">{(drones.reduce((sum, d) => sum + d.miningRate, 0)).toFixed(1)}/s</div>
      </div>

      <UpgradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialTab={modalTab} 
      />
      <RadarOverlay />
    </div>
  );
};

export default App;
