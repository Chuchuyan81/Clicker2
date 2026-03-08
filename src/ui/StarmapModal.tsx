import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Map as MapIcon, Database, Zap, Navigation2 } from 'lucide-react';
import { SECTORS_CONFIG } from '../config/sectors';
import { translations } from '../translations';

interface StarmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StarmapModal: React.FC<StarmapModalProps> = ({ isOpen, onClose }) => {
  const { currentSectorId, credits, warpToSector, language, upgrades } = useGameStore();
  const t = (translations as any)[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-950 border-2 border-neon-blue rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.3)] flex flex-col max-h-[95vh] text-blue-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-blue-900/50 bg-blue-950/40">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-orbitron neon-text-blue uppercase tracking-widest flex items-center gap-3">
              <Navigation2 className="text-neon-blue" size={28} />
              НАВИГАЦИЯ: СИСТЕМА EXO-MINE
            </h2>
            <p className="text-[10px] text-blue-400 font-mono tracking-widest opacity-70">GALAXY NAVIGATOR v4.0 // ACTIVE_SECTOR: {currentSectorId.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-blue-400 hover:text-white transition-all cursor-pointer p-2 hover:bg-blue-900/30 rounded-full border border-blue-900/30">
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grid lg:grid-cols-2 gap-8 bg-blue-950/10">
          {Object.values(SECTORS_CONFIG).map((sector) => {
            const isCurrent = sector.id === currentSectorId;
            const currentSector = SECTORS_CONFIG[currentSectorId];
            
            // Requirements Check
            const canAfford = credits >= sector.unlockCost;
            const refineryOk = upgrades.refinery.level >= currentSector.maxUpgrades.refinery;
            const storageOk = upgrades.cargo_bay.level >= currentSector.maxUpgrades.storage;
            const hangarOk = upgrades.hangar.level >= currentSector.maxUpgrades.hangar;
            
            const allMet = isCurrent || (canAfford && refineryOk && storageOk && hangarOk);
            
            return (
              <div 
                key={sector.id} 
                className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col gap-6 group
                  ${isCurrent ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 
                    'border-blue-900/30 bg-blue-950/20 hover:border-neon-blue/40 shadow-inner'}`}
              >
                {/* Sector Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-xl font-orbitron uppercase tracking-widest ${isCurrent ? 'text-green-400' : 'text-neon-blue'}`}>
                      {sector.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                      <span className={isCurrent ? 'text-green-500/70' : 'text-blue-500/70'}>ID: {sector.id}</span>
                      {isCurrent && <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[8px] border border-green-500/30 animate-pulse">ТЕКУЩАЯ ПОЗИЦИЯ</span>}
                    </div>
                  </div>
                  {!isCurrent && (
                    <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-800/30">
                      <Zap size={20} className={canAfford ? 'text-neon-gold' : 'text-gray-600'} />
                    </div>
                  )}
                </div>

                {/* Available Resources */}
                <div className="space-y-3">
                  <span className="text-[10px] text-blue-400 uppercase font-orbitron tracking-widest opacity-60">ДОСТУПНЫЕ РЕСУРСЫ</span>
                  <div className="flex flex-wrap gap-2">
                    {sector.resources.map(resId => (
                      <div key={resId} className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 rounded-lg border border-blue-800/20 group-hover:border-blue-700/40 transition-all">
                        <Database size={12} className="text-blue-400" />
                        <span className="text-[11px] text-blue-100/90 font-mono tracking-tight">{(t.resources as any)[resId] || resId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements Checklist (Only for other sectors) */}
                {!isCurrent && (
                  <div className="space-y-4 py-4 border-y border-blue-900/20">
                    <span className="text-[10px] text-blue-400 uppercase font-orbitron tracking-widest opacity-60">ТРЕБОВАНИЯ К ПРЫЖКУ (GATES)</span>
                    <div className="grid grid-cols-1 gap-2">
                      <RequirementItem 
                        label="Кредиты" 
                        current={credits} 
                        target={sector.unlockCost} 
                        unit="CR" 
                        isMet={canAfford} 
                      />
                      <RequirementItem 
                        label="Завод" 
                        current={upgrades.refinery.level} 
                        target={currentSector.maxUpgrades.refinery} 
                        unit="ур." 
                        isMet={refineryOk} 
                      />
                      <RequirementItem 
                        label="Грузовой отсек" 
                        current={upgrades.cargo_bay.level} 
                        target={currentSector.maxUpgrades.storage} 
                        unit="ур." 
                        isMet={storageOk} 
                      />
                      <RequirementItem 
                        label="Ангар" 
                        current={upgrades.hangar.level} 
                        target={currentSector.maxUpgrades.hangar} 
                        unit="ур." 
                        isMet={hangarOk} 
                      />
                    </div>
                  </div>
                )}

                {/* Action Area */}
                <div className="mt-auto">
                  {isCurrent ? (
                    <div className="w-full text-center py-4 text-green-400 font-orbitron text-[10px] tracking-[0.3em] uppercase opacity-60">
                      СИСТЕМА СТАБИЛИЗИРОВАНА
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        warpToSector(sector.id);
                        onClose();
                      }}
                      disabled={!allMet}
                      className={`w-full py-4 rounded-xl font-orbitron text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 border
                        ${allMet 
                          ? 'bg-neon-blue/10 border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-black cursor-pointer shadow-[0_0_20px_rgba(0,242,255,0.2)]' 
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed grayscale'}`}
                    >
                      <Navigation2 size={16} className={allMet ? 'animate-pulse' : ''} />
                      {t.ui.initiate_warp}
                    </button>
                  )}
                </div>

                {/* Visual Decoration */}
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <MapIcon size={120} className={isCurrent ? 'text-green-500' : 'text-neon-blue'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-blue-900/50 bg-blue-950/40 flex justify-between items-center">
          <div className="text-[10px] text-blue-500 font-mono tracking-widest opacity-50 uppercase">
            NAV_DATA_LINK_ESTABLISHED // SECURE_LINE
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-blue-400 uppercase opacity-70">БАЛАНС:</span>
            <span className="text-neon-gold font-mono text-lg font-bold">{credits.toLocaleString()} CR</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface RequirementItemProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  isMet: boolean;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ label, current, target, unit, isMet }) => (
  <div className="flex items-center justify-between text-[11px] font-mono px-3 py-2 bg-black/40 rounded-lg border border-blue-900/20">
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isMet ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
        {isMet ? '✓' : '✗'}
      </div>
      <span className="text-blue-300/70">{label}:</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={isMet ? 'text-green-400' : 'text-red-400'}>{current.toLocaleString()}</span>
      <span className="text-blue-500/50">/</span>
      <span className="text-blue-100">{target.toLocaleString()}</span>
      <span className="text-blue-500/50 text-[9px]">{unit}</span>
    </div>
  </div>
);

export default StarmapModal;
