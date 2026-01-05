import React, { useState, useEffect, useMemo } from 'react';
import { BaziChart, DaYunData, LiuNianData } from '../types';
import { ChevronRight, TrendingUp, AlertCircle, Info, Sun, Moon, CalendarDays, ArrowRight, Compass, Clock, AlertTriangle, FileText, Bug, Sparkles, X, Loader2 } from 'lucide-react';
import { generateDailyGuide, DailyFortuneAPI } from '../services/aiService';

// --- CONSTANTS ---
const TIMING_MAP = ['23-01', '01-03', '03-05', '05-07', '07-09', '09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];
const SHI_CHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const DIRECTION_MAP: Record<string, string> = {
  '坎': '正北', '离': '正南', '震': '正东', '兑': '正西',
  '巽': '东南', '坤': '西南', '艮': '东北', '乾': '西北',
  '中': '中宫'
};

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

// --- HELPER: Lightweight Markdown Renderer ---
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j} className="text-violet-800 font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const SimpleMarkdown = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div className="space-y-2 font-sans text-sm text-slate-700 leading-relaxed">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2"></div>;

        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return <h4 key={i} className="text-violet-900 font-bold mt-4 mb-2 text-base">{text}</h4>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.replace(/^[\-\*]\s*/, '');
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="text-violet-400 mt-1.5 text-[10px]">●</span>
              <span className="flex-1">{parseBold(text)}</span>
            </div>
          );
        }

        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={i} className="pl-1 mb-1">
              {parseBold(trimmed)}
            </div>
          );
        }

        return <p key={i}>{parseBold(line)}</p>;
      })}
    </div>
  );
};


interface Props {
  chart: BaziChart | undefined | null;
}

