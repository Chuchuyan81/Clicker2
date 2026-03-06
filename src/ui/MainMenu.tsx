import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { translations } from '../translations';
import Starfield from './Starfield';
import { Rocket, Play, RotateCcw, Settings as SettingsIcon, Globe, ChevronLeft } from 'lucide-react';

const MainMenu: React.FC = () => {
  const { credits, drones, upgrades, language, setLanguage, startGame, resetGame } = useGameStore();
  const [view, setView] = useState<'main' | 'settings'>('main');

  const t = (translations as any)[language];

  const hasProgress = credits > 0 || drones.length > 1 || Object.values(upgrades).some(u => u.level > 0);

  const handleNewGame = () => {
    if (hasProgress) {
      if (window.confirm(t.menu.confirm_new_game)) {
        resetGame();
      }
    } else {
      resetGame();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-space-950 text-white overflow-hidden font-sans">
      <Starfield />
      
      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md px-6">
        {/* Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-neon-blue/10 border-2 border-neon-blue shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse">
            <Rocket size={64} className="text-neon-blue" />
          </div>
          <div>
            <h1 className="text-4xl font-orbitron neon-text-blue tracking-[0.2em] uppercase">Asteroid</h1>
            <h2 className="text-xl font-orbitron text-neon-gold tracking-[0.4em] uppercase mt-1">Logistics</h2>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-4">
          {view === 'main' ? (
            <>
              {hasProgress && (
                <button
                  onClick={startGame}
                  className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron uppercase tracking-widest hover:bg-neon-blue hover:text-black transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] cursor-pointer"
                >
                  <Play size={20} className="fill-current" />
                  {t.menu.continue}
                </button>
              )}
              
              <button
                onClick={handleNewGame}
                className={`group flex items-center justify-center gap-3 w-full py-4 rounded-xl border font-orbitron uppercase tracking-widest transition-all cursor-pointer
                  ${hasProgress 
                    ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10' 
                    : 'bg-neon-blue/20 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                  }`}
              >
                <RotateCcw size={20} />
                {t.menu.new_game}
              </button>

              <button
                onClick={() => setView('settings')}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-space-800 border border-space-700 text-gray-400 font-orbitron uppercase tracking-widest hover:border-gray-500 hover:text-white transition-all cursor-pointer"
              >
                <SettingsIcon size={20} />
                {t.menu.settings}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-orbitron text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-neon-blue" />
                  {t.ui.language}
                </label>
                <div className="flex gap-2">
                  {['ru', 'en'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang as any)}
                      className={`flex-1 py-3 px-4 rounded-xl border font-orbitron text-xs transition-all cursor-pointer
                        ${language === lang 
                          ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
                          : 'bg-space-800 border-space-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
                    >
                      {(translations as any)[lang].ui.language_name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setView('main')}
                className="flex items-center justify-center gap-2 mt-4 text-gray-500 hover:text-white transition-colors cursor-pointer group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-orbitron text-xs uppercase tracking-widest">{t.menu.back}</span>
              </button>
            </div>
          )}
        </div>

        {/* Version */}
        <div className="mt-8 text-[10px] text-gray-600 font-orbitron uppercase tracking-widest opacity-50">
          Asteroid Logistics v1.3
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
