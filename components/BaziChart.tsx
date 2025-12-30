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
    <div className={`
        relative flex flex-col items-center
        bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] 
        transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]
        border border-slate-100 overflow-hidden group
        ${highlight ? 'ring-2 ring-violet-500/50 shadow-violet-100' : ''} 
        z-10 min-w-[70px] sm:min-w-[90px]
    `}>
      {/* Title Header */}
      <div className={`
          w-full text-center py-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase
          ${highlight ? 'bg-violet-50 text-violet-700' : 'bg-slate-50 text-slate-500'}
      `}>
        {title}
      </div>

      {/* Main Content Area */}
      <div className="w-full px-2 py-3 flex flex-col items-center gap-2">

        {/* Ten Gods (Heaven) */}
        <div className="text-[10px] text-slate-400 font-medium h-4 leading-none">
          {data.ganGod}
        </div>

        {/* Heavenly Stem */}
        <div className="text-3xl sm:text-4xl font-serif font-black text-slate-800 leading-none filter drop-shadow-sm">
          {data.gan}
        </div>

        {/* Earthly Branch */}
        <div
          ref={setZhiRef}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          className={`
                w-full text-center py-2 text-3xl sm:text-4xl font-serif font-black 
                cursor-help transition-colors rounded-lg
                ${highlight ? 'text-violet-900 bg-violet-50/50' : 'text-slate-800 hover:bg-slate-50'}
            `}
        >
          {data.zhi}
        </div>

        {/* Hidden Stems (CangGan) */}
        <div className="w-full flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100/60 min-h-[50px]">
          {data.hiddenGan.map((gan, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] px-1 group/item">
              <span className="text-slate-400 group-hover/item:text-slate-600 transition-colors w-1/2 text-left">{data.zhiGod[idx] || '-'}</span>
              <span className="text-slate-600 font-bold w-1/2 text-right">{gan}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full bg-slate-50/50 p-2 space-y-1.5 border-t border-slate-100 text-[10px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">纳音</span>
          <span className="text-violet-600 font-medium truncate max-w-[60px]">{data.naYin}</span>
        </div>

        {/* Chang Sheng Logic: DayMaster vs SelfSitting */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[9px] scale-95 origin-left" title="日干长生 (运)">运·长生</span>
          <span className="text-slate-700 font-medium">{data.xingYun}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[9px] scale-95 origin-left" title="自坐长生 (坐)">坐·长生</span>
          <span className="text-slate-500">{data.selfXingYun}</span>
        </div>

        {data.kongWang && (
          <div className="flex justify-center mt-1">
            <span className="bg-red-50 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-mono border border-red-100">
              空亡
            </span>
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
  const [lines, setLines] = useState<{ x1: number, y1: number, x2: number, y2: number, type: string, label: string }[]>([]);

  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];
  const titles = ['年柱', '月柱', '日柱', '时柱'];

  useEffect(() => {
    if (hoveredIndex === null || !containerRef.current) {
      setLines([]);
      return;
    }

    const updateLines = () => {
      if (!containerRef.current || hoveredIndex === null) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const sourceEl = zhiRefs.current[hoveredIndex];
      if (!sourceEl) return;

      const sourceRect = sourceEl.getBoundingClientRect();

      // Calculate relative to container
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
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [hoveredIndex, chart]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header Meta Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: '公历', value: chart.meta.solarDate },
          { label: '农历', value: chart.meta.lunarDate },
          { label: '真太阳时', value: chart.meta.trueSolarTime, highlight: true },
          { label: '起运', value: chart.meta.qiYunInfo, highlight: true },
          { label: '造/肖', value: `${chart.meta.gender} / ${chart.meta.sign}` }
        ].map((item, i) => (
          <div key={i} className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col hover:bg-white transition-colors">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{item.label}</span>
            <span className={`font-medium text-xs sm:text-sm ${item.highlight ? 'text-violet-600' : 'text-slate-700'}`}>
              {item.value || '-'}
            </span>
          </div>
        ))}
      </div>

      {/* Three Palaces / Hidden Info */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100/80 backdrop-blur-sm">
        {[
          { label: '胎元', value: chart.hidden.taiYuan },
          { label: '命宫', value: chart.hidden.mingGong },
          { label: '身宫', value: chart.hidden.shenGong }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase">{item.label}</span>
            <span className="font-serif font-bold text-slate-700">{item.value}</span>
          </div>
        ))}
      </div>

      {/* The Bazi Matrix */}
      <div className="relative p-2" ref={containerRef}>
        {/* SVG Overlay for Connections */}
        <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full overflow-visible">
          <defs>
            <marker id="arrowhead-clash" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4 z" fill="#f43f5e" />
            </marker>
            <marker id="arrowhead-combine" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4 z" fill="#10b981" />
            </marker>
          </defs>
          {lines.map((line, idx) => {
            const isClash = line.type === 'clash';
            const color = isClash ? '#f43f5e' : '#10b981'; // rose-500 : emerald-500
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;

            // Curve the line slightly for better visuals
            const curveOffset = 30;
            const pathData = `M${line.x1},${line.y1} Q${midX},${midY - curveOffset} ${line.x2},${line.y2}`;

            return (
              <g key={idx} className="drop-shadow-md">
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeDasharray={isClash ? "6,4" : "0"}
                  strokeLinecap="round"
                  opacity="0.9"
                  markerEnd={`url(#arrowhead-${line.type})`}
                />
                {/* Badge for Relationship Type */}
                <g transform={`translate(${midX},${midY - curveOffset / 2})`}>
                  <rect x="-12" y="-10" width="24" height="20" rx="4" fill="white" stroke={color} strokeWidth="1.5" />
                  <text
                    dy="0.32em"
                    fill={color}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {line.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="grid grid-cols-4 gap-2 sm:gap-4 select-none">
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
