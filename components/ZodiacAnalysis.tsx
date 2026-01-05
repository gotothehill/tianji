import React, { useState } from 'react';
import { Heart, AlertTriangle, Lightbulb, Info } from 'lucide-react';

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
    inline-block px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2 hover:scale-105 transition-transform cursor-default
    ${type === 'red' ? 'bg-white text-rose-500 shadow-sm border border-rose-100' : 'bg-white text-gray-500 shadow-sm border border-gray-200'}
  `}>
    {text}
  </span>
);

interface InfoTooltipProps {
  title: string;
  content: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center ml-1">
      <Info
        size={12}
        className="text-gray-300 hover:text-indigo-500 cursor-pointer transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 leading-relaxed">
          <div className="font-bold mb-1 pb-1 border-b border-gray-600">{title}</div>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}

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
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-rose-400">三合</span>
                <InfoTooltip title="三合 (Three Harmony)" content="明合。代表志同道合、配合默契，是极好的合作与婚配组合。" />
              </div>
              <div className="flex-1">
                {rel.sanHe.map(a => <Tag key={a} text={a} type="red" />)}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-rose-400">六合</span>
                <InfoTooltip title="六合 (Six Harmony)" content="暗合。代表互为贵人，私下关系好，互相扶持，如胶似漆。" />
              </div>
              <div className="flex-1">
                {rel.liuHe.map(a => <Tag key={a} text={a} type="red" />)}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-rose-400">三会</span>
                <InfoTooltip title="三会 (Seasonal)" content="同党。同气相求，力量最大，往往代表亲戚朋友或同乡互助。" />
              </div>
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
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">相冲</span>
                <InfoTooltip title="相冲 (Clash)" content="五行对立。代表动荡、冲突、意见不合，容易导致分离或变动。" />
              </div>
              <div className="flex-1">
                {rel.chong.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">相刑</span>
                <InfoTooltip title="相刑 (Punishment)" content="互为折磨。代表纠结、难受、精神压力，或法律、身体上的小麻烦。" />
              </div>
              <div className="flex-1">
                {rel.xing.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">相害</span>
                <InfoTooltip title="相害 (Harm)" content="互相伤害。代表小人破坏、背后使坏，或者亲人之间的不和睦。" />
              </div>
              <div className="flex-1">
                {rel.hai.map(a => <Tag key={a} text={a} type="gray" />)}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center w-16 mt-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">相破</span>
                <InfoTooltip title="相破 (Destruction)" content="破坏干扰。代表内部破坏，好事多磨，通常指人际关系裂痕。" />
              </div>
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