import React, { useState, useEffect } from 'react';
import { DaYunData, LiuNianData } from '../types';
import { ChevronRight, TrendingUp, AlertCircle, Info } from 'lucide-react';

const TEN_GOD_INFO: Record<string, string> = {
  '比肩': '兄弟朋友助力，利合作盟友。但亦有竞争夺财之象，忌独断专行。',
  '劫财': '个性刚强，易冲动破财。虽然人脉广，但不利积蓄，需防小人争斗。',
  '食神': '福气临门，衣食无忧，心情舒畅。利于才艺创作与享受生活，诸事平顺。',
  '伤官': '思维活跃，才华横溢。但易变动工作或招惹口舌是非，利创新，忌傲慢。',
  '正财': '财运稳定，多为工薪正途之财。利积蓄守成，男命此时利于姻缘建立。',
  '偏财': '意外之财，投资获利机会多。财路宽广但也易大起大落，忌贪婪冒进。',
  '正官': '事业升迁，名誉地位提升。利于考试、求职与升职，女命利夫运。',
  '七杀': '压力增大，挑战与机遇并存。虽有魄力开拓但易生意外或疾病，宜守忌攻。',
  '正印': '贵人提拔，利名声学业。生活安逸稳定，少劳苦，多得长辈庇护。',
  '偏印': '思想独特，灵感丰富。利于冷门偏业或学术研究，但性格多孤僻，防孤独。'
};

const YEAR_ADVICE: Record<string, string> = {
  '比肩': '本年利于合作交流，易得同辈助力。但需防财务纠纷与竞争压力，无论合伙还是交友，宜财务分明，切忌盲目义气。',
  '劫财': '流年不利聚财，易有冲动性消费或因友破财。建议保守理财，避免高风险投资，通过主动“破欢喜财”（如置业、学习）来应象。',
  '食神': '运势舒缓，心情愉悦，利于展现才华、享受美食与生活。是修身养性、学习新技能的好年份，忌安逸过度而不思进取。',
  '伤官': '才思敏捷，求变心强，利于突破创新。但易恃才傲物惹是非，工作中切忌顶撞上司，宜低调做事，言多必失。',
  '正财': '正财星照耀，收入稳定，多劳多得。适合稳扎稳打，积累财富。男命感情运佳，单身者有望脱单。',
  '偏财': '财气流动大，有意外获利机会，也预示开销增加。投资宜见好就收，切勿贪婪。人际应酬增多，需注意作息。',
  '正官': '事业运上升，利于升职加薪、公职考试或争取权威认证。女命夫运提升。举止宜端正，切忌挑战规则。',
  '七杀': '压力与机遇并存，可能会面临严峻挑战或职位变动。需抗压前行，把压力转化为动力。特别注意身体健康与出行安全。',
  '正印': '贵人运强，多得长辈或上司提携。利于考证、进修名气。生活安稳，是休养生息和提升自我的好时机。',
  '偏印': '灵感涌现，利于研究玄学、艺术或冷门领域。心理上可能偏向孤独，容易胡思乱想，建议多参与社交活动，保持阳光心态。'
};

interface Props {
  daYunList: DaYunData[];
}

