import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Zap, Battery, Database, Radiation, MousePointer2 } from 'lucide-react';
import { RadarCell as RadarCellType, ResourceType } from '../types';
import { translations } from '../translations';

const RESOURCE_COLORS: Record<ResourceType, string> = {
  metal: 'text-slate-400',
  ice: 'text-blue-400',
  crystal: 'text-purple-400',
  iridium: 'text-amber-400',
};

const RadarCell: React.FC<{ cell: RadarCellType }> = ({ cell }) => {
  const { clickRadarCell } = useGameStore();

  const getAdjacentColor = (count: number) => {
    if (count === 0) return 'text-gray-600';
    if (count === 1) return 'text-green-400';
    if (count === 2) return 'text-yellow-400';
    if (count === 3) return 'text-orange-400';
    return 'text-red-500';
  };

  return (
    <div className="relative aspect-square w-full h-full">
      <AnimatePresence mode="wait">
        {!cell.revealed ? (
          <motion.button
            key="hidden"
            initial={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            onClick={() => clickRadarCell(cell.id)}
            className="w-full h-full bg-space-800 border border-neon-blue/30 rounded-lg hover:bg-neon-blue/10 transition-colors cursor-pointer flex items-center justify-center group"
          >
            <div className="w-1 h-1 bg-neon-blue/20 rounded-full group-hover:scale-150 transition-transform" />
          </motion.button>
        ) : (
          <motion.div
            key="revealed"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className={`w-full h-full rounded-lg border flex items-center justify-center font-orbitron text-lg relative overflow-hidden
              ${cell.type === 'empty' ? 'bg-space-900/50 border-space-700' : 
                cell.type === 'hazard' ? 'bg-red-950/30 border-red-500/50' : 
                'bg-neon-blue/5 border-neon-blue/30'}`}
          >
            {cell.type === 'empty' && (
              <span className={getAdjacentColor(cell.adjacentCount)}>
                {cell.adjacentCount > 0 ? cell.adjacentCount : ''}
              </span>
            )}
            {cell.type === 'hazard' && (
              <Radiation size={20} className="text-red-500 animate-pulse" />
            )}
            {cell.type === 'resource' && cell.resourceDrop && (
              <Database size={20} className={RESOURCE_COLORS[cell.resourceDrop]} />
            )}
            
            {/* Scanline effect for resources */}
            {cell.type === 'resource' && (
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,242,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RadarOverlay: React.FC = () => {
  const { radar, closeRadar, storage, language } = useGameStore();
  const t = (translations as any)[language];

  if (!radar.isActive) return null;

  const currentStorage = Object.values(storage.current).reduce((a, b) => a + b, 0);
  const storageFillRatio = currentStorage / storage.capacity;
  const gridSize = Math.sqrt(radar.grid.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-xl text-white p-4 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full mb-8">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-orbitron tracking-widest">
              <Battery size={14} className="text-neon-blue" />
              {t.ui.battery_status || 'Energy Units'}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 15 }).map((_, i) => {
                const maxClicks = 10 + (radar.upgrades.battery * 2);
                if (i >= maxClicks) return null;
                return (
                  <div 
                    key={i} 
                    className={`h-4 w-2 rounded-sm border transition-all duration-500
                      ${i < radar.clicksRemaining 
                        ? 'bg-neon-blue border-neon-blue shadow-[0_0_8px_rgba(0,242,255,0.5)]' 
                        : 'bg-transparent border-gray-800'}`} 
                  />
                );
              })}
            </div>
          </div>

          <div className="h-10 w-[1px] bg-space-700 hidden md:block" />

          <div className="hidden md:flex flex-col gap-1 w-48">
            <div className="flex items-center justify-between text-[10px] uppercase font-orbitron text-gray-400">
              <span className="flex items-center gap-1"><Database size={12} /> {t.ui.storage}</span>
              <span>{Math.floor(storageFillRatio * 100)}%</span>
            </div>
            <div className="bg-space-800 h-2 rounded-full overflow-hidden border border-space-700">
              <div 
                className={`h-full transition-all duration-300 ${storageFillRatio > 0.9 ? 'bg-red-500' : 'bg-neon-blue'}`} 
                style={{ width: `${storageFillRatio * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {radar.sessionEarnedCR > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-orbitron text-gray-500">{t.ui.session_profit || 'Yield'}</span>
              <span className="text-neon-gold font-mono text-xl">+{Math.floor(radar.sessionEarnedCR)} CR</span>
            </div>
          )}
          <button 
            onClick={closeRadar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div 
          className={`grid gap-2 w-full max-w-2xl aspect-square p-2 bg-space-900/30 border border-white/5 rounded-2xl backdrop-blur-sm
            ${gridSize === 5 ? 'grid-cols-5' : gridSize === 6 ? 'grid-cols-6' : 'grid-cols-8'}`}
        >
          {radar.grid.map((cell) => (
            <RadarCell key={cell.id} cell={cell} />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl mx-auto w-full mt-8 flex justify-between items-center text-gray-500 font-orbitron text-[10px] tracking-[0.2em] uppercase">
        <div className="flex items-center gap-2">
          <MousePointer2 size={12} />
          {radar.clicksRemaining} {t.ui.clicks_remaining || 'Pulses Left'}
        </div>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-blue" />
          {t.ui.radar_scanning || 'Scanning Sector...'}
        </div>
      </div>

      {/* Out of pulses screen */}
      {radar.clicksRemaining <= 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-center items-center justify-center z-[210]"
        >
          <div className="flex flex-col items-center gap-6 p-8 border-2 border-neon-blue rounded-2xl bg-space-950 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
            <h2 className="text-3xl font-orbitron neon-text-blue uppercase tracking-[0.3em]">{t.ui.scan_complete || 'Scan Complete'}</h2>
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-sm">{t.ui.total_profit || 'Resources Recovered'}</span>
              <span className="text-neon-gold text-4xl font-mono">+{Math.floor(radar.sessionEarnedCR)} CR</span>
            </div>
            <button 
              onClick={closeRadar}
              className="px-12 py-4 bg-neon-blue text-black font-orbitron uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              {t.ui.return_to_base || 'Return to HQ'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RadarOverlay;