export const Timeline: React.FC<Props> = ({ chart }) => {
  const [viewMode, setViewMode] = useState<'fortune' | 'dayun'>('fortune');
  const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
  const [selectedYear, setSelectedYear] = useState<LiuNianData | null>(null);
  const [now, setNow] = useState(new Date());

  // State for Lunar Data and Errors
  const [lunarData, setLunarData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI State
  const [aiGuide, setAiGuide] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Safe ID Logic
  const sessionIdentity = useMemo(() => {
    if (!chart) return null;
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    // Ultra-safe key generation based on chart metadata (Proxy for User ID)
    const safeId = (chart.meta.solarDate + chart.meta.gender).replace(/[^a-zA-Z0-9]/g, '');
    return { id: safeId, date: todayStr };
  }, [chart, now.getDate()]);

  // Load persistence via API Interface
  useEffect(() => {
    async function load() {
      if (sessionIdentity) {
        try {
          const stored = await DailyFortuneAPI.get(sessionIdentity.id, sessionIdentity.date);
          if (stored) {
            setAiGuide(stored);
          } else {
            setAiGuide(null);
          }
        } catch (e) {
          console.error("Failed to load daily guide", e);
        }
      }
    }
    load();
  }, [sessionIdentity]);

  const handleGenerateGuide = async () => {
    if (!lunarData || !chart || !sessionIdentity) return;

    setIsGenerating(true);
    try {
      const result = await generateDailyGuide(chart, lunarData);
      setAiGuide(result);
      // Save via Interface
      await DailyFortuneAPI.save(sessionIdentity.id, sessionIdentity.date, result);
    } catch (e) {
      console.error("AI Generation Error", e);
      alert("AI 服务暂时繁忙，请稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  };

  // Effect to select current DaYun
  useEffect(() => {
    if (chart?.daYun) {
      const currentYear = new Date().getFullYear();
      const idx = chart.daYun.findIndex(dy => currentYear >= dy.startYear && currentYear <= (dy.startYear + 9));
      if (idx >= 0) {
        setSelectedDaYunIndex(idx);
        const yn = chart.daYun[idx].liuNian.find(y => y.year === currentYear);
        if (yn) setSelectedYear(yn);
      }
    }
  }, [chart]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Safe Dynamic Import Engine for Lunar ---
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const module = await import('lunar-javascript');
        // @ts-ignore
        const Lunar = module.Lunar || module.default?.Lunar || module.default;

        if (!Lunar || typeof Lunar.fromDate !== 'function') {
          throw new Error(`Library loaded but Lunar entry not found.`);
        }

        const d = Lunar.fromDate(now);
        if (!d) throw new Error("Lunar.fromDate(now) returned null");

        const yi = typeof d.getDayYi === 'function' ? d.getDayYi() : [];
        const ji = typeof d.getDayJi === 'function' ? d.getDayJi() : [];
        const mapDir = (val: string) => DIRECTION_MAP[val] || val;

        const hoursList = [];
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        for (let i = 0; i < 12; i++) {
          const h = i * 2;
          const tmpDate = new Date(startOfDay);
          tmpDate.setHours(h);
          const tmpLunar = Lunar.fromDate(tmpDate);

          const god = tmpLunar.getTimeTianShen ? tmpLunar.getTimeTianShen() : '';
          const luck = tmpLunar.getTimeTianShenLuck ? tmpLunar.getTimeTianShenLuck() : '';

          hoursList.push({
            zhi: SHI_CHEN[i],
            time: TIMING_MAP[i],
            god,
            luck
          });
        }

        const data = {
          ganZhiYear: d.getYearInGanZhi(),
          ganZhiMonth: d.getMonthInGanZhi(),
          ganZhiDay: d.getDayInGanZhi(),
          cnMonth: d.getMonthInChinese(),
          cnDay: d.getDayInChinese(),
          yi: yi,
          ji: ji,
          zhiXing: d.getZhiXing(),
          naYin: d.getDayNaYin ? d.getDayNaYin() : '',
          jiShen: d.getDayJiShen ? d.getDayJiShen() : [],
          xiongSha: d.getDayXiongSha ? d.getDayXiongSha() : [],
          wealthPos: mapDir(d.getPositionCai ? d.getPositionCai() : (d.getDayPositionCai ? d.getDayPositionCai() : '查无')),
          joyPos: mapDir(d.getPositionXi ? d.getPositionXi() : (d.getDayPositionXi ? d.getDayPositionXi() : '查无')),
          noblePos: mapDir(d.getPositionYangGui ? d.getPositionYangGui() : (d.getDayPositionYangGui ? d.getDayPositionYangGui() : '查无')),
          chong: d.getDayChongDesc ? d.getDayChongDesc() : '无',
          sha: d.getDaySha ? d.getDaySha() : '无',
          pengZuGan: d.getPengZuGan ? d.getPengZuGan() : '无',
          pengZuZhi: d.getPengZuZhi ? d.getPengZuZhi() : '无',
          hours: hoursList
        };

        if (mounted) {
          setLunarData(data);
          setErrorMsg(null);
        }

      } catch (e: any) {
        console.error("Lunar Load Error:", e);
        if (mounted) setErrorMsg(e.message || String(e));
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [now]);

  if (!chart) return <div className="p-8 text-center text-slate-400">请先排盘以查看运势。</div>;

  const selectedDaYun = chart?.daYun ? chart.daYun[selectedDaYunIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Navigation */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-fit mx-auto sm:mx-0 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setViewMode('fortune')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'fortune' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Sun size={16} /> 今日必读
        </button>
        <button
          onClick={() => setViewMode('dayun')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'dayun' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <TrendingUp size={16} /> 一生大运
        </button>
      </div>

      {/* --- View 1: Fortune Dashboard --- */}
      {viewMode === 'fortune' && (
        <div className="space-y-6">

          {!lunarData ? (
            <div className="p-8 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 text-center">
              {errorMsg ? (
                <>
                  <AlertCircle className="mx-auto mb-2 text-rose-500" />
                  <p className="font-bold text-rose-600">万年历加载失败</p>
                  <div className="mt-2 text-xs font-mono bg-white p-2 text-left rounded border border-rose-100 overflow-auto max-h-32 text-rose-800 break-all">
                    DEBUG: {errorMsg}
                  </div>
                </>
              ) : (
                <>
                  <ArrowRight className="mx-auto mb-2 animate-spin text-amber-500" />
                  <p>正在计算星历数据...</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Hero Cards */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm">{lunarData.ganZhiYear}年</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm">{lunarData.ganZhiMonth}月</span>
                        {lunarData.zhiXing && <span className="bg-amber-400/80 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">{lunarData.zhiXing}日</span>}
                        {lunarData.naYin && <span className="bg-emerald-400/80 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">{lunarData.naYin}</span>}
                      </div>
                      <div className="text-4xl font-serif font-bold mb-1">{lunarData.cnMonth}月{lunarData.cnDay}</div>
                      <div className="text-violet-200 text-xs opacity-80">{now.toLocaleDateString()} {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-violet-200">{lunarData.ganZhiDay}</div>
                      <div className="text-[10px] text-violet-300 uppercase tracking-widest mt-1">当日干支</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-1 backdrop-blur-sm border border-white/10">
                    <div className="p-3 text-center border-r border-white/10">
                      <div className="text-emerald-300 font-bold text-xs mb-1 flex items-center justify-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> 宜 (Do)</div>
                      <p className="text-xs text-white/90 leading-relaxed line-clamp-2">{lunarData.yi.join(' ')}</p>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-rose-300 font-bold text-xs mb-1 flex items-center justify-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> 忌 (Don't)</div>
                      <p className="text-xs text-white/90 leading-relaxed line-clamp-2">{lunarData.ji.join(' ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2"><Compass className="text-blue-500" size={16} /> 吉神方位 (Lucky Directions)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100"><div className="text-[10px] text-slate-400 mb-1">财神 (Wealth)</div><div className="font-bold text-slate-700">{lunarData.wealthPos}</div></div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100"><div className="text-[10px] text-slate-400 mb-1">喜神 (Joy)</div><div className="font-bold text-slate-700">{lunarData.joyPos}</div></div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100"><div className="text-[10px] text-slate-400 mb-1">贵人 (Noble)</div><div className="font-bold text-slate-700">{lunarData.noblePos}</div></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2"><Clock className="text-amber-500" size={16} /> 十二时辰吉凶</h3>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">
                  {lunarData.hours.map((h: any, idx: number) => {
                    const isLucky = h.luck === '吉';
                    return (
                      <div key={h.zhi} className={`snap-center flex-shrink-0 w-20 bg-slate-50 rounded-lg p-2 text-center border ${isLucky ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100'} flex flex-col items-center group relative`}>
                        <div className="text-xs font-bold text-slate-700 mb-1">{h.zhi}时</div>
                        <div className="text-[10px] text-slate-400 mb-1 scale-90">{h.time}</div>
                        <div className={`w-full py-0.5 text-[10px] rounded font-bold ${isLucky ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{h.god} {h.luck}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Gods Lists */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-emerald-600 text-xs mb-2 flex items-center gap-1"><Sparkles size={12} /> 吉神 (Lucky Gods)</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lunarData.jiShen?.length > 0 ? lunarData.jiShen.slice(0, 8).map((g: string) => <span key={g} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">{g}</span>) : <span className="text-[10px] text-slate-400">无</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-600 text-xs mb-2 flex items-center gap-1"><AlertTriangle size={12} /> 凶神 (Fierce Gods)</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lunarData.xiongSha?.length > 0 ? lunarData.xiongSha.slice(0, 8).map((g: string) => <span key={g} className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">{g}</span>) : <span className="text-[10px] text-slate-400">无</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><AlertTriangle className="text-rose-500" size={16} /> 今日冲煞</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">日破 (Clash)</span><span className="font-medium text-slate-800">{lunarData.chong}</span></div>
                    <div className="w-full h-px bg-slate-50"></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">煞方 (Bad Dir)</span><span className="font-medium text-slate-800">{lunarData.sha}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><FileText className="text-indigo-500" size={16} /> 彭祖百忌</h3>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded"><strong className="text-indigo-600 mr-1">{lunarData.ganZhiDay[0]}:</strong>{lunarData.pengZuGan}</div>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded"><strong className="text-indigo-600 mr-1">{lunarData.ganZhiDay[1]}:</strong>{lunarData.pengZuZhi}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AI Guide - Inline & Persistent */}
          {!aiGuide ? (
            <button
              onClick={handleGenerateGuide}
              disabled={isGenerating}
              className="w-full text-left bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all group disabled:opacity-70 disabled:cursor-wait"
            >
              <div>
                <h4 className="font-bold text-violet-900 text-sm mb-0.5 flex items-center gap-2">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-violet-600" />}
                  想知道今日财运与事业机遇？
                </h4>
                <p className="text-xs text-violet-700">结合您八字的精准 AI 每日指南 (每日限一次)</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ArrowRight size={16} />
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-violet-50/50 p-4 border-b border-violet-100 flex justify-between items-center">
                <h4 className="font-bold text-violet-900 text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-600" />
                  天机·每日流年指南
                </h4>
                <span className="text-[10px] text-violet-400 bg-white px-2 py-0.5 rounded border border-violet-100">
                  {now.getFullYear()}-{now.getMonth() + 1}-{now.getDate()}
                </span>
              </div>
              <div className="p-5">
                {/* Call safe internal markdown renderer */}
                <SimpleMarkdown content={aiGuide} />
              </div>
              <div className="bg-slate-50 p-2 text-center">
                <p className="text-[10px] text-slate-400">AI 生成内容仅供参考 · 明日可再次生成</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- View 2: Da Yun (Existing) --- */}
      {viewMode === 'dayun' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {/* Fixed DaYun Layout */}
          <div className="relative">
            <div className="flex overflow-x-auto gap-3 pb-4 pt-1 px-1 scrollbar-hide snap-x mask-linear-fade">
              {chart?.daYun.map((yun, idx) => {
                const isSelected = selectedDaYunIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDaYunIndex(idx); setSelectedYear(null); }}
                    className={`
                                  group relative flex flex-col items-center justify-between
                                  min-w-[70px] h-[100px] p-2 rounded-2xl border transition-all duration-300 snap-center
                                  ${isSelected
                        ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-200 -translate-y-1'
                        : 'bg-white border-slate-100 hover:border-violet-200 hover:bg-slate-50'}
                              `}
                  >
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                      {yun.startAge}岁
                    </span>

                    <div className={`flex flex-col items-center my-1 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      <span className={`text-[9px] mb-0.5 ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>{yun.ganGod}</span>
                      <div className="text-xl font-serif font-black leading-none flex flex-col items-center">
                        <span>{yun.gan}</span>
                        <span className="mt-0.5">{yun.zhi}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                      {yun.startYear}
                    </span>

                    {isSelected && (
                      <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-violet-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDaYun && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span className="font-serif bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-base">
                      {selectedDaYun.gan}{selectedDaYun.zhi}
                    </span>
                    <span>大运详情</span>
                  </h4>
                </div>
                <div className="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded border border-slate-100">
                  {selectedDaYun.startYear} - {selectedDaYun.startYear + 9}
                </div>
              </div>

              <div className="p-4 bg-slate-50/30">
                <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">流年运势</h5>
                <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-5 gap-3">
                  {selectedDaYun.liuNian.map((year, idx) => {
                    const isActive = selectedYear?.year === year.year;
                    return (
                      <button key={idx} onClick={() => setSelectedYear(year)} className={`relative rounded-xl p-3 border transition-all duration-200 group cursor-pointer text-left ${isActive ? 'bg-white border-violet-500 ring-2 ring-violet-200 shadow-md transform -translate-y-0.5' : 'bg-white border-slate-100 hover:border-violet-300 hover:shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-slate-400">{year.year}</span>
                          <span className={`text-[10px] font-medium px-1.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>{year.age}岁</span>
                        </div>
                        <div className="text-center mb-2 flex flex-col items-center">
                          <span className={`text-[10px] mb-0.5 font-bold scale-90 ${isActive ? 'text-violet-600' : 'text-slate-400'}`}>{year.ganGod}</span>
                          <span className={`text-lg font-serif font-black leading-none ${isActive ? 'text-violet-900' : 'text-slate-800'}`}>{year.gan}{year.zhi}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {selectedYear && (
                  <div className="mt-4 p-4 rounded-xl bg-white border border-violet-100 shadow-sm animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-serif font-black text-slate-800">{selectedYear.gan}{selectedYear.zhi}</span>
                      <span className="text-sm text-slate-400 font-mono pt-1">{selectedYear.year}年</span>
                      <span className="ml-auto px-2 py-1 rounded bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">{selectedYear.ganGod}年</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-xs sm:text-sm">
                      <div className="text-slate-600 leading-relaxed">{TEN_GOD_INFO[selectedYear.ganGod]}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
