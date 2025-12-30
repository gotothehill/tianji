import React, { useState, useRef, useEffect } from 'react';
import { BaziChart as BaziChartType, PillarData } from '../types';

interface Props {
  chart: BaziChartType;
}

// Relationship Logic
const ZHI_RELATIONS: Record<string, { clash: string[], combine: string[] }> = {
    '子': { clash: ['午'], combine: ['丑'] },
    '丑': { clash: ['未'], combine: ['子'] },
    '寅': { clash: ['申'], combine: ['亥'] },
    '卯': { clash: ['酉'], combine: ['戌'] },
    '辰': { clash: ['戌'], combine: ['酉'] },
    '巳': { clash: ['亥'], combine: ['申'] },
    '午': { clash: ['子'], combine: ['未'] },
    '未': { clash: ['丑'], combine: ['午'] },
    '申': { clash: ['寅'], combine: ['巳'] },
    '酉': { clash: ['卯'], combine: ['辰'] },
    '戌': { clash: ['辰'], combine: ['卯'] },
    '亥': { clash: ['巳'], combine: ['寅'] },
};

const getRelationship = (z1: string, z2: string): { type: 'clash' | 'combine' | null, label: string } => {
    if (!z1 || !z2) return { type: null, label: '' };
    const rel = ZHI_RELATIONS[z1];
    if (rel?.clash.includes(z2)) return { type: 'clash', label: '冲' };
    if (rel?.combine.includes(z2)) return { type: 'combine', label: '合' };
    return { type: null, label: '' };
};

interface PillarCardProps {
    title: string; 
    data: PillarData; 
    highlight?: boolean;
    setZhiRef: (el: HTMLDivElement | null) => void;
    onHover: (isHovering: boolean) => void;
}

