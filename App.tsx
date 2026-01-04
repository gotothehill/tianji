import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, BaziChart, TabType } from './types';
import * as Storage from './services/storageService';
import * as Astrology from './services/astrologyService';
import { searchCities, City } from './services/cityService';
import { BaziChartDisplay } from './components/BaziChart';
import { ElementalChart } from './components/ElementalChart';
import { ZodiacAnalysis } from './components/ZodiacAnalysis';
import { Timeline } from './components/Timeline';
import { LifeBook } from './components/LifeBook';
import { ShenShaTable } from './components/ShenShaTable';
import { Synastry } from './components/Synastry'; // Added
import { Compass, User, Plus, Trash2, Calendar, MapPin, Menu, X, Search, Loader2 } from 'lucide-react';

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

    // City Search State
    const [cityQuery, setCityQuery] = useState('');
    const [cityResults, setCityResults] = useState<City[]>([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const isSelectingRef = useRef(false); // Flag to prevent re-search on selection

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

    // City Search Effect
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        // Ignore changes caused by selection
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        if (cityQuery.trim().length < 2) {
            setCityResults([]);
            setShowCityDropdown(false);
            return;
        }

        setIsSearchingCity(true);
        searchTimeoutRef.current = window.setTimeout(async () => {
            const results = await searchCities(cityQuery);
            setCityResults(results);
            setIsSearchingCity(false);
            // Only show dropdown if we have results
            if (results.length > 0) {
                setShowCityDropdown(true);
            } else {
                setShowCityDropdown(false);
            }
        }, 300);
    }, [cityQuery]);

    const handleSelectCity = (city: City) => {
        isSelectingRef.current = true; // Mark as selection event
        setNewProfile(prev => ({ ...prev, longitude: city.longitude }));
        setCityQuery(`${city.name}, ${city.country}`);
        setShowCityDropdown(false);
    };

    // Handles closing the dropdown on blur with a slight delay
    const handleBlurCitySearch = () => {
        // Delay needed to allow 'click' on dropdown Item to register before hiding
        setTimeout(() => {
            setShowCityDropdown(false);
        }, 200);
    };

    const handleCreateProfile = () => {
        if (!newProfile.name) return;

        const profile: UserProfile = {
            id: crypto.randomUUID(),
            name: newProfile.name!,
            gender: newProfile.gender as 0 | 1,
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
        // Reset form
        setNewProfile({
            name: '',
            gender: 1,
            birthDate: '1990-01-01',
            birthTime: '12:00',
            longitude: 116.40,
        });
        setCityQuery('');
    };

    const handleDeleteProfile = (id: string) => {
        Storage.deleteProfile(id);
        const remaining = Storage.getProfiles();
        setProfiles(remaining);
        if (remaining.length > 0) {
            setActiveProfileId(remaining[0].id);
        } else {
            setActiveProfileId(null);
            setShowCreateForm(true);
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setNewProfile(prev => ({ ...prev, longitude: pos.coords.longitude }));
                setCityQuery("当前位置 (Auto)");
                isSelectingRef.current = true; // Also mark auto-location as selection to avoid dropdown
            }, (err) => alert("无法获取位置信息"));
        }
    };

    const TAB_NAMES: Record<string, string> = {
        [TabType.CHART]: '命盘',
        [TabType.TIMELINE]: '运程',
        [TabType.LIFE_BOOK]: '命书',
        [TabType.SYNASTRY]: '合盘',
        [TabType.SHEN_SHA]: '神煞',
        // [TabType.AI]: 'AI 解读',
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">新建排盘档案</h2>
                            <div className="space-y-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-mystic-500 focus:border-mystic-500 transition-all outline-none"
                                        placeholder="请输入姓名"
                                        value={newProfile.name}
                                        onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                                    />
                                </div>

                                {/* Gender Selection */}
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newProfile.gender === 1 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="gender" className="hidden" checked={newProfile.gender === 1} onChange={() => setNewProfile({ ...newProfile, gender: 1 })} />
                                        <span className="font-serif font-bold">乾造</span> (男)
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newProfile.gender === 0 ? 'bg-pink-50 border-pink-200 text-pink-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="gender" className="hidden" checked={newProfile.gender === 0} onChange={() => setNewProfile({ ...newProfile, gender: 0 })} />
                                        <span className="font-serif font-bold">坤造</span> (女)
                                    </label>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">公历日期</label>
                                        <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-mystic-500" value={newProfile.birthDate} onChange={e => setNewProfile({ ...newProfile, birthDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">出生时间</label>
                                        <input type="time" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-mystic-500" value={newProfile.birthTime} onChange={e => setNewProfile({ ...newProfile, birthTime: e.target.value })} />
                                    </div>
                                </div>

                                {/* Birth Place (City Search) */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                        出生城市 (用于真太阳时)
                                        <button onClick={handleGetLocation} className="text-mystic-600 text-xs flex items-center gap-1 hover:underline">
                                            <MapPin size={10} /> 定位当前
                                        </button>
                                    </label>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-mystic-500/50 focus:border-mystic-500"
                                            placeholder="搜索城市 (如: Beijing / 北京)"
                                            value={cityQuery}
                                            onChange={(e) => { setCityQuery(e.target.value); setShowCityDropdown(true); }}
                                            onBlur={handleBlurCitySearch}
                                            onFocus={() => {
                                                if (cityResults.length > 0) setShowCityDropdown(true);
                                            }}
                                        />
                                        {isSearchingCity && (
                                            <div className="absolute right-3 top-3 animate-spin text-gray-400">
                                                <Loader2 size={16} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Dropdown Results */}
                                    {showCityDropdown && cityResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            {cityResults.map((city, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectCity(city)}
                                                    className="w-full text-left px-4 py-2 hover:bg-mystic-50 flex flex-col border-b border-gray-50 last:border-0 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-800 text-sm">{city.name}</span>
                                                    <span className="text-[10px] text-gray-500">{city.subcountry}, {city.country}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Longitude Display (Read-onlyish) */}
                                    <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-2 bg-gray-50 p-1.5 rounded">
                                        <span>经度:</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="bg-transparent border-none p-0 text-gray-600 font-mono w-20 outline-none"
                                            value={newProfile.longitude}
                                            onChange={e => setNewProfile({ ...newProfile, longitude: parseFloat(e.target.value) })}
                                        />
                                        <span className="text-gray-300">|</span>
                                        <span>可手动微调</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                {profiles.length > 0 && (
                                    <button
                                        onClick={() => setShowCreateForm(false)}
                                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        取消
                                    </button>
                                )}
                                <button
                                    onClick={handleCreateProfile}
                                    disabled={!newProfile.name}
                                    className={`px-6 py-2.5 bg-mystic-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-mystic-200 hover:bg-mystic-700 hover:translate-y-[-1px] transition-all
                                ${!newProfile.name ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                                >
                                    开始排盘
                                </button>
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
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeProfile.gender === 1 ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                        {activeProfile.gender === 1 ? '乾造' : '坤造'}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {Object.keys(TAB_NAMES).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as TabType)}
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
                            {activeTab === TabType.LIFE_BOOK && (
                                <LifeBook chart={baziChart} />
                            )}
                            {activeTab === TabType.SYNASTRY && (
                                <Synastry currentProfile={activeProfile} />
                            )}
                            {activeTab === TabType.SHEN_SHA && (
                                <ShenShaTable chart={baziChart} />
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
