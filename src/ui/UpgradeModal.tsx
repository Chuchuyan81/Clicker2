import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Cpu, ShoppingCart, Zap, Timer, Package, Warehouse, Database, Lock, MousePointer2, Battery, Search, Maximize } from 'lucide-react';
import { DroneType, ResourceType } from '../types';
import { translations } from '../translations';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'upgrades' | 'drones' | 'archive' | 'radar';
}

const RESOURCE_COLORS: Record<ResourceType, string> = {
  metal: 'bg-slate-500',
  ice: 'bg-blue-400',
  crystal: 'bg-purple-500',
  iridium: 'bg-amber-500'
};

const DRONE_SHOP_ITEMS: { type: DroneType, cost: number }[] = [
  { type: 'basic', cost: 50 },
  { type: 'scout', cost: 150 },
  { type: 'heavy', cost: 300 },
];

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, initialTab = 'upgrades' }) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'drones' | 'archive' | 'radar'>(initialTab);
  const { credits, upgrades, purchaseUpgrade, buyDrone, drones, language, resources, discoveredResources, radar, upgradeRadar } = useGameStore();

  if (!isOpen) return null;

  const t = (translations as any)[language];
  const hangarLevel = upgrades.hangar?.level || 0;
  const maxDrones = 1 + hangarLevel;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-space-800 border-2 border-neon-blue rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_30px_rgba(0,242,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-700 bg-space-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-orbitron neon-text-blue uppercase tracking-wider">{t.ui.control_center}</h2>
            <div className="px-3 py-1 bg-space-800 rounded-lg border border-space-600">
              <span className="text-neon-gold font-mono">{credits.toLocaleString()} CR</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-space-700 rounded-md">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-space-700">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'upgrades' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {t.ui.base_upgrades}
          </button>
          <button
            onClick={() => setActiveTab('drones')}
            className={`flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'drones' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {t.ui.drone_fleet} ({drones.length}/{maxDrones})
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'archive' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {t.ui.archive}
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'radar' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {t.ui.radar || 'Radar'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-[400px] overflow-y-auto bg-space-900/20">
          {activeTab === 'upgrades' ? (
            <div className="grid gap-4">
              {Object.values(upgrades).map((upgrade) => (
                <div key={upgrade.id} className="bg-space-800 border border-space-700 rounded-xl p-4 flex items-center justify-between group hover:border-neon-blue/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-space-700 rounded-lg text-neon-blue group-hover:scale-110 transition-transform">
                      {upgrade.id === 'refinery' && <Cpu size={24} />}
                      {upgrade.id === 'cargo_bay' && <Package size={24} />}
                      {upgrade.id === 'hangar' && <Warehouse size={24} />}
                      {upgrade.id === 'automation' && <Zap size={24} />}
                    </div>
                    <div>
                      <h3 className="font-orbitron text-sm text-white mb-0.5">
                        {t.upgrades[upgrade.id as keyof typeof t.upgrades].name} 
                        <span className="text-neon-blue text-[10px] ml-2">Lv.{upgrade.level}</span>
                      </h3>
                      <p className="text-[11px] text-gray-400 max-w-[280px]">
                        {t.upgrades[upgrade.id as keyof typeof t.upgrades].description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => purchaseUpgrade(upgrade.id)}
                    disabled={credits < upgrade.cost || upgrade.level >= upgrade.maxLevel}
                    className={`px-4 py-2 rounded-lg font-orbitron text-[10px] uppercase transition-all flex flex-col items-center gap-1 min-w-[100px] cursor-pointer
                      ${upgrade.level >= upgrade.maxLevel ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' :
                        credits >= upgrade.cost ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,242,255,0.2)]' :
                        'bg-space-700 border border-space-600 text-gray-500 cursor-not-allowed opacity-50'}`}
                  >
                    {upgrade.level >= upgrade.maxLevel ? t.ui.max_level : (
                      <>
                        <span>{t.ui.upgrade}</span>
                        <span className="text-neon-gold">{upgrade.cost.toLocaleString()} CR</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : activeTab === 'drones' ? (
            <div className="grid gap-4">
              <div className="px-2 py-1 bg-space-800/50 rounded border border-space-700 mb-2 text-center">
                <span className="text-[10px] text-gray-400 font-orbitron uppercase tracking-widest">
                  {t.ui.hangar_status.replace('{current}', drones.length.toString()).replace('{max}', maxDrones.toString())}
                </span>
              </div>
              {DRONE_SHOP_ITEMS.map((item) => {
                const droneInfo = t.drones[item.type];
                const config = {
                  basic: { speed: 5, miningRate: 5 },
                  scout: { speed: 2.5, miningRate: 3 },
                  heavy: { speed: 8, miningRate: 25 },
                }[item.type];

                return (
                  <div key={item.type} className="bg-space-800 border border-space-700 rounded-xl p-4 flex items-center justify-between group hover:border-neon-blue/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-space-700 rounded-lg text-neon-blue group-hover:scale-110 transition-transform">
                        <ShoppingCart size={24} />
                      </div>
                      <div>
                        <h3 className="font-orbitron text-sm text-white mb-0.5">{droneInfo.name}</h3>
                        <div className="flex gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono"><Timer size={10} /> {config.speed}s</div>
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono"><Zap size={10} /> {config.miningRate} r/s</div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{droneInfo.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => buyDrone(item.type)}
                      disabled={credits < item.cost || drones.length >= maxDrones}
                      className={`px-4 py-2 rounded-lg font-orbitron text-[10px] uppercase transition-all flex flex-col items-center gap-1 min-w-[100px] cursor-pointer
                        ${drones.length >= maxDrones ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' :
                          credits >= item.cost ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,242,255,0.2)]' :
                          'bg-space-700 border border-space-600 text-gray-500 cursor-not-allowed opacity-50'}`}
                    >
                      <span>{t.ui.purchase}</span>
                      <span className="text-neon-gold">{item.cost.toLocaleString()} CR</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'archive' ? (
            <div className="grid gap-4">
              {Object.values(resources).map((res) => {
                const isDiscovered = discoveredResources.includes(res.id);
                const hits = res.id === 'metal' ? 1 : res.id === 'ice' ? 2 : 3;
                const rarityKey = res.id === 'metal' ? 'common' : res.id === 'ice' ? 'uncommon' : res.id === 'crystal' ? 'rare' : 'legendary';

                return (
                  <div key={res.id} className={`bg-space-800 border rounded-xl p-4 flex items-center gap-4 transition-all
                    ${isDiscovered ? 'border-space-700' : 'border-space-800 opacity-40 grayscale'}`}>
                    <div className={`p-4 rounded-lg flex items-center justify-center relative
                      ${isDiscovered ? RESOURCE_COLORS[res.id] : 'bg-space-700'}`}>
                      <Database size={24} className={isDiscovered ? 'text-white/80' : 'text-gray-600'} />
                      {!isDiscovered && <Lock size={12} className="absolute inset-0 m-auto text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-orbitron text-sm text-white uppercase tracking-wider">
                          {isDiscovered ? (t.resources as any)[res.id] : t.ui.locked}
                        </h3>
                        {isDiscovered && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border border-white/10 uppercase
                            ${res.id === 'metal' ? 'text-gray-400' : res.id === 'ice' ? 'text-blue-400' : res.id === 'crystal' ? 'text-purple-400' : 'text-amber-400'}`}>
                            {(t.ui.rarity_types as any)[rarityKey]}
                          </span>
                        )}
                      </div>
                      
                      {isDiscovered ? (
                        <div className="flex gap-4 items-center">
                          <div className="flex items-center gap-1.5">
                            <Zap size={10} className="text-neon-gold" />
                            <span className="text-[10px] font-mono text-neon-gold">{res.basePrice} CR</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MousePointer2 size={10} />
                            <span className="text-[10px] font-mono">{hits} {t.ui.hits_unit}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-3 w-24 bg-space-700 rounded animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'radar' ? (
            <div className="grid gap-4">
              {[
                { id: 'battery', icon: <Battery size={24} />, name: t.radar_upgrades?.battery?.name || 'Battery', desc: t.radar_upgrades?.battery?.desc || 'More pulses per scan', cost: 200 * Math.pow(2, radar.upgrades.battery) },
                { id: 'deepScan', icon: <Search size={24} />, name: t.radar_upgrades?.deepScan?.name || 'Deep Scan', desc: t.radar_upgrades?.deepScan?.desc || 'Find rarer resources', cost: 500 * Math.pow(3, radar.upgrades.deepScan), max: 3 },
                { id: 'gridSize', icon: <Maximize size={24} />, name: t.radar_upgrades?.gridSize?.name || 'Beam Width', desc: t.radar_upgrades?.gridSize?.desc || 'Larger scanning area', cost: 1000 * Math.pow(4, radar.upgrades.gridSize), max: 2 },
                { id: 'sonar', icon: <Zap size={24} />, name: t.radar_upgrades?.sonar?.name || 'Sonar', desc: t.radar_upgrades?.sonar?.desc || 'Auto-reveal resources', cost: 300 * Math.pow(2.5, radar.upgrades.sonar) },
              ].map((upg) => {
                const level = radar.upgrades[upg.id as keyof typeof radar.upgrades];
                const isMax = upg.max !== undefined && level >= upg.max;

                return (
                  <div key={upg.id} className="bg-space-800 border border-space-700 rounded-xl p-4 flex items-center justify-between group hover:border-neon-blue/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-space-700 rounded-lg text-neon-blue group-hover:scale-110 transition-transform">
                        {upg.icon}
                      </div>
                      <div>
                        <h3 className="font-orbitron text-sm text-white mb-0.5">
                          {upg.name}
                          <span className="text-neon-blue text-[10px] ml-2">Lv.{level}</span>
                        </h3>
                        <p className="text-[11px] text-gray-400 max-w-[280px]">
                          {upg.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeRadar(upg.id as any)}
                      disabled={credits < upg.cost || isMax}
                      className={`px-4 py-2 rounded-lg font-orbitron text-[10px] uppercase transition-all flex flex-col items-center gap-1 min-w-[100px] cursor-pointer
                        ${isMax ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' :
                          credits >= upg.cost ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,242,255,0.2)]' :
                          'bg-space-700 border border-space-600 text-gray-500 cursor-not-allowed opacity-50'}`}
                    >
                      {isMax ? t.ui.max_level : (
                        <>
                          <span>{t.ui.upgrade}</span>
                          <span className="text-neon-gold">{Math.floor(upg.cost).toLocaleString()} CR</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