const PillarCard: React.FC<PillarCardProps> = ({ title, data, highlight, setZhiRef, onHover }) => {
  return (
    <div className={`flex flex-col border border-mystic-200 rounded-lg overflow-hidden bg-white shadow-sm ${highlight ? 'ring-2 ring-mystic-500' : ''} z-10`}>
      <div className="bg-mystic-50 text-mystic-800 text-xs font-bold text-center py-1 uppercase tracking-wider">
        {title}
      </div>
      
      {/* Ten Gods (Heaven) */}
      <div className="text-[10px] text-gray-500 text-center py-1 h-6 border-b border-mystic-100">
        {data.ganGod}
      </div>

      {/* Heavenly Stem */}
      <div className="text-2xl font-serif text-center py-2 font-bold text-gray-800">
        {data.gan}
      </div>

      {/* Earthly Branch */}
      <div 
        ref={setZhiRef}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className="text-2xl font-serif text-center py-2 font-bold text-gray-800 border-t border-mystic-100 bg-mystic-50/30 cursor-help transition-colors hover:bg-mystic-100"
      >
        {data.zhi}
      </div>

      {/* Hidden Stems (CangGan) */}
      <div className="flex flex-col gap-0.5 px-2 py-2 border-t border-mystic-100 min-h-[60px]">
        {data.hiddenGan.map((gan, idx) => (
          <div key={idx} className="flex justify-between text-[10px]">
            <span className="text-gray-400">{data.zhiGod[idx] || '-'}</span>
            <span className="text-gray-700 font-medium">{gan}</span>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-mystic-50/50 p-2 space-y-1 border-t border-mystic-100">
        <div className="flex justify-between text-[10px]">
            <span className="text-gray-400">纳音</span>
            <span className="text-indigo-600 truncate max-w-[60px]">{data.naYin}</span>
        </div>
        <div className="flex justify-between text-[10px]">
            <span className="text-gray-400">长生</span>
            <span className="text-gray-700">{data.xingYun}</span>
        </div>
        {data.kongWang && (
             <div className="flex justify-center text-[10px] text-red-400 font-mono mt-1">
                (空亡)
             </div>
        )}
      </div>
    </div>
  );
};

export const BaziChartDisplay: React.FC<Props> = ({ chart }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const zhiRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{x1: number, y1: number, x2: number, y2: number, type: string, label: string}[]>([]);

  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];
  const titles = ['年柱', '月柱', '日柱', '时柱'];

  useEffect(() => {
    if (hoveredIndex === null || !containerRef.current) {
        setLines([]);
        return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const sourceEl = zhiRefs.current[hoveredIndex];
    if (!sourceEl) return;
    
    const sourceRect = sourceEl.getBoundingClientRect();
    const sourceX = sourceRect.left - containerRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top - containerRect.top + sourceRect.height / 2;
    
    const newLines: any[] = [];

    pillars.forEach((pillar, idx) => {
        if (idx === hoveredIndex) return;
        
        const targetEl = zhiRefs.current[idx];
        if (!targetEl) return;
        
        const rel = getRelationship(pillars[hoveredIndex].zhi, pillar.zhi);
        if (rel.type) {
            const targetRect = targetEl.getBoundingClientRect();
            const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
            const targetY = targetRect.top - containerRect.top + targetRect.height / 2;
            
            newLines.push({
                x1: sourceX,
                y1: sourceY,
                x2: targetX,
                y2: targetY,
                type: rel.type,
                label: rel.label
            });
        }
    });

    setLines(newLines);
  }, [hoveredIndex, chart]);

  return (
    <div className="space-y-4">
      {/* Header Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 bg-paper border border-orange-100 p-3 rounded-md shadow-sm">
        <div>
            <span className="block text-gray-400">公历</span>
            <span className="font-medium text-gray-800">{chart.meta.solarDate}</span>
        </div>
        <div>
            <span className="block text-gray-400">农历</span>
            <span className="font-medium text-gray-800">{chart.meta.lunarDate}</span>
        </div>
        <div>
            <span className="block text-gray-400">真太阳时</span>
            <span className="font-medium text-indigo-700">{chart.meta.trueSolarTime}</span>
        </div>
        <div>
            <span className="block text-gray-400">造/肖</span>
            <span className="font-medium text-gray-800">{chart.meta.gender} / {chart.meta.sign}</span>
        </div>
      </div>

      {/* Three Palaces */}
      <div className="flex justify-between gap-2 text-xs bg-white p-2 rounded border border-gray-100">
        <div className="flex gap-2">
            <span className="text-gray-400">胎元:</span>
            <span className="font-serif font-bold">{chart.hidden.taiYuan}</span>
        </div>
        <div className="flex gap-2">
            <span className="text-gray-400">命宫:</span>
            <span className="font-serif font-bold">{chart.hidden.mingGong}</span>
        </div>
        <div className="flex gap-2">
            <span className="text-gray-400">身宫:</span>
            <span className="font-serif font-bold">{chart.hidden.shenGong}</span>
        </div>
      </div>

      {/* The Matrix */}
      <div className="relative" ref={containerRef}>
        {/* SVG Overlay for Connections */}
        <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
            <defs>
                <marker id="arrowhead-clash" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker id="arrowhead-combine" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                </marker>
            </defs>
            {lines.map((line, idx) => {
                const color = line.type === 'clash' ? '#ef4444' : '#22c55e'; // red-500 : green-500
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2;
                return (
                    <g key={idx}>
                        <line 
                            x1={line.x1} 
                            y1={line.y1} 
                            x2={line.x2} 
                            y2={line.y2} 
                            stroke={color} 
                            strokeWidth="2" 
                            strokeDasharray={line.type === 'clash' ? "5,5" : "0"}
                            opacity="0.8"
                        />
                         {/* White circle background to hide line underneath */}
                         <circle cx={midX} cy={midY} r="9" fill="white" stroke={color} strokeWidth="1.5" />
                        <text 
                            x={midX} 
                            y={midY} 
                            dy="0.35em" 
                            fill={color} 
                            fontSize="11" 
                            fontWeight="bold" 
                            textAnchor="middle"
                            style={{ pointerEvents: 'none' }}
                        >
                            {line.label}
                        </text>
                    </g>
                );
            })}
        </svg>

        <div className="grid grid-cols-4 gap-2">
            {pillars.map((pillar, idx) => (
                <PillarCard 
                    key={idx}
                    title={titles[idx]} 
                    data={pillar} 
                    highlight={idx === 2} // Day pillar
                    setZhiRef={(el) => zhiRefs.current[idx] = el}
                    onHover={(hover) => setHoveredIndex(hover ? idx : null)}
                />
            ))}
        </div>
      </div>
    </div>
  );
};
