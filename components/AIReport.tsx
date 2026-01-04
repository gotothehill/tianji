import React, { useState, useEffect } from 'react';
import { BaziChart } from '../types';
import { generateFullReport } from '../services/aiService';
import { getLifeBookReport, saveLifeBookReport } from '../services/storageService';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface Props {
  chart: BaziChart;
  profileId: string; // Added for persistence
}

export const AIReport: React.FC<Props> = ({ chart, profileId }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if env var is loaded (for UI feedback only)
  const hasEnvKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  // Load cached report on mount or profile change
  useEffect(() => {
    const cached = getLifeBookReport(profileId);
    setReport(cached);
  }, [profileId]);

  const handleGenerate = async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFullReport(chart);
      setReport(result);
      saveLifeBookReport(profileId, result);
    } catch (err: any) {
      setError(err.message || "生成失败，请检查网络或配置");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-mystic-700">
          <Sparkles size={24} />
          <h2 className="text-xl font-bold">天机·AI 命理大师</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs">
            {hasEnvKey ? (
              <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                <CheckCircle2 size={12} /> AI 服务已连接
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                <AlertCircle size={12} /> 未检测到 API 配置
              </span>
            )}
          </div>
          {/* Re-generate button if report exists */}
          {report && hasEnvKey && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-mystic-600 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 重新推演
            </button>
          )}
        </div>
      </div>

      {!report && (
        <div className="text-center py-12">
          {!hasEnvKey && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 text-sm rounded-lg max-w-lg mx-auto text-left">
              <p className="font-bold mb-1">配置说明：</p>
              <p>请在项目根目录的 <code>.env.local</code> 文件中配置以下变量，配置后需重启开发服务：</p>
              <pre className="bg-amber-100 p-2 rounded mt-2 text-xs overflow-x-auto font-mono">
                VITE_OPENAI_API_KEY=sk-xxx...{'\n'}
                VITE_OPENAI_BASE_URL=https://api.openai.com/v1{'\n'}
                VITE_OPENAI_MODEL=gpt-4o
              </pre>
            </div>
          )}

          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            天机大师将融合古籍智慧与现代算法，为您生成 3000 字深度命运推演报告。
          </p>

          {error && (
            <div className="mb-6 text-red-500 text-sm bg-red-50 p-3 rounded-lg inline-block">
              {error}
            </div>
          )}

          <button
            onClick={() => handleGenerate(false)}
            disabled={loading || !hasEnvKey}
            className="bg-gradient-to-r from-mystic-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto hover:-translate-y-0.5"
          >
            {loading ? '天机推演中...' : '开始八字推演'}
            {!loading && <Sparkles size={16} />}
          </button>
        </div>
      )}

      {report && (
        <div className="prose prose-slate max-w-none prose-headings:text-mystic-800 prose-p:text-slate-600 prose-li:text-slate-600 animate-in fade-in duration-500">
          {/* Simple Markdown Render - In production use react-markdown */}
          <div dangerouslySetInnerHTML={{
            __html: report
              .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold my-4 border-b border-gray-100 pb-2">$1</h1>')
              .replace(/^## (.*)/gm, '<h2 class="text-xl font-bold my-4 text-violet-800 mt-8 flex items-center gap-2"><span class="w-1 h-6 bg-violet-600 rounded-full inline-block"></span>$1</h2>')
              .replace(/^### (.*)/gm, '<h3 class="text-lg font-bold my-2 text-slate-700">$1</h3>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 bg-slate-100 px-1 rounded mx-0.5">$1</strong>')
              .replace(/\n/g, '<br/>')
          }} />

          <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            AI 生成内容仅供娱乐参考，请相信科学，理性对待。
          </div>
        </div>
      )}
    </div>
  );
};
