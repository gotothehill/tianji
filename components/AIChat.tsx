import React, { useState, useEffect, useRef } from 'react';
import { BaziChart } from '../types';
import { generateStarterQuestions, streamChatWithTianJi, ChatStorageAPI, ChatMessage } from '../services/aiService';
import { Send, Sparkles, User, Bot, Loader2, Trash2, Eraser } from 'lucide-react';

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

                if (trimmed.startsWith('---')) {
                    return <div key={i} className="w-full h-px bg-slate-200 my-4" />
                }


                return <p key={i}>{parseBold(line)}</p>;
            })}
        </div>
    );
};

interface Props {
    chart: BaziChart | null | undefined;
    profileId: string;
    profileName: string;
}

export const AIChat: React.FC<Props> = ({ chart, profileId, profileName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const loadedProfileId = useRef<string | null>(null);
    const isSubmitting = useRef(false);

    // Initial Load - Force reset when profileId changes
    useEffect(() => {
        if (!chart || !profileId) return;

        // Skip if we already loaded this exact profile
        if (loadedProfileId.current === profileId) return;

        const initChat = async () => {
            // 1. CLEAR STATE IMMEDIATELY so user doesn't see old chat
            setMessages([]);
            setSuggestions([]);
            setIsLoading(true);

            try {
                // 2. Load new profile data (Session Object)
                const session = await ChatStorageAPI.get(profileId);

                if (session && session.messages.length > 0) {
                    setMessages(session.messages);

                    if (session.suggestions && session.suggestions.length > 0) {
                        setSuggestions(session.suggestions);
                    } else {
                        // Legacy fallback or empty suggestions
                        setSuggestions(["还能问什么？", "未来运势？"]);
                    }
                } else {
                    const welcomeMsg: ChatMessage = {
                        id: 'welcome',
                        role: 'assistant',
                        content: `您好，我是您的专属命理顾问“天机先生”。\n基于**${profileName}**的八字命盘，您有什么想问的吗？`,
                        timestamp: Date.now()
                    };
                    setMessages([welcomeMsg]);
                    // Save initial state immediately
                    await ChatStorageAPI.save(profileId, { messages: [welcomeMsg], suggestions: [] });

                    // Generate Starters
                    try {
                        const starters = await generateStarterQuestions(chart);
                        setSuggestions(starters);
                        // Update storage with starters
                        ChatStorageAPI.save(profileId, { messages: [welcomeMsg], suggestions: starters });
                    } catch (e) {
                        console.error("Failed to load starter questions", e);
                    }
                }
            } finally {
                setIsLoading(false);
                loadedProfileId.current = profileId; // Mark as loaded
            }
        };

        initChat();
    }, [profileId, chart, profileName]); // Ensure profileName is in dep array too

    // Save on update - Only if we are saving to the CURRENTLY loaded profile
    useEffect(() => {
        // Prevent partial overwrites during loading or initial render
        // Also prevent saving empty suggestions while submitting a new request
        if (loadedProfileId.current === profileId && !isLoading && !isSubmitting.current) {
            if (messages.length > 0) {
                ChatStorageAPI.save(profileId, { messages, suggestions });
            }
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, suggestions, profileId, isLoading]);

    const handleSend = async (text: string) => {
        if (!text.trim() || !chart) return;

        // Lock saving immediately
        isSubmitting.current = true;

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        // Optimistic UI Update
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput('');
        setSuggestions([]); // Clear suggestions while thinking
        setIsLoading(true);

        const botMsgId = `b-${Date.now()}`;
        const initialBotMsg: ChatMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, initialBotMsg]);

        try {
            const { fullReply, suggestions: newSuggestions } = await streamChatWithTianJi(
                newHistory,
                chart,
                (chunk) => {
                    setMessages(current => {
                        const last = current[current.length - 1];
                        if (last.id === botMsgId) {
                            return [...current.slice(0, -1), { ...last, content: last.content + chunk }];
                        }
                        return current;
                    });
                }
            );

            // Final Sync
            setMessages(current => {
                const last = current[current.length - 1];
                if (last.id === botMsgId) {
                    return [...current.slice(0, -1), { ...last, content: fullReply }];
                }
                return current;
            });

            setSuggestions(newSuggestions);

            // Explicitly save state after turn completion to capture new suggestions
            // The useEffect will handle this, but being explicit here ensures synchronization
            // ChatStorageAPI.save(profileId, { messages: ..., suggestions: newSuggestions });

        } catch (e) {
            const errorMsg: ChatMessage = {
                id: `e-${Date.now()}`,
                role: 'assistant',
                content: '抱歉，天机算力受阻，请稍后再试。',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev.filter(m => m.id !== botMsgId), errorMsg]);
        } finally {
            setIsLoading(false);
            isSubmitting.current = false;
        }
    };

    const handleClearHistory = async () => {
        if (!chart) return;
        if (window.confirm("确定要删除此档案的所有聊天记录吗？")) {
            await ChatStorageAPI.clear(profileId);

            // 1. Reset to Original Welcome Only
            const welcomeMsg: ChatMessage = {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                content: `您好，我是您的专属命理顾问“天机先生”。\n基于**${profileName}**的八字命盘，您有什么想问的吗？`,
                timestamp: Date.now()
            };
            setMessages([welcomeMsg]);
            setSuggestions([]);

            // 2. Generate New Suggestions
            try {
                const starters = await generateStarterQuestions(chart);
                setSuggestions(starters);
                // Save new clean state
                ChatStorageAPI.save(profileId, { messages: [welcomeMsg], suggestions: starters });
            } catch (e) {
                console.error(e);
                ChatStorageAPI.save(profileId, { messages: [welcomeMsg], suggestions: [] });
            }
        }
    };

    const handleNewContext = async () => {
        if (!chart) return;

        const separator: ChatMessage = {
            id: `sys-${Date.now()}`,
            role: 'divider',
            content: '--- 上下文已重置 (Context Cleared) ---',
            timestamp: Date.now()
        };
        const newMsg: ChatMessage = {
            id: `sys-new-${Date.now()}`,
            role: 'assistant',
            content: '我已经准备好开始新的话题，请继续提问。',
            timestamp: Date.now() + 1
        };

        const updatedMessages = [...messages, separator, newMsg];
        setMessages(updatedMessages);
        setSuggestions([]);

        try {
            const starters = await generateStarterQuestions(chart);
            setSuggestions(starters);
            ChatStorageAPI.save(profileId, { messages: updatedMessages, suggestions: starters });
        } catch (e) {
            console.error(e);
            ChatStorageAPI.save(profileId, { messages: updatedMessages, suggestions: [] });
        }
    };

    if (!chart) return <div className="p-8 text-center text-slate-400">请先排盘以开始对话。</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-210px)] md:h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">天机问答</h3>
                        <p className="text-[10px] text-slate-500">基于 {chart.meta.solarDate} 八字推演</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleNewContext}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        title="清除上下文 (New Topic)"
                    >
                        <Eraser size={16} />
                    </button>
                    <button
                        onClick={handleClearHistory}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition"
                        title="清除所有记录 (Clear History)"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Area - Flex Grow to Fill */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.map((msg) => {
                    if (msg.role === 'divider') {
                        return (
                            <div key={msg.id} className="flex items-center justify-center my-4 opacity-50">
                                <div className="h-px bg-slate-300 w-16"></div>
                                <span className="text-[10px] text-slate-400 px-2">上下文已清除</span>
                                <div className="h-px bg-slate-300 w-16"></div>
                            </div>
                        );
                    }
                    return (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-600 text-white'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                }`}>
                                {msg.role === 'user' ? (
                                    msg.content
                                ) : (
                                    <SimpleMarkdown content={msg.content.split('---SUG.')[0]} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center mt-1 text-white">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Input - Fixed at Bottom */}
            <div className="bg-white p-4 border-t border-slate-100 shrink-0">
                {suggestions.length > 0 && !isLoading && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {suggestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(q)}
                                className="text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full border border-violet-100 hover:bg-violet-100 transition-colors animate-in fade-in slide-in-from-bottom-1"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                        placeholder="输入您想问的问题..."
                        disabled={isLoading}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
