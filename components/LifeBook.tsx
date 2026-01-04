import React, { useState } from 'react';
import { BaziChart } from '../types';
import { AIReport } from './AIReport';
import { getBriefInterpretation } from '../services/interpretationService';
import { BookOpen, Scroll, User, Sparkles, Feather, Briefcase, Heart, Fingerprint } from 'lucide-react';

interface Props {
    chart: BaziChart;
}

export const LifeBook: React.FC<Props> = ({ chart }) => {
    const [activeSection, setActiveSection] = useState<'basic' | 'ai'>('basic');
    const details = chart.wuxing.details;

    if (!details) return <div>数据不足，无法生成命书。</div>;

    const interpretation = getBriefInterpretation(chart);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center py-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center justify-center gap-2">
                    <Feather className="text-violet-600" size={24} />
                    天机·人生全息命书
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                    子平真诠与大数据模型的智慧结晶
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center gap-8 border-b border-slate-100 mb-8">
                <button
                    onClick={() => setActiveSection('basic')}
                    className={`pb-3 px-4 text-sm font-bold transition-all ${activeSection === 'basic' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    命局精要
                </button>
                <button
                    onClick={() => setActiveSection('ai')}
                    className={`pb-3 px-4 text-sm font-bold transition-all flex items-center gap-1 ${activeSection === 'ai' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Sparkles size={14} /> AI 详解版
                </button>
            </div>

            {/* Content */}
            {activeSection === 'basic' && (
                <div className="space-y-8">

                    {/* 1. Core Identity Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Card 1: Identity & Structure */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <User size={100} />
                            </div>
                            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-violet-600 rounded-full"></span>
                                命造格局
                            </h3>

                            <div className="flex items-start gap-6">
                                {/* Day Master Avatar */}
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl font-serif font-black text-slate-800 border-2 border-slate-100 shadow-inner">
                                        {chart.pillars.day.gan}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">本命日元</span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-4 pt-1">
                                    <div>
                                        <div className="text-sm text-slate-500 mb-1">五行属性</div>
                                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            {details.dmWuxing}命人
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${details.strength.includes('旺')
                                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                身{details.strength}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-50 w-full"></div>
                                    <div>
                                        <div className="text-sm text-slate-500 mb-1">能量状态</div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            元神在命局中能量占比 <strong className="font-mono text-slate-800">{details.percentage}%</strong>。
                                            {details.strength === '偏旺'
                                                ? '日主刚健，作事果断，有魄力，但需防过刚易折。'
                                                : '日主柔和，善于忍耐，心思细腻，但需防优柔寡断。'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Strategy / Yong Shen */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent)] pointer-events-none"></div>

                            <div>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-indigo-200 z-10 relative">
                                    <Scroll size={18} /> 天机直断
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="text-xs text-indigo-300 uppercase tracking-wider mb-1">核心用神 (Lucky Elements)</div>
                                        <div className="text-2xl font-bold text-white tracking-wide">
                                            {details.yongShen.split('/').join(' · ')}
                                        </div>
                                    </div>

                                    <p className="text-indigo-100/80 text-sm leading-relaxed border-l-2 border-indigo-500/50 pl-3">
                                        夫命之所重者，平衡也。君之命局，
                                        {details.strength === '偏旺' ? '过于刚强，宜克宜泄' : '气势偏弱，宜生宜扶'}。
                                        故以<strong className="text-white mx-1">{details.yongShen.split('/')[0]}</strong>为第一用神，
                                        凡遇此五行之年份、方位或行业，必有转机。
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-indigo-300 font-mono">
                                <span>TianJi Algorithm v2.0</span>
                                <span>VERIFIED</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Deterministic Interpretation Modules (New) */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Personality */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Fingerprint size={18} className="text-violet-500 group-hover:scale-110 transition-transform" />
                                本性与心理
                            </h4>
                            <div className="text-sm text-slate-600 leading-relaxed text-justify relative">
                                <span className="text-3xl font-serif text-violet-200 absolute -top-4 -left-2 z-0">“</span>
                                <span className="relative z-10">{interpretation.personality}</span>
                            </div>
                        </div>

                        {/* Career */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Briefcase size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                事业与财富
                            </h4>
                            <div className="text-sm text-slate-600 leading-relaxed text-justify border-l-2 border-amber-100 pl-3">
                                {interpretation.career}
                            </div>
                        </div>

                        {/* Love */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Heart size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                情感与婚姻
                            </h4>
                            <div className="text-sm text-slate-600 leading-relaxed text-justify bg-pink-50/50 p-3 rounded-lg border border-pink-50">
                                {interpretation.love}
                            </div>
                        </div>

                    </section>

                    {/* Upsell Banner */}
                    <div className="mt-8 bg-gradient-to-r from-violet-50 via-white to-violet-50 p-8 rounded-2xl border border-dashed border-violet-200 text-center space-y-4">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto text-violet-600 mb-2">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">这只是冰山一角...</h3>
                        <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed">
                            您的<strong>深层潜意识</strong>、<strong>人生财富具体数额</strong>、以及<strong>未来十年的流年吉凶细节</strong>，
                            都隐藏在八字的深层结构中。是否邀请“天机先生”为您撰写完整命书？
                        </p>
                        <button
                            onClick={() => setActiveSection('ai')}
                            className="mt-4 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                        >
                            <Sparkles size={16} /> 立即生成《全息推演报告》
                        </button>
                        <p className="text-xs text-slate-400 mt-2">
                            * 需要 Google Gemini API Key 支持
                        </p>
                    </div>
                </div>
            )}

            {activeSection === 'ai' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <AIReport chart={chart} />
                </div>
            )}

        </div>
    );
};
