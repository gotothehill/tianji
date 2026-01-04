import React, { useState } from 'react';
import { BaziChart } from '../types';
import { X, Info, Star } from 'lucide-react';

interface Props {
    chart: BaziChart;
}

const SHEN_SHA_INFO: Record<string, { type: 'lucky' | 'unlucky' | 'peach' | 'power' | 'art', desc: string }> = {
    '天乙贵人': {
        type: 'lucky',
        desc: '天乙贵人是命中最吉之神。若人遇之，主聪明智慧，出入近贵，逢凶化吉，多得贵人提拔。'
    },
    '文昌贵人': {
        type: 'lucky',
        desc: '文昌入命，主聪明过人，气质雅秀，举止温文，好学新知，具上进心，一生近官利贵。'
    },
    '禄神': {
        type: 'lucky',
        desc: '禄为养命之源。命中得禄，主性格刚毅，财禄丰足，衣食无忧。忌被冲破，否则不吉。'
    },
    '桃花': {
        type: 'peach',
        desc: '桃花主风流漂亮，异性缘佳，人际关系好。若桃花过重，则易招惹情感是非。'
    },
    '驿马': {
        type: 'power',
        desc: '驿马主奔波远行，出国留学，或职业变动。吉则升迁，凶则劳碌奔波，背井离乡。'
    },
    '华盖': {
        type: 'art',
        desc: '华盖星主孤高，有才艺，喜钻研技艺或玄学。多见于僧道、艺术家、哲学家之命。'
    },
    '将星': {
        type: 'power',
        desc: '将星入命，主有领导才能，具有慑众之威，利于武职或管理，掌权柄。'
    },
    '羊刃': {
        type: 'unlucky',
        desc: '羊刃性情刚烈，急躁冲动。吉则刚毅果断，凶则易惹是非、刑伤或血光之灾。'
    },
    '劫煞': {
        type: 'unlucky',
        desc: '劫煞主破财、生灾、被劫。若为忌神，则多主波折阻碍，需防小人。'
    },
    '空亡': {
        type: 'unlucky',
        desc: '空亡主事倍功半，六亲缘薄。年柱空亡祖业飘零，日柱空亡夫妻隔阂。但亦主心性空灵，利于修行。'
    },
    '太岁': {
        type: 'power',
        desc: '太岁为当年岁君，不可犯之。入命主变动、压力。若为喜用则掌权，若为忌则生灾。'
    },
    '岁破': {
        type: 'unlucky',
        desc: '岁破即冲太岁，主破败、动荡、诸事不宜。当以此年为动荡之年，需谨慎行事。'
    },
    '孤辰': {
        type: 'unlucky',
        desc: '男命忌孤辰，主性格孤僻，六亲缘薄，或是无子，多主孤独。'
    },
    '寡宿': {
        type: 'unlucky',
        desc: '女命忌寡宿，主独守空房，夫缘浅薄，或与丈夫貌合神离。'
    }
};

export const ShenShaTable: React.FC<Props> = ({ chart }) => {
    // Tooltip State
    const [hoveredInfo, setHoveredInfo] = useState<{ name: string, desc: string, x: number, y: number } | null>(null);

    const pillars = [
        { name: '年', data: chart.pillars.year },
        { name: '月', data: chart.pillars.month },
        { name: '日', data: chart.pillars.day },
        { name: '时', data: chart.pillars.hour },
    ];

    // Collect all unique Shen Sha present in the chart
    const presentShenSha = Array.from(new Set(
        pillars.flatMap(p => p.data.shenSha)
    )).sort();

    const getBadgeStyle = (name: string) => {
        const type = SHEN_SHA_INFO[name]?.type;
        switch (type) {
            case 'lucky': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
            case 'peach': return 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100';
            case 'power': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
            case 'art': return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
            case 'unlucky': return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
        }
    };

    const getIndicatorStyle = (name: string) => {
        const type = SHEN_SHA_INFO[name]?.type;
        switch (type) {
            case 'lucky': return 'bg-red-500 ring-red-200';
            case 'peach': return 'bg-pink-500 ring-pink-200';
            case 'power': return 'bg-purple-500 ring-purple-200';
            case 'art': return 'bg-indigo-500 ring-indigo-200';
            case 'unlucky': return 'bg-gray-500 ring-gray-200';
            default: return 'bg-blue-500 ring-blue-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Star className="text-orange-500 w-5 h-5" />
                <h3 className="font-bold text-gray-800">神煞一览</h3>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 w-1/3">神煞名称</th>
                            {pillars.map(p => (
                                <th key={p.name} className="px-6 py-3 text-center">{p.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {presentShenSha.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    未检测到主要神煞。
                                </td>
                            </tr>
                        ) : (
                            presentShenSha.map(name => (
                                <tr key={name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold cursor-help transition-transform hover:scale-105 ${getBadgeStyle(name)}`}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredInfo({
                                                    name,
                                                    desc: SHEN_SHA_INFO[name]?.desc || '暂无描述',
                                                    x: rect.left,
                                                    y: rect.bottom
                                                });
                                            }}
                                            onMouseLeave={() => setHoveredInfo(null)}
                                        >
                                            {name}
                                        </div>
                                    </td>
                                    {pillars.map(p => (
                                        <td key={p.name} className="px-6 py-4 text-center">
                                            {p.data.shenSha.includes(name) ? (
                                                <div
                                                    className={`w-3 h-3 rounded-full mx-auto ring-4 cursor-pointer hover:scale-125 transition-transform ${getIndicatorStyle(name)}`}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredInfo({
                                                            name,
                                                            desc: `${name}出现于【${p.name}柱】。\n${SHEN_SHA_INFO[name]?.desc || ''}`,
                                                            x: rect.left,
                                                            y: rect.bottom
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredInfo(null)}
                                                ></div>
                                            ) : (
                                                <span className="text-gray-200">-</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Hover Tooltip Portal/Overlay */}
            {hoveredInfo && (
                <div
                    className="fixed z-[100] bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl max-w-[240px] pointer-events-none animate-in fade-in zoom-in-95 duration-200 border border-slate-700/50"
                    style={{ top: hoveredInfo.y + 8, left: Math.min(hoveredInfo.x, window.innerWidth - 250) }}
                >
                    <div className="font-bold mb-1.5 pb-1.5 border-b border-slate-600/50 flex items-center justify-between">
                        <span>{hoveredInfo.name}</span>
                        <Info size={10} className="text-slate-400" />
                    </div>
                    <div className="leading-relaxed opacity-90 whitespace-pre-wrap">
                        {hoveredInfo.desc}
                    </div>
                    {/* Arrow */}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 rotate-45 border-t border-l border-slate-700/50"></div>
                </div>
            )}

            {/* Detailed Explanations List - Replaces Modal */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Info size={16} /> 神煞详解
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presentShenSha.map(name => (
                        <div key={name} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div className={`shrink-0 mt-0.5 font-bold text-xs px-2 py-1 rounded-md border text-center min-w-[70px] ${getBadgeStyle(name)}`}>
                                {name}
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">
                                {SHEN_SHA_INFO[name]?.desc || "此神煞暂无详细数据库描述。"}
                            </div>
                        </div>
                    ))}
                    {presentShenSha.length === 0 && (
                        <div className="text-xs text-gray-400">无神煞可解释。</div>
                    )}
                </div>
            </div>
        </div>
    );
};
