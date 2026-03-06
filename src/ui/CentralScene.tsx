import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Rocket, Zap } from 'lucide-react';
import { ResourceType } from '../types';
import { translations } from '../translations';
import Starfield from './Starfield';

const BASE_SIZES = { 1: { w: 'w-24', h: 'h-24', inner: 'w-16 h-16' }, 2: { w: 'w-28', h: 'h-28', inner: 'w-20 h-20' }, 3: { w: 'w-32', h: 'h-32', inner: 'w-24 h-24' } } as const;

const BaseHQ: React.FC<{ level: number, boostActive: boolean }> = ({ level, boostActive }) => {
  const language = useGameStore(state => state.language);
  const t = (translations as any)[language];
  const lvl = Math.max(1, Math.min(level, 3)) as 1 | 2 | 3;
  const sz = BASE_SIZES[lvl];
  const isHex = lvl >= 2;
  const isTier3 = lvl >= 3;

  return (
    <div className={`relative z-10 ${sz.w} ${sz.h} bg-space-800 flex items-center justify-center neon-border
      ${isHex ? 'clip-hex' : 'rounded-full'} ${isTier3 ? 'ring-2 ring-neon-gold/50' : ''}`}
      style={isHex ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } : undefined}
    >
      <div className={`${sz.inner} bg-space-700 flex items-center justify-center ${isHex ? 'rounded-md' : 'rounded-lg'} animate-pulse`}
        style={isHex ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } : undefined}
      >
        <Zap className={`transition-all duration-300 ${isTier3 ? 'w-10 h-10' : 'w-8 h-8'} text-neon-blue drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]
          ${boostActive ? 'fill-current' : ''}`} />
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

const RESOURCE_COLORS: Record<ResourceType, { base: string, border: string, glow: string }> = {
  metal: { base: 'bg-slate-900', border: 'border-slate-800', glow: 'bg-neon-blue/5' },
  ice: { base: 'bg-blue-950', border: 'border-blue-800', glow: 'bg-white/10' },
  crystal: { base: 'bg-purple-950', border: 'border-purple-800', glow: 'bg-fuchsia-500/10' },
  iridium: { base: 'bg-amber-950', border: 'border-amber-800', glow: 'bg-yellow-500/10' },
};

