import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Database, Zap, Navigation2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { SECTORS_CONFIG, SectorId } from '../config/sectors';
import { translations } from '../translations';
import { formatNumber } from '../utils/format';

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
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{ 
                backgroundImage: `
                  linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }} 
            />
            
            {/* Orbits Visualization (Blueprint Style) */}
            <div className="absolute top-0 right-0 w-full h-[150px] md:h-[300px] opacity-[0.15] pointer-events-none overflow-hidden mix-blend-screen">
              <svg className="w-full h-full" viewBox="0 0 1000 300">
                {/* Central Sun */}
                <circle cx="500" cy="450" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-blue-400" />
                {/* Orbits */}
                <circle cx="500" cy="450" r="200" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10,5" className="text-blue-500" />
                <circle cx="500" cy="450" r="300" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10,5" className="text-blue-500" />
                <circle cx="500" cy="450" r="400" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10,5" className="text-blue-500" />
                <circle cx="500" cy="450" r="500" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10,5" className="text-blue-500" />
                
                {/* Coordinate Lines */}
                <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-600" />
                <line x1="500" y1="0" x2="500" y2="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-600" />
                
                {/* Labels */}
                <text x="510" y="40" className="text-[10px] fill-blue-400 font-mono tracking-widest uppercase">SOLAR_SYSTEM_SCHEMATIC</text>
                <text x="510" y="280" className="text-[8px] fill-blue-500 font-mono opacity-50 tracking-widest uppercase">COORD_REF: ALPHA-01</text>
              </svg>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between px-4 md:px-10 py-4 md:py-8 border-b border-blue-500/20 bg-blue-950/20 backdrop-blur-md">
              <div className="flex flex-col gap-1 md:gap-2 min-w-0">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] shrink-0">
                    <Navigation2 className="text-neon-blue animate-pulse w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm md:text-3xl font-orbitron font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] truncate">
                      {language === 'ru' ? 'КАРТА СИСТЕМЫ' : 'SYSTEM MAP'}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[7px] md:text-[10px] text-blue-400 font-mono tracking-[0.2em] uppercase opacity-70">{t.warp_menu.system_status}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-8 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] md:text-[10px] text-blue-400 font-orbitron tracking-widest uppercase opacity-50 mb-0.5">{t.warp_menu.current_credits}</span>
                  <div className="flex items-center gap-1.5 md:gap-3 bg-blue-500/10 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-blue-500/20">
                    <Zap className="text-neon-gold w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-xs md:text-xl font-mono font-bold text-neon-gold tracking-tight">{formatNumber(credits)} <span className="text-[8px] md:text-xs">CR</span></span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="group relative p-2 md:p-3 text-blue-400 hover:text-white transition-all cursor-pointer rounded-xl border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 shrink-0"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                </button>
              </div>
            </div>

            {/* Sector Grid */}
            <div className="relative z-20 p-4 md:p-10 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-blue-950/10 to-transparent">
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
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> {t.warp_menu.footer.nav_link}</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> {t.warp_menu.footer.encryption}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="animate-pulse">{t.warp_menu.footer.local_time}: {new Date().toLocaleTimeString()}</span>
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
            {t.warp_menu.sector_names[sector.id]}
          </h3>
          {isCurrent && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[8px] font-orbitron text-green-400 animate-pulse">
              <CheckCircle2 size={10} />
              {t.warp_menu.you_are_here}
            </div>
          )}
          {!isCurrent && !isUnlocked && (
            <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">
              <Lock size={14} />
            </div>
          )}
        </div>
        <p className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${isCurrent ? 'text-green-500/60' : 'text-blue-400/60'}`}>
          {t.warp_menu.subtitles[sector.id]}
        </p>
      </div>

      {/* Resource List */}
      <div className="relative z-10 mb-6">
        <div className="text-[9px] font-orbitron text-blue-400/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <Database size={10} />
          {t.warp_menu.resources_detected}
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
            {t.warp_menu.gate_requirements}
          </div>
          
          <RequirementLine 
            icon={<Zap size={12} />}
            label={t.warp_menu.gates.credits} 
            current={currentCredits} 
            target={sector.unlockCost} 
            isMet={canAfford}
            isCredits
          />
          <RequirementLine 
            label={t.warp_menu.gates.refinery} 
            current={currentUpgrades.refinery.level} 
            target={currentSectorConfig.maxUpgrades.refinery} 
            isMet={refineryOk}
          />
          <RequirementLine 
            label={t.warp_menu.gates.cargo} 
            current={currentUpgrades.cargo_bay.level} 
            target={currentSectorConfig.maxUpgrades.storage} 
            isMet={storageOk}
          />
          <RequirementLine 
            label={t.warp_menu.gates.hangar} 
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
            {t.warp_menu.stationary_stable}
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
                {t.warp_menu.initiate_jump}
              </>
            ) : (
              <>
                <Lock size={14} />
                {t.warp_menu.system_locked}
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const RequirementLine: React.FC<{ icon?: React.ReactNode, label: string, current: number, target: number, isMet: boolean, isCredits?: boolean }> = ({ 
  icon, label, current, target, isMet, isCredits
}) => (
  <div className="flex items-center justify-between font-mono">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <div className={`text-[9px] md:text-[10px] uppercase truncate ${isMet ? 'text-blue-400/70' : 'text-red-400/70'}`}>
        {label}:
      </div>
    </div>
    <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] shrink-0 ml-2">
      <span className={isMet ? 'text-green-400 font-bold' : 'text-red-500'}>{isCredits ? formatNumber(current) : current}</span>
      <span className="text-white/20">/</span>
      <span className="text-white/80">{isCredits ? formatNumber(target) : target}</span>
      <div className={`ml-1 ${isMet ? 'text-green-400' : 'text-red-500/50'}`}>
        {isMet ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      </div>
    </div>
  </div>
);

export default StarmapModal;
