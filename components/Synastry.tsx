import React, { useState, useMemo } from 'react';
import { BaziChart, UserProfile } from '../types';
import * as Astrology from '../services/astrologyService';
import * as Storage from '../services/storageService';
import { generateSynastryReport } from '../services/aiService';
import { Heart, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, Zap, Scale, Flame } from 'lucide-react';

interface Props {
    currentProfile: UserProfile | undefined;
}

const WUXING_MAP: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const ELEMENTS = ['木', '火', '土', '金', '水'];

export const Synastry: React.FC<Props> = ({ currentProfile }) => {
    const allProfiles = Storage.getProfiles();

    // Selection State
    const [profileAId, setProfileAId] = useState<string>(currentProfile?.id || '');
    const [profileBId, setProfileBId] = useState<string>('');
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived Values
    const profileA = allProfiles.find(p => p.id === profileAId);
    const profileB = allProfiles.find(p => p.id === profileBId);

    const chartA = useMemo(() => profileA ? Astrology.calculateBazi(profileA) : null, [profileA]);
    const chartB = useMemo(() => profileB ? Astrology.calculateBazi(profileB) : null, [profileB]);

    // Advanced Compatibility Logic
    const analysis = useMemo(() => {
        if (!chartA || !chartB) return null;

        const ga = chartA.pillars.day.gan;
        const gb = chartB.pillars.day.gan;
        const za = chartA.pillars.day.zhi;
        const zb = chartB.pillars.day.zhi;

        // 1. Gan He (Heavenly Stems Combination) - Mental/Spiritual connection
        const GAN_HE = [['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']];
        const isGanHe = GAN_HE.some(pair => pair.includes(ga) && pair.includes(gb));

        // 2. Zhi He (Earthly Branches Six Combinations) - Physical/Domestic harmony
        const ZHI_HE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
        const isZhiHe = ZHI_HE.some(pair => pair.includes(za) && pair.includes(zb));

        // 3. Zhi Chong (Clash) - Conflict
        const ZHI_CHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
        const isZhiChong = ZHI_CHONG.some(pair => pair.includes(za) && pair.includes(zb));

        // 4. DM Relationship (Ten Gods)
        const wa = WUXING_MAP[ga]; // e.g. '木'
        const wb = WUXING_MAP[gb];
        const idxA = ELEMENTS.indexOf(wa);
        const idxB = ELEMENTS.indexOf(wb);

        let relationType = '';
        let relationDesc = '';

        if (idxA === idxB) {
            relationType = '比劫 (Friend)';
            relationDesc = '双方性质相同，如同道中人，易产生共鸣，但也易各持己见，互不相让。';
        } else if ((idxA + 1) % 5 === idxB) {
            relationType = '食伤 (Output)';
            relationDesc = '甲方生乙方。甲方愿为乙方付出，像父母对孩子般呵护，乙方受宠。';
        } else if ((idxA + 2) % 5 === idxB) {
            relationType = '财星 (Wealth)';
            relationDesc = '甲方克乙方。甲方在关系中占主导地位，想控制或占有乙方。';
        } else if ((idxB + 1) % 5 === idxA) {
            relationType = '印枭 (Resource)';
            relationDesc = '乙方生甲方。乙方往往是甲方的贵人，照顾甲方，甲方较轻松。';
        } else if ((idxB + 2) % 5 === idxA) {
            relationType = '官杀 (Power)';
            relationDesc = '乙方克甲方。乙方会让甲方感到压力，约束甲方，但也促使甲方成长。';
        }

        // 5. Element Complementarity (Based on Yong Shen)
        // Does B provide what A needs?
        const aNeeds = (chartA.wuxing.details?.yongShen || '').split('/'); // ['木', ' fire']
        const bStrongest = chartB.wuxing.scores.sort((a, b) => b.value - a.value)[0].name; // B's strongest
        const bProvidesWhatANeeds = aNeeds.some(n => n.includes(bStrongest));

        // Does A provide what B needs?
        const bNeeds = (chartB.wuxing.details?.yongShen || '').split('/');
        const aStrongest = chartA.wuxing.scores.sort((a, b) => b.value - a.value)[0].name;
        const aProvidesWhatBNeeds = bNeeds.some(n => n.includes(aStrongest));

        let complementScore = 0;
        if (bProvidesWhatANeeds) complementScore += 1;
        if (aProvidesWhatBNeeds) complementScore += 1;

        let complementDesc = '五行互补性一般，需靠后天磨合。';
        if (complementScore === 2) complementDesc = '五行高度互补！双方如同拼图般完美契合，互为贵人。';
        else if (complementScore === 1) complementDesc = '五行部分互补。一方能显著旺另一方，关系有益。';


        // 6. Heuristic Score
        let score = 60; // Base Pass
        if (isGanHe) score += 15;
        if (isZhiHe) score += 15;
        if (isZhiChong) score -= 10;
        if (complementScore === 2) score += 10;
        else if (complementScore === 1) score += 5;

        // Cap
        score = Math.min(99, Math.max(40, score));

        return {
            score,
            isGanHe,
            isZhiHe,
            isZhiChong,
            relationType,
            relationDesc,
            complementDesc,
            complementScore
        };
    }, [chartA, chartB]);

    const handleGenerateReport = async () => {
        if (!chartA || !chartB) return;
        setLoading(true);
        setError(null);
        try {
            const result = await generateSynastryReport(chartA, chartB, 'couple');
            setReport(result);
        } catch (err: any) {
            setError(err.message || '生成报告失败');
        } finally {
            setLoading(false);
        }
    };

    const hasEnvKey = !!import.meta.env.VITE_OPENAI_API_KEY;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center py-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center justify-center gap-2">
                    <Heart className="text-rose-500" /> 天机·双人合盘
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    基于《三命通会》的深度关系匹配分析
                </p>
            </div>

            {/* Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

                {/* Profile A */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">甲方 (主星)</label>
                    <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                        value={profileAId}
                        onChange={(e) => setProfileAId(e.target.value)}
                    >
                        <option value="">选择档案...</option>
                        {allProfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.gender === 1 ? '男' : '女'}) - {p.birthDate}</option>
                        ))}
                    </select>
                    {chartA && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                            <div className="text-xs text-indigo-400 font-bold uppercase mb-1">日元</div>
                            <div className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md lg:mr-2">
                                    {chartA.pillars.day.gan}
                                </div>
                                <span className="text-sm text-slate-500 font-sans font-normal">
                                    {WUXING_MAP[chartA.pillars.day.gan]}命 / {chartA.wuxing.details?.strength}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Versus Icon */}
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                    {analysis ? (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg border-4 border-white">
                            <span className="text-xl font-black font-serif">{analysis.score}</span>
                            <span className="text-[8px] uppercase">Score</span>
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                            <RefreshCw size={20} />
                        </div>
                    )}
                </div>

                {/* Profile B */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">乙方 (对象)</label>
                    <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                        value={profileBId}
                        onChange={(e) => setProfileBId(e.target.value)}
                    >
                        <option value="">选择档案...</option>
                        {allProfiles.filter(p => p.id !== profileAId).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.gender === 1 ? '男' : '女'}) - {p.birthDate}</option>
                        ))}
                    </select>
                    {chartB && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg bg-gradient-to-br from-pink-50 to-white border border-pink-100 text-right">
                            <div className="text-xs text-pink-400 font-bold uppercase mb-1">日元</div>
                            <div className="text-2xl font-serif font-bold text-slate-800 flex items-center justify-end gap-2">
                                <span className="text-sm text-slate-500 font-sans font-normal lg:mr-2">
                                    {WUXING_MAP[chartB.pillars.day.gan]}命 / {chartB.wuxing.details?.strength}
                                </span>
                                <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center text-lg shadow-md">
                                    {chartB.pillars.day.gan}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Section */}
            {analysis && chartA && chartB && (
                <div className="space-y-6">

                    {/* Detailed Deterministic Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Card 1: Connection Strength */}
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="text-purple-500" size={18} />
                                <h4 className="font-bold text-slate-700 text-sm">缘分链接</h4>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-sm flex items-center gap-2 ${analysis.isGanHe ? 'text-purple-700 font-bold' : 'text-slate-500'}`}>
                                    {analysis.isGanHe ? <CheckCircle2 size={14} /> : <div className="w-3.5" />}
                                    天干相合 (精神)
                                </div>
                                <div className={`text-sm flex items-center gap-2 ${analysis.isZhiHe ? 'text-purple-700 font-bold' : 'text-slate-500'}`}>
                                    {analysis.isZhiHe ? <CheckCircle2 size={14} /> : <div className="w-3.5" />}
                                    地支相合 (生活)
                                </div>
                                <p className="text-xs text-slate-400 mt-2 leading-tight">
                                    {analysis.isGanHe || analysis.isZhiHe ? '双方八字显示出强烈的吸引力信号，缘分较深。' : '合相虽不明显，但这并不代表没有缘分，需看后天相处。'}
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Relationship Dynamics */}
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <Scale className="text-indigo-500" size={18} />
                                <h4 className="font-bold text-slate-700 text-sm">相处模式</h4>
                            </div>
                            <div className="text-lg font-bold text-slate-800 mb-1">
                                {analysis.relationType}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed text-justify">
                                {analysis.relationDesc}
                            </p>
                        </div>

                        {/* Card 3: Mutual Benefit */}
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="text-amber-500" size={18} />
                                <h4 className="font-bold text-slate-700 text-sm">五行互补</h4>
                            </div>
                            <div className="flex gap-1 mb-2">
                                {[...Array(analysis.complementScore)].map((_, i) => <div key={i} className="h-1.5 w-6 rounded-full bg-amber-400"></div>)}
                                {[...Array(2 - analysis.complementScore)].map((_, i) => <div key={i} className="h-1.5 w-6 rounded-full bg-slate-100"></div>)}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed text-justify">
                                {analysis.complementDesc}
                            </p>
                        </div>

                        {/* Card 4: Risks */}
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className={analysis.isZhiChong ? "text-rose-500" : "text-emerald-500"} size={18} />
                                <h4 className="font-bold text-slate-700 text-sm">潜在阻碍</h4>
                            </div>
                            <div className="min-h-[60px] flex items-center">
                                {analysis.isZhiChong ? (
                                    <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded leading-relaxed w-full">
                                        <strong>日支相冲：</strong> 双方在生活习惯或价值观上可能存在本质冲突，易发生口角，需多包容。
                                    </div>
                                ) : (
                                    <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded leading-relaxed w-full">
                                        <strong>并无冲克：</strong> 夫妻宫稳固，无明显结构性冲突信号，这是非常好的基础。
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* AI Action Area */}
                    {!report && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-purple-500"></div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 mt-2">解锁《双人深度合盘报告》</h3>
                            <p className="text-slate-500 mb-6 max-w-lg mx-auto text-sm">
                                虽然“{analysis.relationType}”关系已定，但细节决定成败。
                                天机先生将为您深度解析<strong>未来 5 年的运势同步率</strong>以及<strong>专属化解锦囊</strong>。
                            </p>

                            {error && (
                                <div className="mb-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg inline-block text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || !hasEnvKey}
                                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {loading ? 'AI 正在推演中...' : '生成合盘报告'}
                                {!loading && <Sparkles size={16} />}
                            </button>
                            {!hasEnvKey && <p className="text-xs text-amber-500 mt-3">需配置 API Key</p>}
                        </div>
                    )}

                    {/* AI Report Display logic */}
                    {report && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div dangerouslySetInnerHTML={{
                                __html: report
                                    .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold my-4 border-b border-gray-100 pb-2 text-rose-800">$1</h1>')
                                    .replace(/^## (.*)/gm, '<h2 class="text-xl font-bold my-4 text-slate-800 mt-8 flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-rose-500"></div>$1</h2>')
                                    .replace(/^### (.*)/gm, '<h3 class="text-lg font-bold my-2 text-slate-700">$1</h3>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-rose-700">$1</strong>')
                                    .replace(/\n/g, '<br/>')
                            }} />
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};
