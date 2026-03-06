import React, { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  blinkDelay: string;
}

const Starfield: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Нормализуем координаты от -0.5 до 0.5
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Генерируем звезды один раз
  const layers = useMemo(() => {
    const generateStars = (count: number, sizeRange: [number, number]) => {
      return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
        opacity: Math.random() * 0.7 + 0.3,
        blinkDelay: `${Math.random() * 5}s`,
      }));
    };

    return [
      { stars: generateStars(150, [0.5, 1.2]), factor: 10 },  // Дальний слой (медленный)
      { stars: generateStars(80, [1.5, 2.5]), factor: 25 },   // Средний слой
      { stars: generateStars(30, [2.5, 4.0]), factor: 45 },   // Ближний слой (быстрый)
    ];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-space-950">
      {/* Туманность (градиентное свечение) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05)_0%,transparent_70%)]" />
      
      {layers.map((layer, layerIdx) => (
        <div
          key={layerIdx}
          className="absolute inset-[-10%] transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${mousePos.x * layer.factor}px, ${mousePos.y * layer.factor}px)`,
          }}
        >
          {layer.stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: star.blinkDelay,
                boxShadow: star.size > 2 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.4)` : 'none',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Starfield;
