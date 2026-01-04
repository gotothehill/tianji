import React, { useState } from 'react';
import { BaziChart, UserProfile } from '../types';
import { ElementalChart } from './ElementalChart';
import { AIReport } from './AIReport';
import { getBriefInterpretation } from '../services/interpretationService';
import { BookOpen, UserCircle2, Briefcase, Heart } from 'lucide-react';

interface Props {
    chart: BaziChart;
    currentProfile: UserProfile;
}

export const LifeBook: React.FC<Props> = ({ chart, currentProfile }) => {
    const [activeSection, setActiveSection] = useState<'basic' | 'ai'>('basic');
    const brief = getBriefInterpretation(chart);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-violet-600" />
                        天机·人生全息命书
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        融合古法子平与现代大数据的综合命运推演
                    </p>
                </div>
            </div>

            {/* Navigation Tabs (Internal) */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveSection('basic')}
                    className={`pb-3 px-1 text-sm font-medium transition-all ${activeSection === 'basic' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    基础命理 (五行/格局)
                </button>
                <button
                    onClick={() => setActiveSection('ai')}
                    className={`pb-3 px-1 text-sm font-medium transition-all flex items-center gap-1 ${activeSection === 'ai' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    AI 深度推演 <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Pro</span>
                </button>
            </div>

            {/* Content */}
            {activeSection === 'basic' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* 1. Identity & Structure Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Life Structure */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <UserCircle2 size={100} className="text-violet-600" />
                            </div>
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-violet-600 rounded-full"></span> 命造格局
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">元神 (日主)</span>
                                    <span className="text-xl font-serif font-black text-slate-800">{chart.pillars.day.gan}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">能量强弱</span>
                                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-bold border border-violet-100">
                                        {chart.wuxing.details?.strength} ({chart.wuxing.details?.percentage}%)
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-600 leading-relaxed text-justify">
                                        {brief.personality}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Strategy & Yong Shen */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-emerald-400 rounded-full"></span> 天机直断
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">核心用神</div>
                                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-200">
                                        {chart.wuxing.details?.yongShen}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-300 leading-relaxed opacity-90">
                                    <strong className="text-white">开运指南：</strong>建议多亲近{chart.wuxing.details?.yongShen.split('/')[0]}五行相关的人事物。在做决策时，宜保持{chart.wuxing.details?.strength.includes('旺') ? '低调内敛，三思后行' : '积极进取，借力使力'}。
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Three Domains Deterministic Interpretation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Career & Wealth */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Briefcase size={18} className="text-amber-500" /> 事业与财富
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify mb-4">
                                {brief.career}
                            </p>
                            <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                * 此为基于喜用神的通用建议，精准职业规划请查看下方 AI 报告。
                            </div>
                        </div>

                        {/* Love & Relationship */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Heart size={18} className="text-rose-500" /> 情感与婚姻
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify mb-4">
                                {brief.love}
                            </p>
                            <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                * 此为基于日支与配偶星的简批，合盘分析请使用“双人合盘”功能。
                            </div>
                        </div>
                    </div>

                    {/* Upsell / Link to AI */}
                    <div
                        onClick={() => setActiveSection('ai')}
                        className="bg-gradient-to-r from-violet-100 to-indigo-100 border border-indigo-200 p-6 rounded-2xl cursor-pointer hover:shadow-md transition-all flex items-center justify-between group"
                    >
                        <div>
                            <h3 className="font-bold text-indigo-900 mb-1">想知道更详细的流年运势？</h3>
                            <p className="text-sm text-indigo-700">解锁 AI 深度推演，包含未来 3 年具体吉凶分析...</p>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                            <UserCircle2 />
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'ai' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <AIReport chart={chart} profileId={currentProfile.id} />
                </div>
            )}
        </div>
    );
};
