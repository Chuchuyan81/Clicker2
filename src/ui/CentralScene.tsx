import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Rocket, Zap } from 'lucide-react';
import { translations } from '../translations';

const BASE_SIZES = { 1: { w: 'w-24', h: 'h-24', inner: 'w-16 h-16' }, 2: { w: 'w-28', h: 'h-28', inner: 'w-20 h-20' }, 3: { w: 'w-32', h: 'h-32', inner: 'w-24 h-24' } } as const;

const BaseHQ: React.FC<{ level: number }> = ({ level }) => {
  const language = useGameStore(state => state.language);
  const t = translations[language];
  const lvl = Math.max(1, Math.min(level, 3)) as 1 | 2 | 3;
  const sz = BASE_SIZES[lvl];
  const isHex = lvl >= 2;
  const isTier3 = lvl >= 3;

  return (
    <div className={`relative z-10 ${sz.w} ${sz.h} bg-space-800 flex items-center justify-center neon-border
      ${isHex ? 'clip-hex' : 'rounded-full'} ${isTier3 ? 'ring-2 ring-neon-gold/50' : ''}`}
      style={isHex ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } : undefined}
    >
      <div className={`${sz.inner} bg-space-700 flex items-center justify-center animate-pulse ${isHex ? 'rounded-md' : 'rounded-lg'}`}
        style={isTier3 ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } : undefined}
      >
        <Zap className={`text-neon-blue ${isTier3 ? 'w-10 h-10' : 'w-8 h-8'}`} />
      </div>
      {isTier3 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-neon-blue rounded-b" />}
      <div className="absolute -bottom-6 text-xs font-orbitron neon-text-blue">{t.ui.hq_lvl}{lvl}</div>
    </div>
  );
};

const getBezierPoint = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }) => {
  const cx = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const cy = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  return { x: cx, y: cy };
};

const CentralScene: React.FC = () => {
  const { drones, transport, notifications, baseLevel } = useGameStore();

  return (
    <div className="relative flex-1 w-full bg-space-900 overflow-hidden flex items-center justify-center border-y border-space-700">
      {/* Background layers — глубина */}
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:40px_40px] animate-drift" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      {/* Central Base — 3 визуальных уровня */}
      <BaseHQ level={baseLevel} />

      {/* Drones — trajectory, rotation, color by state */}
      {drones.map((drone) => {
        if (drone.state === 'offscreen_wait' || drone.state === 'unloading_wait') return null;

        const start = { x: 0, y: 0 };
        const end = { 
          x: Math.cos(drone.angle) * drone.distance, 
          y: Math.sin(drone.angle) * drone.distance 
        };
        
        // Вектор перпендикуляра для кривизны
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const cp = { 
          x: mid.x + nx * drone.curveOffset, 
          y: mid.y + ny * drone.curveOffset 
        };

        const t = drone.state === 'flying_out' ? drone.progress : 1 - drone.progress;
        const pos = getBezierPoint(t, start, cp, end);
        
        const isLoaded = drone.state === 'returning';
        const borderCls = isLoaded 
          ? 'border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
          : 'border-neon-blue shadow-[0_0_8px_rgba(0,242,255,0.5)]';

        const sizeCls = drone.type === 'scout' ? 'scale-75' : drone.type === 'heavy' ? 'scale-125' : '';

        return (
          <div 
            key={drone.id}
            className={`absolute transition-all duration-75 z-20 ${sizeCls}`}
            style={{ 
              transform: `translate(${pos.x}px, ${pos.y}px) rotate(${drone.angle * (180/Math.PI) + (isLoaded ? 180 : 0)}deg)`,
            }}
          >
            <div className={`relative p-1 rounded bg-space-800 border ${borderCls}`}>
              <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-yellow-400' : 'bg-neon-blue'} animate-pulse`} />
            </div>
          </div>
        );
      })}

      {/* Transport Ship — Bezier trajectory, scale, tilt */}
      {transport.isActive && transport.state !== 'offscreen_wait' && (() => {
        const start = { x: 0, y: 0 };
        const end = { 
          x: Math.cos(transport.angle) * transport.distance, 
          y: Math.sin(transport.angle) * transport.distance 
        };
        
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const cp = { 
          x: mid.x + nx * transport.curveOffset, 
          y: mid.y + ny * transport.curveOffset 
        };

        const t = transport.state === 'flying_out' ? transport.progress : 1 - transport.progress;
        const pos = getBezierPoint(t, start, cp, end);
        const isReturning = transport.state === 'returning';

        return (
          <div 
            className="absolute z-30 flex flex-col items-center transition-all duration-100"
            style={{ 
              transform: `translate(${pos.x}px, ${pos.y}px) rotate(${transport.angle * (180/Math.PI) + (isReturning ? -90 : 90)}deg) scale(${
                transport.state === 'flying_out' 
                  ? (transport.progress > 0.8 ? 0.8 : 1)
                  : (transport.progress < 0.2 ? 0.8 : 1)
              })`,
              opacity: 1 - (transport.state === 'flying_out' ? transport.progress : 1 - transport.progress) * 0.4,
            }}
          >
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 rounded-full opacity-50"
              style={{
                background: 'linear-gradient(to top, rgba(255,215,0,0.5), transparent)',
                height: `40px`,
                transformOrigin: 'bottom center',
              }}
            />
            <div className="text-neon-gold mb-1 relative z-10">
              <Rocket size={40} />
            </div>
            <div className="bg-space-800 px-2 py-0.5 rounded text-[10px] font-mono border border-neon-gold">
              {Math.floor(transport.progress * 100)}%
            </div>
          </div>
        );
      })()}

      {/* Floating Notifications */}
      {notifications.map(n => (
        <div 
          key={n.id}
          className={`absolute z-50 pointer-events-none font-orbitron font-bold text-lg whitespace-nowrap
            ${n.type === 'sale' ? 'neon-text-gold' : 'neon-text-blue'}`}
          style={{ 
            left: `${n.x}%`, 
            top: `${n.y}%`, 
            opacity: n.opacity,
            transform: 'translate(-50%, -50%)' 
          }}
        >
          {n.value}
        </div>
      ))}
    </div>
  );
};

export default CentralScene;
