import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Map as MapIcon, Database, Zap, Navigation2 } from 'lucide-react';
import { SECTORS_CONFIG, RESOURCE_CONFIG } from '../config/sectors';
import { translations } from '../translations';

interface StarmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StarmapModal: React.FC<StarmapModalProps> = ({ isOpen, onClose }) => {
  const { currentSectorId, credits, warpToSector, language } = useGameStore();
  const t = (translations as any)[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-space-800 border-2 border-neon-blue rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_40px_rgba(0,242,255,0.2)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-700 bg-space-900/50">
          <div className="flex items-center gap-3">
            <MapIcon className="text-neon-blue" size={24} />
            <h2 className="text-xl font-orbitron neon-text-blue uppercase tracking-wider">
              {t.ui.navigation} / {t.ui.starmap}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-space-700 rounded-md">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid md:grid-cols-2 gap-6 bg-space-900/20">
          {Object.values(SECTORS_CONFIG).map((sector) => {
            const isCurrent = sector.id === currentSectorId;
            const canAfford = credits >= sector.unlockCost;
            
            return (
              <div 
                key={sector.id} 
                className={`relative p-5 rounded-xl border-2 transition-all flex flex-col gap-4
                  ${isCurrent ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
                    'border-space-700 bg-space-800/50 hover:border-neon-blue/30'}`}
              >
                {/* Sector Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-lg font-orbitron uppercase tracking-wide ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                      {sector.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase mt-1">
                      <Navigation2 size={10} className={isCurrent ? 'text-green-500' : 'text-neon-blue'} />
                      {isCurrent ? t.ui.current_location : `Sector ID: ${sector.id}`}
                    </div>
                  </div>
                </div>

                {/* Available Resources */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-orbitron tracking-widest">{t.ui.available_resources}</span>
                  <div className="flex flex-wrap gap-2">
                    {sector.resources.map(resId => (
                      <div key={resId} className="flex items-center gap-1.5 px-2 py-1 bg-space-900 rounded border border-white/5">
                        <Database size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-300">{(t.resources as any)[resId] || resId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  {isCurrent ? (
                    <div className="w-full text-center py-2 text-green-400 font-orbitron text-xs animate-pulse">
                      {t.ui.current_location}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase">{t.ui.cost}</span>
                        <div className="flex items-center gap-1">
                          <Zap size={12} className="text-neon-gold" />
                          <span className={`font-mono text-sm ${canAfford ? 'text-neon-gold' : 'text-red-500'}`}>
                            {sector.unlockCost.toLocaleString()} CR
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          warpToSector(sector.id);
                          onClose();
                        }}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-lg font-orbitron text-[10px] uppercase transition-all cursor-pointer
                          ${canAfford 
                            ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
                            : 'bg-space-700 border border-space-600 text-gray-500 cursor-not-allowed opacity-50'}`}
                      >
                        {t.ui.initiate_warp}
                      </button>
                    </>
                  )}
                </div>

                {/* Visual Glitch Decor */}
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <MapIcon size={40} className={isCurrent ? 'text-green-500' : 'text-neon-blue'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-space-700 bg-space-900/50 flex justify-between items-center">
          <div className="text-[10px] text-gray-500 font-orbitron uppercase tracking-[0.2em]">
            Galaxy Navigator v2.4 // {currentSectorId.toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase">{t.ui.credits || 'Credits'}:</span>
            <span className="text-neon-gold font-mono text-sm">{credits.toLocaleString()} CR</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StarmapModal;