export const Timeline: React.FC<Props> = ({ daYunList }) => {
  // Initialize with Current Year logic
  const currentYear = new Date().getFullYear();

  // Find the Da Yun index that contains the current year
  const initialDaYunIndex = daYunList.findIndex(dy =>
    currentYear >= dy.startYear && currentYear <= (dy.startYear + 9)
  );

  // Default to 0 if not found (e.g. year out of range)
  const effectiveIndex = initialDaYunIndex >= 0 ? initialDaYunIndex : 0;

  // Find the specific year node for default selection
  const initialYearNode = initialDaYunIndex >= 0
    ? daYunList[effectiveIndex].liuNian.find(yn => yn.year === currentYear) || null
    : null;

  const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(effectiveIndex);
  const [selectedYear, setSelectedYear] = useState<LiuNianData | null>(initialYearNode);
  const selectedDaYun = daYunList[selectedDaYunIndex];

  const handleDaYunClick = (idx: number) => {
    if (idx !== selectedDaYunIndex) {
      setSelectedDaYunIndex(idx);
      setSelectedYear(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Da Yun (Major Cycles) Strip */}
      <div className="relative">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
          <TrendingUp size={14} />
          大运 (10-Year Cycles)
        </h3>

        <div className="flex overflow-x-auto gap-3 pb-4 pt-1 px-1 scrollbar-hide snap-x mask-linear-fade">
          {daYunList.map((yun, idx) => {
            const isSelected = selectedDaYunIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => handleDaYunClick(idx)}
                className={`
                        group relative flex flex-col items-center justify-between
                        min-w-[70px] h-[100px] p-2 rounded-2xl border transition-all duration-300 snap-center
                        ${isSelected
                    ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-200 -translate-y-1'
                    : 'bg-white border-slate-100 hover:border-violet-200 hover:bg-slate-50'}
                    `}
              >
                {/* Top: Age */}
                <span className={`text-[10px] font-medium ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                  {yun.startAge}岁
                </span>

                {/* Center: Pillar & God */}
                <div className={`flex flex-col items-center my-1 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  <span className={`text-[9px] mb-0.5 ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>{yun.ganGod}</span>
                  <div className="text-xl font-serif font-black leading-none flex flex-col items-center">
                    <span>{yun.gan}</span>
                    <span className="mt-0.5">{yun.zhi}</span>
                  </div>
                </div>

                {/* Bottom: Year */}
                <span className={`text-[10px] ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                  {yun.startYear}
                </span>

                {/* Active Indicator Dot */}
                {isSelected && (
                  <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-violet-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Detail View */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300" key={selectedDaYunIndex}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span className="font-serif bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-base">
                {selectedDaYun.gan}{selectedDaYun.zhi}
              </span>
              <span>大运详情</span>
            </h4>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>覆盖年龄: {selectedDaYun.startAge} - {selectedDaYun.startAge + 9} 岁</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>

              {/* Tooltip Wrapper */}
              <div className="group relative inline-flex items-center cursor-help">
                <span className="text-violet-600 font-medium border-b border-dashed border-violet-300 pb-0.5">
                  {selectedDaYun.ganGod}运
                </span>

                {/* 
                   Positioned BELOW (top-full mt-2) to avoid clipping.
                */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left pointer-events-none">
                  <div className="font-bold mb-1 text-violet-300">{selectedDaYun.ganGod}大运</div>
                  <div className="leading-relaxed opacity-90">
                    {TEN_GOD_INFO[selectedDaYun.ganGod] || "运势流转，吉凶参半。"}
                  </div>
                  {/* Arrow Pointing Up */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                </div>
              </div>

            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded border border-slate-100">
            {selectedDaYun.startYear} - {selectedDaYun.startYear + 9}
          </div>
        </div>

        {/* Liu Nian (Annual) Grid */}
        <div className="p-4 bg-slate-50/30">
          <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
            流年运势 (Annual Fortunes)
          </h5>
          <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-5 gap-3">
            {selectedDaYun.liuNian.map((year, idx) => {
              const isActive = selectedYear?.year === year.year;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedYear(year)}
                  className={`
                        relative rounded-xl p-3 border transition-all duration-200 group cursor-pointer text-left
                        ${isActive
                      ? 'bg-white border-violet-500 ring-2 ring-violet-200 shadow-md transform -translate-y-0.5'
                      : 'bg-white border-slate-100 hover:border-violet-300 hover:shadow-sm'}
                    `}
                >
                  {/* Header: Year & Age */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-slate-400">{year.year}</span>
                    <span className={`text-[10px] font-medium px-1.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                      {year.age}岁
                    </span>
                  </div>

                  {/* Content: Pillar with God */}
                  <div className="text-center mb-2 flex flex-col items-center">
                    <span className={`text-[10px] mb-0.5 font-bold scale-90 ${isActive ? 'text-violet-600' : 'text-slate-400'}`}>
                      {year.ganGod}
                    </span>
                    <span className={`text-lg font-serif font-black leading-none ${isActive ? 'text-violet-900' : 'text-slate-800'}`}>
                      {year.gan}{year.zhi}
                    </span>
                  </div>

                  {/* Footer: Status / Risk */}
                  <div className="flex justify-center items-center h-4">
                    {['冲', '克'].some(k => k === '冲') ? (
                      <span className="flex items-center gap-1 text-[9px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        <AlertCircle size={8} />
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* 3. Annual Advice Expanded View */}
          {selectedYear && (
            <div className="mt-4 p-4 rounded-xl bg-white border border-violet-100 shadow-sm animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-serif font-black text-slate-800">{selectedYear.gan}{selectedYear.zhi}</span>
                <span className="text-sm text-slate-400 font-mono pt-1">{selectedYear.year}年 ({selectedYear.age}岁)</span>
                <span className="ml-auto px-2 py-1 rounded bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                  {selectedYear.ganGod}年
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Info size={12} className="text-indigo-500" /> 主星含义
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    {TEN_GOD_INFO[selectedYear.ganGod]}
                  </div>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 流年建议
                  </div>
                  <div className="text-slate-700 leading-relaxed">
                    {YEAR_ADVICE[selectedYear.ganGod] || "平凡是福，顺其自然。建议多行善事，保持平常心。"}
                  </div>
                  {/* Fake logic for Risk Warning based on typical turbulent stars */}
                  {['七杀', '伤官', '劫财'].includes(selectedYear.ganGod) && (
                    <div className="mt-2 pt-2 border-t border-amber-200/30 text-amber-600 font-medium text-xs flex items-center gap-1">
                      <AlertCircle size={10} /> 此年气场波动较大，凡事宜三思后行。
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
