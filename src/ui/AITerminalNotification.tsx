import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Terminal, AlertTriangle, ShieldAlert } from 'lucide-react';

const AITerminalNotification: React.FC = () => {
  const gameLogs = useGameStore(state => state.gameLogs || []);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [currentLog, setCurrentLog] = useState<typeof gameLogs[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // Find the latest message from AI/Company or Warnings
    const latestFlavorLog = gameLogs.find(log => log.type === 'CORP' || log.type === 'WARNING');
    
    if (latestFlavorLog && latestFlavorLog.id !== lastSeenId) {
      setCurrentLog(latestFlavorLog);
      setLastSeenId(latestFlavorLog.id);
      setIsVisible(true);
      setDisplayedText(""); // Reset text for typewriter effect
      
      // Auto-hide after 10 seconds for non-warning messages
      if (latestFlavorLog.type === 'CORP') {
        const timer = setTimeout(() => setIsVisible(false), 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameLogs, lastSeenId]);

  // Typewriter effect
  useEffect(() => {
    if (isVisible && currentLog && displayedText.length < currentLog.text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentLog.text.substring(0, displayedText.length + 1));
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isVisible, currentLog, displayedText]);

  if (!currentLog) return null;

  const isWarning = currentLog.type === 'WARNING';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 md:bottom-28 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[60] pointer-events-auto"
        >
          <div className={`relative bg-black border-2 ${isWarning ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.2)]'} rounded-lg overflow-hidden font-mono`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-2 py-1 ${isWarning ? 'bg-red-500/20 text-red-500' : 'bg-[#00FF41]/20 text-[#00FF41]'} border-b ${isWarning ? 'border-red-500/30' : 'border-[#00FF41]/30'}`}>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter">
                {isWarning ? <ShieldAlert size={12} className="animate-pulse" /> : <Terminal size={12} />}
                <span>{currentLog.type === 'CORP' ? 'Incoming: EXO-MINE CORP' : 'System Alert'}</span>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="hover:bg-white/10 rounded transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 text-xs md:text-sm leading-relaxed min-h-[60px] flex items-start">
              <span className={isWarning ? 'text-red-400' : 'text-[#00FF41]'}>
                {displayedText}
                {displayedText.length < currentLog.text.length && <span className="w-1.5 h-3 bg-current inline-block ml-1 animate-pulse align-middle" />}
              </span>
            </div>

            {/* CRT Scanline Effect (mini) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_4px,3px_100%] opacity-50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AITerminalNotification;