const CentralScene: React.FC = () => {
  const { drones, transport, notifications, baseLevel, manualMine, asteroids, boostEndTime } = useGameStore();
  const boostActive = boostEndTime > Date.now();

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Zoom logic (Mouse wheel) ---
  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY;
    const newZoom = Math.max(1, Math.min(zoom + delta * 0.001, 3));
    setZoom(newZoom);
    if (newZoom === 1) setOffset({ x: 0, y: 0 });
  };

  // --- Panning logic (Mouse) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  }, [isDragging, zoom]);

  const handleMouseUp = () => setIsDragging(false);

  // --- Touch logic (Pinch zoom & Panning) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastTouchDistance.current;
      const newZoom = Math.max(1, Math.min(zoom + delta * 0.01, 3));
      setZoom(newZoom);
      if (newZoom === 1) setOffset({ x: 0, y: 0 });
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      setOffset({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 w-full bg-space-950 overflow-hidden flex items-center justify-center border-y border-space-700 touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="relative w-full h-full flex items-center justify-center transition-transform duration-75 will-change-transform"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        <Starfield />
        
        {/* Clickable Asteroids */}
        {asteroids.map(asteroid => {
          const colors = RESOURCE_COLORS[asteroid.resourceType] || RESOURCE_COLORS.metal;
          return (
            <button
              key={asteroid.id}
              onClick={(e) => {
                e.stopPropagation();
                manualMine(asteroid.id, asteroid.x, asteroid.y);
              }}
              className="absolute z-10 transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
              style={{
                left: `${asteroid.x}%`,
                top: `${asteroid.y}%`,
                width: `${asteroid.size}px`,
                height: `${asteroid.size}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Asteroid Visual */}
              <div 
                className={`w-full h-full border rounded-lg rotate-45 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all relative overflow-hidden
                  ${asteroid.hits > 0 ? 'brightness-125' : 'brightness-100'} 
                  ${colors.base} ${colors.border}
                  group-hover:border-white/20`}
              >
                 {/* Cracks/Texture */}
                 <div className="absolute top-1 left-1 w-1/2 h-1/2 bg-black/40 rounded-full opacity-50" />
                 <div className="absolute bottom-2 right-2 w-1/3 h-1/3 bg-black/60 rounded-full opacity-30" />
                 {/* Damage overlay */}
                 {asteroid.hits > 0 && (
                   <div className={`absolute inset-0 ${colors.glow} animate-pulse`} />
                 )}
                 {/* Hit dots for variety */}
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="flex gap-0.5 -rotate-45">
                     {Array.from({ length: asteroid.maxHits }).map((_, i) => (
                       <div key={i} className={`w-1 h-1 rounded-full ${i < asteroid.hits ? 'bg-white' : 'bg-white/10'}`} />
                     ))}
                   </div>
                 </div>
              </div>
              {/* Pulsing selection ring on hover */}
              <div className="absolute inset-[-4px] border border-white/0 group-hover:border-white/10 rounded-full animate-pulse transition-colors" />
            </button>
          );
        })}

        
        {/* Central Base — 3 визуальных уровня */}
        <BaseHQ level={baseLevel} boostActive={boostActive} />

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
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${drone.angle * (180/Math.PI) + (isLoaded ? 180 : 0) + 90}deg)`,
              }}
            >
              {/* Реактивный след дрона */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-6 translate-y-full blur-[1px] opacity-60">
                 <div className="w-full h-full bg-gradient-to-b from-neon-blue to-transparent animate-engine rounded-full" />
              </div>

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
              {/* Реактивный след транспорта (двигатели) */}
              <div className="absolute bottom-0 flex gap-2 translate-y-full blur-[2px] opacity-80">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-12">
                    <div className="w-full h-full bg-gradient-to-b from-neon-gold via-orange-500 to-transparent animate-engine rounded-full" 
                         style={{ animationDelay: `${i * 0.05}s` }} />
                  </div>
                ))}
              </div>

              {/* Корпус транспорта (своя форма) */}
              <div className="relative z-10 flex flex-col items-center rotate-180">
                {/* Кабина */}
                <div className="w-4 h-3 bg-neon-blue/30 border border-neon-blue rounded-t-full mb-[-1px]" />
                {/* Основной корпус */}
                <div className="w-10 h-16 bg-space-800 border-2 border-neon-gold rounded-b-lg flex flex-col items-center justify-between p-1 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  <div className="w-full h-1 bg-neon-gold/20 rounded-full" />
                  <div className="flex flex-col gap-1 w-full px-1">
                    <div className="w-full h-2 bg-space-700 border border-space-600 rounded-sm" />
                    <div className="w-full h-2 bg-space-700 border border-space-600 rounded-sm" />
                    <div className="w-full h-2 bg-space-700 border border-space-600 rounded-sm" />
                  </div>
                  <div className="w-full h-1 bg-neon-gold/20 rounded-full" />
                </div>
                {/* Боковые закрылки */}
                <div className="absolute -left-3 top-6 w-3 h-8 bg-space-800 border-l-2 border-y-2 border-neon-gold rounded-l-md" />
                <div className="absolute -right-3 top-6 w-3 h-8 bg-space-800 border-r-2 border-y-2 border-neon-gold rounded-r-md" />
              </div>

              <div className="mt-2 bg-space-900/80 px-2 py-0.5 rounded text-[10px] font-mono border border-neon-gold/50 backdrop-blur-sm">
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
    </div>
  );
};

export default CentralScene;
