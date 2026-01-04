import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie, Tooltip as RechartsTooltip } from 'recharts';
import { BaziChart } from '../types';
import { Shield, Zap, TrendingUp, AlertTriangle, Activity, Droplets, Flame, Mountain, Wind, Disc } from 'lucide-react';

interface Props {
  wuxing: BaziChart['wuxing'];
}

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  '木': <Wind size={16} className="text-emerald-500" />,
  '火': <Flame size={16} className="text-rose-500" />,
  '土': <Mountain size={16} className="text-amber-500" />,
  '金': <Disc size={16} className="text-slate-400" />,
  '水': <Droplets size={16} className="text-blue-500" />
};

export const ElementalChart: React.FC<Props> = ({ wuxing }) => {
  const details = wuxing.details;

  // Fallback if details are missing (backward compatibility)
  if (!details) {
    return (
      <div className="p-4 bg-white rounded-lg text-center text-slate-400">
        暂无详细分析数据，请刷新重试。
      </div>
    );
  }

  // --- Dynamic Scaling Logic ---
  const maxScore = Math.max(...wuxing.scores.map(s => s.value), 10); // Minimum 10 to avoid div/0 or tiny scale
  const totalScore = wuxing.scores.reduce((a, b) => a + b.value, 0) || 1;
  const chartDomainMax = maxScore * 1.2; // Scale charts so max element is ~80% of radius/bar

  // Gauge Angle Calculation (-90 to 90 degrees)
  const gaugeAngle = (details.percentage / 100) * 180 - 90;

  const getStrengthColor = (p: number) => {
    if (p >= 55) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (p < 35) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* 1. Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: DM Strength Gauge */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-500 opacity-50"></div>

          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-700">日元旺衰</h3>
          </div>

          {/* Gauge Visual */}
          <div className="relative w-48 h-24 mt-2 mb-6">
            <div className="absolute w-full h-full rounded-tl-full rounded-tr-full bg-slate-100 border-t-[16px] border-l-[16px] border-r-[16px] border-slate-100 box-content -left-4 -top-4"></div>
            <div className="absolute bottom-0 left-[10%] w-[80%] h-[180%] border-t-[16px] border-l-[16px] border-r-[16px] border-transparent border-t-emerald-200 rounded-full opacity-30"></div>
            <div
              className="absolute bottom-0 left-1/2 w-1 h-[calc(100%-10px)] bg-slate-800 origin-bottom transition-transform duration-1000 ease-out z-10 rounded-full shadow-lg"
              style={{ transform: `translateX(-50%) rotate(${gaugeAngle}deg)` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full border-2 border-white"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 w-4 h-2 -translate-x-1/2 bg-slate-800 rounded-t-full z-20"></div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-serif font-black text-slate-800">
              {details.percentage}<span className="text-sm font-sans text-slate-400 font-normal">%</span>
            </div>
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getStrengthColor(details.percentage)}`}>
              {details.strength}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">同党 vs 异党能量比</p>
        </div>

        {/* Card 2: Radar Balance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-bold text-slate-700 text-center mb-2 flex justify-center items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" /> 五行分布
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={wuxing.scores}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, chartDomainMax]} tick={false} />
                <Radar
                  name="能量"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', color: '#4c1d95', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Yong Shen (Useful God) */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-lg shadow-violet-200 text-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-90">
              <Shield size={18} />
              <h3 className="font-bold">喜用神建议</h3>
            </div>
            <div className="text-2xl font-bold leading-relaxed tracking-wide">
              {details.yongShen.split('/').map((s, i) => (
                <span key={i} className="inline-block mr-2 mb-2 px-3 py-1 bg-white/20 rounded-lg text-sm backdrop-blur-sm border border-white/10">
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-75 leading-relaxed">
            <p>建议佩戴或多亲近上述五行对应的颜色、方位或行业，以平衡命局能量。</p>
          </div>
        </div>
      </div>

      {/* 2. Detailed Breakdown Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          五行能量量化表
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
          {wuxing.scores.map((score) => {
            // Visualize relative to the strongest element (so max bar is ~80-90% full)
            const visualPercent = Math.min(100, (score.value / chartDomainMax) * 100);
            const realRatio = Math.round((score.value / totalScore) * 100);

            return (
              <div key={score.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    {ELEMENT_ICONS[score.name]}
                    {score.name}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-serif font-black text-slate-800 leading-none">{score.value}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">{realRatio}%</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${visualPercent}%`, backgroundColor: score.color }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  能量强度
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Text Analysis */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <div className="flex gap-4">
          <div className="shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-violet-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800">AI 综合评语</h3>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
              {wuxing.summary.replace(/建议喜用神：.*$/, '')}
              {/* Removing the duplicate suggestion line since we have cards for it */}
            </p>
            {details.strength !== '中和' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 w-fit mt-2">
                <AlertTriangle size={12} />
                <span>
                  {details.strength === '偏旺' ? '日主过旺，宜克泄耗，忌印比。' : '日主偏弱，宜印比帮身，忌克泄。'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
