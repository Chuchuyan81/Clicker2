import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { translations } from '../translations';
import { Terminal, AlertTriangle, ShieldAlert, Map, ArrowLeft, LogOut, Info } from 'lucide-react';

interface DispatcherScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStarmap: () => void;
}

const DispatcherScreen: React.FC<DispatcherScreenProps> = ({ isOpen, onClose, onOpenStarmap }) => {
  const { 
    credits, 
    gameLogs, 
    hasSeenIntro, 
    completeIntro, 
    language,
    exitToMenu,
    corporateDebt
  } = useGameStore();

  const [view, setView] = useState<'boot' | 'terminal'>(hasSeenIntro ? 'terminal' : 'boot');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isBootComplete, setIsBootComplete] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const t = (translations as any)[language];

  const introText = React.useMemo(() => {
    if (!t?.dispatcher) return [];
    return language === 'ru' ? [
      "СОЕДИНЕНИЕ С EXO-NET... [OK]",
      "АВТОРИЗАЦИЯ: Диспетчер #7491. Допуск: МИНИМАЛЬНЫЙ.",
      "ТЕКУЩИЙ ДОЛГ ПЕРЕД КОРПОРАЦИЕЙ: 999,999,999,999 CR.",
      "",
      "СООБЩЕНИЕ:",
      "\"Добро пожаловать в Exo-Mine. Твое корыто пришвартовано в Поясе Астероидов.\"",
      "\"План на сегодня: копай, продавай, не умирай. Нам нужны наши деньги.\"",
      "\"Удачи, винтик.\""
    ] : [
      "CONNECTING TO EXO-NET... [OK]",
      "AUTHORIZATION: Dispatcher #7491. Access: MINIMAL.",
      "CURRENT DEBT TO CORPORATION: 999,999,999,999 CR.",
      "",
      "MESSAGE:",
      "\"Welcome to Exo-Mine. Your bucket is docked in the Asteroid Belt.\"",
      "\"Plan for today: dig, sell, don't die. We need our money.\"",
      "\"Good luck, cog.\""
    ];
  }, [language, t]);

  // Boot sequence typewriter
  useEffect(() => {
    if (view !== 'boot') return;

    if (currentLineIndex < introText.length) {
      if (currentCharIndex < introText[currentLineIndex].length) {
        const timer = setTimeout(() => {
          setCurrentCharIndex(prev => prev + 1);
        }, 25);
        return () => clearTimeout(timer);
      } else {
        setBootLines(prev => [...prev, introText[currentLineIndex]]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }
    } else {
      setIsBootComplete(true);
    }
  }, [currentLineIndex, currentCharIndex, introText, view]);

  const handleAcceptTerms = () => {
    completeIntro();
    setView('terminal');
    onClose();
  };

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0; // Newest on top as per my store implementation (unshift)
    }
  }, [gameLogs]);

  const handleSkipBoot = () => {
    setIsBootComplete(true);
    setBootLines(introText);
    setCurrentLineIndex(introText.length);
  };

  const handleHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  if (!isOpen && hasSeenIntro) return null;
  if (!t?.dispatcher) return null;

  return (
    <AnimatePresence initial={false}>
      {(isOpen || !hasSeenIntro) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-black text-[#00FF41] font-mono overflow-hidden flex flex-col"
          onClick={view === 'boot' && !isBootComplete ? handleSkipBoot : undefined}
        >
          {/* CRT Overlay Effects */}
          <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
          <div className="absolute inset-0 pointer-events-none z-50 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_100%)] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
          
          {view === 'boot' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-sm md:text-base">
              <div className="w-full max-w-2xl flex flex-col gap-1 min-h-[300px]">
                {bootLines.map((line, i) => (
                  <div key={i} className={line.startsWith('"') ? "text-green-400/80 italic pl-4" : ""}>
                    {line}
                  </div>
                ))}
                {currentLineIndex < introText.length && (
                  <div className="flex items-center">
                    {introText[currentLineIndex].substring(0, currentCharIndex)}
                    <span className="w-2 h-4 bg-[#00FF41] animate-pulse ml-1" />
                  </div>
                )}
              </div>
              
              {isBootComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleAcceptTerms}
                  className="mt-12 px-8 py-4 border-2 border-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all active:scale-95 font-orbitron tracking-widest uppercase text-sm"
                >
                  {t.dispatcher.boot_accept}
                </motion.button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full max-h-screen pb-[env(safe-area-inset-bottom)]">
              
              {/* Top Bar: Debt Tracker */}
              <div className="p-4 border-b border-[#00FF41]/30 bg-[#00FF41]/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase tracking-tighter opacity-70">{t.dispatcher.debt_label}</span>
                  <ShieldAlert size={14} className="animate-pulse text-red-500" />
                </div>
                <div className="text-3xl md:text-5xl font-mono text-red-500 flex items-baseline gap-2 overflow-hidden">
                  <span className="shrink-0">CR</span>
                  <motion.span 
                    key={corporateDebt}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="tabular-nums font-bold"
                  >
                    {Math.floor(corporateDebt).toLocaleString()}
                  </motion.span>
                </div>
              </div>

              {/* Center: Event Log */}
              <div className="flex-1 overflow-hidden flex flex-col p-4">
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest opacity-70 border-b border-[#00FF41]/20 pb-1">
                  <Terminal size={12} /> {t.dispatcher.event_log}
                </div>
                <div 
                  ref={logContainerRef}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2"
                >
                  {gameLogs.length === 0 ? (
                    <div className="text-[#00FF41]/30 italic text-xs py-4 text-center">{t.dispatcher.waiting_data}</div>
                  ) : (
                    gameLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`text-xs md:text-sm border-l-2 pl-2 py-1 transition-all ${
                          log.type === 'WARNING' ? 'border-red-500 bg-red-500/5 text-red-400' :
                          log.type === 'CORP' ? 'border-blue-500 bg-blue-500/5 text-blue-400 italic' :
                          'border-[#00FF41]/40 bg-[#00FF41]/5'
                        }`}
                      >
                        <div className="flex justify-between items-start opacity-50 text-[8px] mb-0.5 uppercase">
                          <span>{log.type}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {log.text}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Bar: Nav Panel */}
              <div className="p-4 grid grid-cols-2 gap-3 border-t border-[#00FF41]/30 bg-black">
                <button 
                  onClick={() => { handleHaptic(); onOpenStarmap(); }}
                  className="flex flex-col items-center justify-center p-4 border border-[#00FF41] hover:bg-[#00FF41]/10 active:bg-[#00FF41]/20 rounded-lg transition-colors min-h-[72px]"
                >
                  <Map size={24} className="mb-1" />
                  <span className="text-[10px] uppercase font-orbitron tracking-tighter">{t.dispatcher.nav_starmap}</span>
                </button>
                <button 
                  onClick={() => { handleHaptic(); onClose(); }}
                  className="flex flex-col items-center justify-center p-4 border border-[#00FF41] hover:bg-[#00FF41]/10 active:bg-[#00FF41]/20 rounded-lg transition-colors min-h-[72px]"
                >
                  <ArrowLeft size={24} className="mb-1" />
                  <span className="text-[10px] uppercase font-orbitron tracking-tighter">{t.dispatcher.nav_base}</span>
                </button>
                <button 
                  onClick={() => { handleHaptic(); exitToMenu(); }}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 text-red-500/70 hover:text-red-500 transition-colors text-xs uppercase font-orbitron mt-2"
                >
                  <LogOut size={14} /> {t.dispatcher.logout}
                </button>
              </div>

              {/* Corner Info */}
              <div className="absolute top-2 right-2 flex flex-col items-end opacity-30 text-[8px] pointer-events-none">
                <span>TERMINAL ID: 7491-X</span>
                <span>SECURE CONNECTION: YES</span>
                <span>OS: EXO-MINE RTOS v7.2</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DispatcherScreen;
