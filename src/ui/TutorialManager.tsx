import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AlertCircle, MousePointer2, Package, Rocket, Database, Map } from 'lucide-react';

const TutorialManager: React.FC = () => {
  const { tutorialStep, language } = useGameStore();

  const getHint = () => {
    if (language === 'ru') {
      switch (tutorialStep) {
        case 1: return {
          icon: <MousePointer2 className="text-neon-blue" />,
          text: "Нажмите на пролетающий камень. Желательно до того, как мы обанкротимся."
        };
        case 2: return {
          icon: <Package className="text-orange-400" />,
          text: "Склад наполняется. Когда наберется 20%, автоматика разрешит вызвать баржу для продажи."
        };
        case 3: return {
          icon: <Rocket className="text-neon-gold" />,
          text: "Отлично. На эти гроши вы можете купить сломанного дрона в Улучшениях. Сделайте это."
        };
        case 4: return {
          icon: <Database className="text-neon-blue" />,
          text: "Дроны тупые. Они не видят ценные породы без разведки. Откройте Радар и найдите Космический Лед."
        };
        case 5: return {
          icon: <AlertCircle className="text-neon-gold" />,
          text: "Нам нужно больше прибыли. Копите на лицензию следующего сектора."
        };
        case 6: return {
          icon: <Map className="text-neon-blue" />,
          text: "У вас появились деньги. Не привыкайте. Откройте Карту Системы — нам нужно купить лицензию на Орбиту Марса."
        };
        default: return null;
      }
    } else {
      switch (tutorialStep) {
        case 1: return {
          icon: <MousePointer2 className="text-neon-blue" />,
          text: "Click on a flying rock. Preferably before we go bankrupt."
        };
        case 2: return {
          icon: <Package className="text-orange-400" />,
          text: "Storage is filling up. Once it reaches 20%, the system will allow you to call a barge to sell."
        };
        case 3: return {
          icon: <Rocket className="text-neon-gold" />,
          text: "Excellent. With these pennies, you can buy a broken drone in Upgrades. Do it."
        };
        case 4: return {
          icon: <Database className="text-neon-blue" />,
          text: "Drones are dumb. They don't see valuable ores without scouting. Open the Radar and find some Space Ice."
        };
        case 5: return {
          icon: <AlertCircle className="text-neon-gold" />,
          text: "We need more profit. Save up for the next sector license."
        };
        case 6: return {
          icon: <Map className="text-neon-blue" />,
          text: "You've got some money. Don't get used to it. Open the Starmap — we need to buy a license for Mars Orbit."
        };
        default: return null;
      }
    }
  };

  const hint = getHint();

  if (!hint) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={tutorialStep}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-space-900/90 border border-neon-blue/30 backdrop-blur-md p-4 rounded-2xl shadow-[0_0_30px_rgba(0,242,255,0.15)] flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent pointer-events-none" />
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
            {hint.icon}
          </div>
          <p className="text-sm font-orbitron text-blue-100 leading-relaxed">
            {hint.text}
          </p>
          
          {/* Animated corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-blue/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-blue/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-blue/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-blue/50" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TutorialManager;
