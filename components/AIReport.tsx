import React, { useState, useEffect } from 'react';
import { BaziChart } from '../types';
import { generateFullReport, generateMicroInterpretation } from '../services/geminiService';
import { MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  chart: BaziChart;
}

export const AIReport: React.FC<Props> = ({ chart }) => {
  const [apiKey, setApiKey] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('tianji_gemini_key');
    if (savedKey) {
        setApiKey(savedKey);
        setIsKeySaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    if(apiKey) {
        localStorage.setItem('tianji_gemini_key', apiKey);
        setIsKeySaved(true);
    }
  };

  const handleClearKey = () => {
      localStorage.removeItem('tianji_gemini_key');
      setApiKey('');
      setIsKeySaved(false);
  };

  const handleGenerate = async () => {
    if (!apiKey) return;
    setLoading(true);
    const result = await generateFullReport(apiKey, chart);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="flex items-center gap-2 mb-6 text-mystic-700">
        <Sparkles size={24} />
        <h2 className="text-xl font-bold">天机·AI 命理大师</h2>
      </div>

      {!isKeySaved ? (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 text-orange-700 mb-2">
                <AlertCircle size={18} />
                <span className="font-bold text-sm">需要 API Key</span>
            </div>
            <p className="text-xs text-orange-600 mb-3">
                使用 AI 功能需要提供 Google Gemini API Key。Key 仅保存在本地浏览器，不会上传服务器。
            </p>
            <div className="flex gap-2">
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入 Gemini API Key"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mystic-500"
                />
                <button 
                    onClick={handleSaveKey}
                    className="bg-mystic-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-mystic-700"
                >
                    保存 Key
                </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">获取 Key: <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline">Google AI Studio</a></p>
        </div>
      ) : (
        <div className="mb-4 flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                ● API Key 已激活
            </span>
            <button onClick={handleClearKey} className="text-xs text-gray-400 hover:text-red-500 underline">更换</button>
        </div>
      )}

      {!report && isKeySaved && (
        <div className="text-center py-12">
            <p className="text-gray-500 mb-6">解锁 3000 字全息命运推演报告，包含格局、事业、情感深度分析。</p>
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-gradient-to-r from-mystic-600 to-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
                {loading ? '天机推演中...' : '生成天机报告'}
                {!loading && <Sparkles size={16} />}
            </button>
        </div>
      )}

      {report && (
        <div className="prose prose-sm max-w-none prose-headings:text-mystic-800 prose-p:text-gray-600">
            <div className="markdown-body" dangerouslySetInnerHTML={{ 
                // In real app, use a markdown parser like react-markdown. 
                // For this demo, simple replacement or plain text display.
                __html: report.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1 class="text-xl font-bold my-4">$1</h1>').replace(/## (.*)/g, '<h2 class="text-lg font-bold my-3">$1</h2>')
            }} />
        </div>
      )}
    </div>
  );
};
