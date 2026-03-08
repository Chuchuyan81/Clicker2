import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Database, Zap, Navigation2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { SECTORS_CONFIG, SectorId } from '../config/sectors';
import { translations } from '../translations';

interface StarmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StarmapModal: React.FC<StarmapModalProps> = ({ isOpen, onClose }) => {
  const { currentSectorId, credits, warpToSector, language, upgrades } = useGameStore();
  const t = (translations as any)[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden">
          {/* Backdrop Blur Decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-slate-950 border border-blue-500/30 rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.1)] flex flex-col max-h-[90vh] text-blue-100 relative"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between px-10 py-8 border-b border-blue-500/20 bg-blue-950/20 backdrop-blur-md">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Navigation2 className="text-neon-blue animate-pulse" size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-orbitron font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                      WARP DRIVE MENU
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-blue-400 font-mono tracking-[0.3em] uppercase opacity-70">SYSTEM_STATUS: ONLINE</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-blue-400 font-orbitron tracking-widest uppercase opacity-50 mb-1">CURRENT_CREDITS</span>
                  <div className="flex items-center gap-3 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
                    <Zap size={16} className="text-neon-gold" />
                    <span className="text-xl font-mono font-bold text-neon-gold tracking-tight">{credits.toLocaleString()} <span className="text-xs">CR</span></span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="group relative p-3 text-blue-400 hover:text-white transition-all cursor-pointer rounded-xl border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10"
                >
                  <X size={24} />
                  <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                </button>
              </div>
            </div>

            {/* Sector Grid */}
            <div className="relative z-20 p-10 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-blue-950/10 to-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.values(SECTORS_CONFIG).map((sector, index) => (
                  <SectorCard 
                    key={sector.id}
                    sector={sector}
                    index={index}
                    isCurrent={sector.id === currentSectorId}
                    currentCredits={credits}
                    currentUpgrades={upgrades}
                    currentSectorConfig={SECTORS_CONFIG[currentSectorId]}
                    onWarp={(id) => {
                      warpToSector(id);
                      onClose();
                    }}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-20 px-10 py-4 border-t border-blue-500/20 bg-blue-950/30 flex justify-between items-center text-[10px] font-mono tracking-[0.2em] text-blue-400/60 uppercase">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> NAVIGATION_LINK: STABLE</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> ENCRYPTION: AES-256</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="animate-pulse">LOCAL_TIME: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface SectorCardProps {
  sector: any;
  index: number;
  isCurrent: boolean;
  currentCredits: number;
  currentUpgrades: any;
  currentSectorConfig: any;
  onWarp: (id: SectorId) => void;
  t: any;
}

const SectorCard: React.FC<SectorCardProps> = ({ 
  sector, index, isCurrent, currentCredits, currentUpgrades, currentSectorConfig, onWarp, t 
}) => {
  // Requirements Check
  const canAfford = currentCredits >= sector.unlockCost;
  const refineryOk = currentUpgrades.refinery.level >= currentSectorConfig.maxUpgrades.refinery;
  const storageOk = currentUpgrades.cargo_bay.level >= currentSectorConfig.maxUpgrades.storage;
  const hangarOk = currentUpgrades.hangar.level >= currentSectorConfig.maxUpgrades.hangar;
  
  const isUnlocked = isCurrent || (canAfford && refineryOk && storageOk && hangarOk);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-500
        ${isCurrent 
          ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.1)]' 
          : isUnlocked 
            ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 shadow-lg' 
            : 'bg-black/40 border-white/5 grayscale-[0.8] opacity-60'}`}
    >
      {/* Background Icon Watermark */}
      <div className="absolute top-4 right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        <Navigation2 size={120} />
      </div>

      {/* Header Info */}
      <div className="relative z-10 mb-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className={`text-xl font-orbitron font-bold tracking-widest uppercase ${isCurrent ? 'text-green-400' : 'text-white'}`}>
            {sector.name}
          </h3>
          {isCurrent && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[8px] font-orbitron text-green-400 animate-pulse">
              <CheckCircle2 size={10} />
              YOU ARE HERE
            </div>
          )}
          {!isCurrent && !isUnlocked && (
            <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">
              <Lock size={14} />
            </div>
          )}
        </div>
        <p className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${isCurrent ? 'text-green-500/60' : 'text-blue-400/60'}`}>
          {sector.subtitle}
        </p>
      </div>

      {/* Resource List */}
      <div className="relative z-10 mb-6">
        <div className="text-[9px] font-orbitron text-blue-400/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <Database size={10} />
          RESOURCES_DETECTED
        </div>
        <div className="flex flex-wrap gap-2">
          {sector.resources.map((resId: string) => (
            <div key={resId} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-md text-[10px] font-mono text-blue-200/80 group-hover:border-blue-500/20 transition-colors">
              {t.resources[resId]}
            </div>
          ))}
        </div>
      </div>

      {/* Gates / Requirements (Only if not current) */}
      {!isCurrent && (
        <div className="relative z-10 mb-8 p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
          <div className="text-[9px] font-orbitron text-blue-400/50 uppercase tracking-[0.2em] mb-1">
            GATE_REQUIREMENTS
          </div>
          
          <RequirementLine 
            icon={<Zap size={12} />}
            label="CREDITS" 
            current={currentCredits} 
            target={sector.unlockCost} 
            isMet={canAfford}
          />
          <RequirementLine 
            label="REFINERY" 
            current={currentUpgrades.refinery.level} 
            target={currentSectorConfig.maxUpgrades.refinery} 
            isMet={refineryOk}
          />
          <RequirementLine 
            label="CARGO" 
            current={currentUpgrades.cargo_bay.level} 
            target={currentSectorConfig.maxUpgrades.storage} 
            isMet={storageOk}
          />
          <RequirementLine 
            label="HANGAR" 
            current={currentUpgrades.hangar.level} 
            target={currentSectorConfig.maxUpgrades.hangar} 
            isMet={hangarOk}
          />
        </div>
      )}

      {/* Action Button */}
      <div className="relative z-10 mt-auto">
        {isCurrent ? (
          <div className="w-full py-3.5 text-center text-[10px] font-orbitron tracking-[0.3em] text-green-500/40 border border-green-500/10 rounded-xl bg-green-500/5 uppercase">
            STATIONARY_STABLE
          </div>
        ) : (
          <button
            onClick={() => isUnlocked && onWarp(sector.id)}
            disabled={!isUnlocked}
            className={`w-full py-4 rounded-xl font-orbitron text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 group/btn
              ${isUnlocked 
                ? 'bg-blue-600/10 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] cursor-pointer' 
                : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'}`}
          >
            {isUnlocked ? (
              <>
                <Navigation2 size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                INITIATE_WARP_JUMP
              </>
            ) : (
              <>
                <Lock size={14} />
                SYSTEM_LOCKED
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const RequirementLine: React.FC<{ icon?: React.ReactNode, label: string, current: number, target: number, isMet: boolean }> = ({ 
  icon, label, current, target, isMet 
}) => (
  <div className="flex items-center justify-between font-mono">
    <div className="flex items-center gap-2">
      <div className={`text-[10px] uppercase ${isMet ? 'text-blue-400/70' : 'text-red-400/70'}`}>
        {label}:
      </div>
    </div>
    <div className="flex items-center gap-2 text-[10px]">
      <span className={isMet ? 'text-green-400 font-bold' : 'text-red-500'}>{current >= 1000 ? (current/1000).toFixed(1) + 'k' : current}</span>
      <span className="text-white/20">/</span>
      <span className="text-white/80">{target >= 1000 ? (target/1000).toFixed(1) + 'k' : target}</span>
      <div className={`ml-1 ${isMet ? 'text-green-400' : 'text-red-500/50'}`}>
        {isMet ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      </div>
    </div>
  </div>
);

export default StarmapModal;
