import React, { useState } from 'react';
import { DaYunData } from '../types';
import { ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  daYunList: DaYunData[];
}

export const Timeline: React.FC<Props> = ({ daYunList }) => {
  const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
  const selectedDaYun = daYunList[selectedDaYunIndex];

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
                onClick={() => setSelectedDaYunIndex(idx)}
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
            <p className="text-xs text-slate-500 mt-1">
              覆盖年龄: {selectedDaYun.startAge} - {selectedDaYun.startAge + 9} 岁
              <span className="mx-1">|</span>
              <span className="text-violet-600 font-medium">{selectedDaYun.ganGod}运</span>
            </p>
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
            {selectedDaYun.liuNian.map((year, idx) => (
              <div key={idx} className="
                        relative bg-white rounded-xl p-3 border border-slate-100 
                        hover:border-violet-200 hover:shadow-md transition-all group cursor-default
                    ">
                {/* Header: Year & Age */}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-slate-400">{year.year}</span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded-full">{year.age}岁</span>
                </div>

                {/* Content: Pillar with God */}
                <div className="text-center mb-2 flex flex-col items-center">
                  <span className="text-[10px] text-violet-500 mb-0.5 font-bold scale-90">{year.ganGod}</span>
                  <span className="text-lg font-serif font-black text-slate-800 group-hover:text-violet-700 transition-colors leading-none">
                    {year.gan}{year.zhi}
                  </span>
                </div>

                {/* Footer: Status / Risk */}
                <div className="flex justify-center items-center h-4">
                  {/* Placeholder logic for risk - real logic would go here */}
                  {['冲', '克'].some(k => k === '冲') ? (
                    <span className="flex items-center gap-1 text-[9px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <AlertCircle size={8} /> 风险检测
                    </span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
