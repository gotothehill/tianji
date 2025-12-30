import React, { useState, useEffect } from 'react';
import { UserProfile, BaziChart, TabType } from './types';
import * as Storage from './services/storageService';
import * as Astrology from './services/astrologyService';
import { BaziChartDisplay } from './components/BaziChart';
import { ElementalChart } from './components/ElementalChart';
import { ZodiacAnalysis } from './components/ZodiacAnalysis';
import { Timeline } from './components/Timeline';
import { AIReport } from './components/AIReport';
import { ShenShaTable } from './components/ShenShaTable';
import { Compass, User, Plus, Trash2, Calendar, MapPin, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.CHART);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New profile form state
  const [newProfile, setNewProfile] = useState<Partial<UserProfile>>({
    name: '',
    gender: 1,
    birthDate: '1990-01-01',
    birthTime: '12:00',
    longitude: 116.40, // Beijing default
  });

  // Derived state
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const baziChart: BaziChart | null = activeProfile ? Astrology.calculateBazi(activeProfile) : null;

  useEffect(() => {
    const loaded = Storage.getProfiles();
    setProfiles(loaded);
    const savedActive = Storage.getActiveProfileId();
    if (savedActive && loaded.find(p => p.id === savedActive)) {
        setActiveProfileId(savedActive);
    } else if (loaded.length > 0) {
        setActiveProfileId(loaded[0].id);
    } else {
        setShowCreateForm(true);
    }
  }, []);

  const handleCreateProfile = () => {
    if(!newProfile.name) return;
    
    const profile: UserProfile = {
        id: crypto.randomUUID(),
        name: newProfile.name!,
        gender: newProfile.gender as 0|1,
        birthDate: newProfile.birthDate!,
        birthTime: newProfile.birthTime!,
        longitude: newProfile.longitude!,
        notes: ''
    };
    
    Storage.saveProfile(profile);
    setProfiles(Storage.getProfiles());
    setActiveProfileId(profile.id);
    Storage.setActiveProfileId(profile.id);
    setShowCreateForm(false);
    setIsSidebarOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    Storage.deleteProfile(id);
    const remaining = Storage.getProfiles();
    setProfiles(remaining);
    if(remaining.length > 0) {
        setActiveProfileId(remaining[0].id);
    } else {
        setActiveProfileId(null);
        setShowCreateForm(true);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            setNewProfile(prev => ({...prev, longitude: pos.coords.longitude}));
        }, (err) => alert("无法获取位置信息"));
    }
  };

  const TAB_NAMES: Record<string, string> = {
      [TabType.CHART]: '命盘',
      [TabType.TIMELINE]: '运程',
      [TabType.ANALYSIS]: '分析',
      [TabType.SHEN_SHA]: '神煞',
      [TabType.AI]: 'AI 解读',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 text-mystic-700 font-serif font-bold text-lg">
            <Compass className="w-6 h-6" /> 天机·星盘 Lite
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
            <h1 className="hidden md:flex items-center gap-2 text-2xl font-serif font-bold text-mystic-800 mb-8">
                <Compass className="w-8 h-8 text-mystic-600" />
                天机·星盘 Lite
            </h1>
            
            <div className="mb-6">
                <button 
                    onClick={() => { setShowCreateForm(true); setIsSidebarOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-mystic-600 text-white py-2 px-4 rounded-lg shadow hover:bg-mystic-700 transition"
                >
                    <Plus size={16} /> 新建档案
                </button>
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">我的档案</h3>
                {profiles.map(p => (
                    <button
                        key={p.id}
                        onClick={() => { setActiveProfileId(p.id); Storage.setActiveProfileId(p.id); setIsSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center group ${activeProfileId === p.id ? 'bg-mystic-50 text-mystic-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center gap-2">
                            <User size={14} /> {p.name}
                        </span>
                        {activeProfileId === p.id && (
                             <Trash2 size={12} className="opacity-50 hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Create Form Modal (simplified as overlay) */}
        {showCreateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold mb-4">新建排盘档案</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">姓名</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} />
                        </div>
                        <div className="flex gap-4">
                             <label className="flex items-center gap-2">
                                <input type="radio" name="gender" checked={newProfile.gender === 1} onChange={() => setNewProfile({...newProfile, gender: 1})} /> 乾造 (男)
                             </label>
                             <label className="flex items-center gap-2">
                                <input type="radio" name="gender" checked={newProfile.gender === 0} onChange={() => setNewProfile({...newProfile, gender: 0})} /> 坤造 (女)
                             </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">日期 (公历)</label>
                                <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={newProfile.birthDate} onChange={e => setNewProfile({...newProfile, birthDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">时间</label>
                                <input type="time" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={newProfile.birthTime} onChange={e => setNewProfile({...newProfile, birthTime: e.target.value})} />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 flex justify-between">
                                出生经度 
                                <button onClick={handleGetLocation} className="text-mystic-600 text-xs flex items-center gap-1"><MapPin size={10} /> 自动获取</button>
                             </label>
                             <input type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={newProfile.longitude} onChange={e => setNewProfile({...newProfile, longitude: parseFloat(e.target.value)})} />
                             <p className="text-[10px] text-gray-400 mt-1">用于真太阳时校正。</p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        {profiles.length > 0 && <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>}
                        <button onClick={handleCreateProfile} className="px-4 py-2 bg-mystic-600 text-white rounded hover:bg-mystic-700">开始排盘</button>
                    </div>
                </div>
            </div>
        )}

        {/* Dashboard */}
        {activeProfile && baziChart ? (
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Info Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{activeProfile.name}</h1>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {activeProfile.birthDate} {activeProfile.birthTime} 
                            <span className="bg-mystic-100 text-mystic-700 px-2 py-0.5 rounded-full text-xs">
                                {activeProfile.gender === 1 ? '男' : '女'}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {Object.values(TabType).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-mystic-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                {TAB_NAMES[tab]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300">
                    {activeTab === TabType.CHART && (
                        <div className="space-y-6">
                            {/* Row 1: Main Chart & Elements */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-3">
                                    <BaziChartDisplay chart={baziChart} />
                                </div>
                                <div className="lg:col-span-3">
                                    <ElementalChart wuxing={baziChart.wuxing} />
                                </div>
                            </div>
                            {/* Row 2: Zodiac Analysis */}
                            <div className="grid grid-cols-1">
                                <ZodiacAnalysis yearZhi={baziChart.pillars.year.zhi} />
                            </div>
                        </div>
                    )}
                    {activeTab === TabType.TIMELINE && (
                        <Timeline daYunList={baziChart.daYun} />
                    )}
                    {activeTab === TabType.ANALYSIS && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ElementalChart wuxing={baziChart.wuxing} />
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold mb-4">五行分析</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {baziChart.wuxing.summary}
                                    <br/><br/>
                                    分析依据月令（季节）以及比劫印星的扶抑情况来判定日元旺衰。
                                </p>
                            </div>
                         </div>
                    )}
                    {activeTab === TabType.SHEN_SHA && (
                        <ShenShaTable chart={baziChart} />
                    )}
                    {activeTab === TabType.AI && (
                        <AIReport chart={baziChart} />
                    )}
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Compass size={48} className="mb-4 opacity-20" />
                <p>请选择或新建档案以开始。</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
