import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const IntroTerminal: React.FC = () => {
  const { completeIntro, language } = useGameStore();
  const [lines, setLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const introText = language === 'ru' ? [
    "СОЕДИНЕНИЕ С СЕРВЕРОМ EXO-MINE CORP... [ОК]",
    "АВТОРИЗАЦИЯ: Диспетчер #7491.",
    "СТАТУС: Ваш корпоративный долг составляет 999,999,999,999 CR.",
    "",
    "СООБЩЕНИЕ ОТ РУКОВОДСТВА:",
    "\"Добро пожаловать в семью Exo-Mine! Мы ценим вашу готовность отработать долг. Ваша мобильная станция развернута в стартовой зоне: [Пояс Астероидов]. Это мусорный сектор, но для новичка сойдет.\"",
    "\"Хотите добывать дорогой газ на Юпитере или платину на кольцах Сатурна? Купите лицензию на сектор. А пока... берите ручной бур и за работу. План сам себя не выполнит.\"",
    "",
    "[ НАЖМИТЕ ENTER ДЛЯ СТАРТА ]"
  ] : [
    "CONNECTING TO EXO-MINE CORP SERVER... [OK]",
    "AUTHORIZATION: Dispatcher #7491.",
    "STATUS: Your corporate debt is 999,999,999,999 CR.",
    "",
    "MESSAGE FROM MANAGEMENT:",
    "\"Welcome to the Exo-Mine family! We appreciate your willingness to work off your debt. Your mobile station has been deployed in the starting zone: [Asteroid Belt]. It's a junk sector, but it'll do for a beginner.\"",
    "\"Want to mine expensive gas on Jupiter or platinum in Saturn's rings? Buy a sector license. For now... take your manual drill and get to work. The quota won't meet itself.\"",
    "",
    "[ PRESS ENTER TO START ]"
  ];

  const skip = useCallback(() => {
    setLines(introText);
    setIsComplete(true);
  }, [introText]);

  useEffect(() => {
    if (currentLineIndex < introText.length) {
      if (currentCharIndex < introText[currentLineIndex].length) {
        const timer = setTimeout(() => {
          setCurrentCharIndex(prev => prev + 1);
          // Play click sound here if available
        }, 30);
        return () => clearTimeout(timer);
      } else {
        setLines(prev => [...prev, introText[currentLineIndex]]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }
    } else {
      setIsComplete(true);
    }
  }, [currentLineIndex, currentCharIndex, introText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isComplete) {
          completeIntro();
        } else {
          skip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComplete, completeIntro, skip]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 font-mono overflow-hidden">
      <div className="w-full max-w-3xl flex flex-col gap-2">
        <div className="text-neon-blue/80 opacity-50 mb-4 flex justify-between items-center border-b border-neon-blue/20 pb-2">
          <span>EXO-MINE TERMINAL v4.0.12</span>
          <span>STATION_ID: ALPHA-01</span>
        </div>
        
        <div className="flex flex-col gap-1 min-h-[400px]">
          {lines.map((line, i) => (
            <div key={i} className={`text-neon-blue leading-relaxed ${line.startsWith('"') ? 'text-blue-300 italic pl-4' : ''}`}>
              {line}
            </div>
          ))}
          {currentLineIndex < introText.length && (
            <div className="text-neon-blue leading-relaxed">
              {introText[currentLineIndex].substring(0, currentCharIndex)}
              <span className="w-2 h-5 bg-neon-blue inline-block animate-pulse ml-1 align-middle" />
            </div>
          )}
        </div>

        {isComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-12 text-center text-neon-blue font-orbitron tracking-widest text-sm"
          >
            {language === 'ru' ? 'НАЖМИТЕ ENTER ДЛЯ ПОДТВЕРЖДЕНИЯ' : 'PRESS ENTER TO CONFIRM'}
          </motion.div>
        )}
      </div>

      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_100%)]" />
    </div>
  );
};

export default IntroTerminal;
