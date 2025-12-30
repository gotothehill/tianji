import React, { useState } from 'react';
import { DaYunData } from '../types';

interface Props {
  daYunList: DaYunData[];
}

export const Timeline: React.FC<Props> = ({ daYunList }) => {
  const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
  const selectedDaYun = daYunList[selectedDaYunIndex];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 px-1">大运 (Life Cycles)</h3>
      
      {/* Horizontal Scrollable Da Yun List */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">
        {daYunList.map((yun, idx) => (
          <div 
            key={idx}
            onClick={() => setSelectedDaYunIndex(idx)}
            className={`
                snap-center flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg cursor-pointer border transition-all
                ${selectedDaYunIndex === idx 
                    ? 'bg-mystic-600 text-white border-mystic-600 shadow-lg scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-mystic-50'}
            `}
          >
            <span className="text-[10px] opacity-70">{yun.startAge} 岁</span>
            <div className="text-lg font-serif font-bold my-1">
                {yun.gan}{yun.zhi}
            </div>
            <span className="text-[10px] opacity-70">{yun.startYear}</span>
          </div>
        ))}
      </div>

      {/* Selected Da Yun Details & Liu Nian Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="mb-4 flex justify-between items-center border-b border-gray-100 pb-2">
            <h4 className="font-bold text-gray-800">
                当前大运: {selectedDaYun.gan}{selectedDaYun.zhi}
                <span className="text-sm font-normal text-gray-500 ml-2">
                    年龄 {selectedDaYun.startAge} - {selectedDaYun.startAge + 9}
                </span>
            </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {selectedDaYun.liuNian.map((year, idx) => (
                <div key={idx} className="border border-gray-100 rounded p-2 flex flex-col items-center hover:shadow-md transition-shadow bg-gray-50/50">
                    <div className="text-xs text-gray-400 mb-1">{year.year} ({year.age}岁)</div>
                    <div className="text-lg font-serif font-bold text-gray-800">{year.gan}{year.zhi}</div>
                    <div className="text-[10px] text-indigo-500 mt-1">风险检测</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
