import React from 'react';
import { Heart, AlertTriangle, Lightbulb } from 'lucide-react';

interface Props {
  yearZhi: string;
}

// Zodiac Mapping
const ZHI_TO_ANIMAL: Record<string, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// Relationship Logic (Animal Names)
const ZODIAC_RELATIONS: Record<string, {
  sanHe: string[]; // Three Harmony
  liuHe: string[]; // Six Harmony
  sanHui: string[]; // Three Meetings (Seasonal)
  chong: string[]; // Clash
  xing: string[]; // Punishment
  hai: string[]; // Harm
  po: string[]; // Destruction
}> = {
  '子': { // Rat
    sanHe: ['龙', '猴'], liuHe: ['牛'], sanHui: ['猪', '牛'],
    chong: ['马'], xing: ['兔'], hai: ['羊'], po: ['鸡']
  },
  '丑': { // Ox
    sanHe: ['蛇', '鸡'], liuHe: ['鼠'], sanHui: ['猪', '鼠'],
    chong: ['羊'], xing: ['羊', '狗'], hai: ['马'], po: ['龙']
  },
  '寅': { // Tiger
    sanHe: ['马', '狗'], liuHe: ['猪'], sanHui: ['兔', '龙'],
    chong: ['猴'], xing: ['蛇', '猴'], hai: ['蛇'], po: ['猪']
  },
  '卯': { // Rabbit
    sanHe: ['猪', '羊'], liuHe: ['狗'], sanHui: ['虎', '龙'],
    chong: ['鸡'], xing: ['鼠'], hai: ['龙'], po: ['马']
  },
  '辰': { // Dragon
    sanHe: ['鼠', '猴'], liuHe: ['鸡'], sanHui: ['虎', '兔'],
    chong: ['狗'], xing: ['龙'], hai: ['兔'], po: ['牛']
  },
  '巳': { // Snake
    sanHe: ['鸡', '牛'], liuHe: ['猴'], sanHui: ['马', '羊'],
    chong: ['猪'], xing: ['虎', '猴'], hai: ['虎'], po: ['猴']
  },
  '午': { // Horse
    sanHe: ['虎', '狗'], liuHe: ['羊'], sanHui: ['蛇', '羊'],
    chong: ['鼠'], xing: ['午'], hai: ['牛'], po: ['兔']
  },
  '未': { // Goat
    sanHe: ['猪', '兔'], liuHe: ['马'], sanHui: ['蛇', '马'],
    chong: ['牛'], xing: ['牛', '狗'], hai: ['鼠'], po: ['狗']
  },
  '申': { // Monkey
    sanHe: ['鼠', '龙'], liuHe: ['蛇'], sanHui: ['鸡', '狗'],
    chong: ['虎'], xing: ['虎', '蛇'], hai: ['猪'], po: ['蛇']
  },
  '酉': { // Rooster
    sanHe: ['蛇', '牛'], liuHe: ['龙'], sanHui: ['猴', '狗'],
    chong: ['兔'], xing: ['酉'], hai: ['狗'], po: ['鼠']
  },
  '戌': { // Dog
    sanHe: ['虎', '马'], liuHe: ['兔'], sanHui: ['猴', '鸡'],
    chong: ['龙'], xing: ['牛', '羊'], hai: ['鸡'], po: ['羊']
  },
  '亥': { // Pig
    sanHe: ['兔', '羊'], liuHe: ['虎'], sanHui: ['鼠', '牛'],
    chong: ['蛇'], xing: ['亥'], hai: ['猴'], po: ['虎']
  }
};

const Tag: React.FC<{ text: string; type: 'red' | 'gray' }> = ({ text, type }) => (
  <span className={`
    inline-block px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2
    ${type === 'red' ? 'bg-white text-rose-500 shadow-sm border border-rose-100' : 'bg-white text-gray-500 shadow-sm border border-gray-200'}
  `}>
    {text}
  </span>
);

export const ZodiacAnalysis: React.FC<Props> = ({ yearZhi }) => {
  const animal = ZHI_TO_ANIMAL[yearZhi] || '';
  const rel = ZODIAC_RELATIONS[yearZhi];

  if (!rel) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
          {animal}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">生肖分析 · {animal}</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
            年支: {yearZhi}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lucky / Affinity Section */}
        <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-100">
          <div className="flex items-center gap-2 mb-4 text-rose-600 font-bold">
            <Heart size={18} className="fill-current" />
            <h3>缘分相合</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-xs font-bold text-rose-400 w-12 mt-1.5">三合</span>
              <div className="flex-1">
                {rel.sanHe.map(a => <Tag key={a} text={a} type="red" />)}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-bold text-rose-400 w-12 mt-1.5">六合</span>
              <div className="flex-1">
                {rel.liuHe.map(a => <Tag key={a} text={a} type="red" />)}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-bold text-rose-400 w-12 mt-1.5">三会</span>
              <div className="flex-1">
                {rel.sanHui.map(a => <Tag key={a} text={a} type="red" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Unlucky / Caution Section */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-amber-600 font-bold">
            <AlertTriangle size={18} className="fill-amber-100 text-amber-500" />
            <h3 className="text-gray-700">需要注意</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-xs font-bold text-gray-400 w-12 mt-1.5">相冲</span>
              <div className="flex-1">
                {rel.chong.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-bold text-gray-400 w-12 mt-1.5">相刑</span>
              <div className="flex-1">
                {rel.xing.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-bold text-gray-400 w-12 mt-1.5">相害</span>
              <div className="flex-1">
                {rel.hai.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
             <div className="flex items-start">
              <span className="text-xs font-bold text-gray-400 w-12 mt-1.5">相破</span>
              <div className="flex-1">
                {rel.po.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Tip */}
      <div className="mt-6 bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 border border-amber-100">
        <Lightbulb size={14} className="text-amber-500 flex-shrink-0" />
        <p>提示：生肖相合仅供参考，人际交往更看重性格契合与沟通，切勿迷信。</p>
      </div>
    </div>
  );
};