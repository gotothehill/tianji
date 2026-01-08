import type { BaziChart } from '@/models';

// Configuration
// In UniApp Vite, envs are exposed. Ensure VITE_OPENAI_API_KEY is set in .env
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_OPENAI_TIMEOUT_MS) || 120000;

interface OpenAIResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
    };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'divider';
    content: string;
    timestamp: number;
}

export interface ChatSession {
    messages: ChatMessage[];
    suggestions: string[];
    lastUpdated: number;
}

// --- Utils ---

const callOpenAI = async (
    messages: any[],
    temperature: number = 0.7,
    options: { maxTokens?: number } = {}
): Promise<string> => {
    // Check key
    if (!API_KEY) {
        // For demo purposes, if no key, return a mock response to avoid crashing
        console.warn("Missing API Key");
        return "请在 .env 文件中配置 VITE_OPENAI_API_KEY 以启用 AI 功能。";
    }

    const endpoint = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;

    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        console.log('[AI] request start', { endpoint, model: MODEL, timeout: REQUEST_TIMEOUT_MS });
        uni.request({
            url: endpoint,
            method: 'POST',
            timeout: REQUEST_TIMEOUT_MS,
            header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            data: {
                model: MODEL,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: temperature,
                ...(options.maxTokens ? { max_tokens: options.maxTokens } : {})
            },
            success: (res: any) => {
                const duration = Date.now() - startTime;
                const data = res.data as OpenAIResponse;
                if (res.statusCode !== 200) {
                    const errMsg = data?.error?.message;
                    console.error('[AI] request failed', {
                        statusCode: res.statusCode,
                        duration,
                        data
                    });
                    reject(new Error(errMsg ? `API Error: ${errMsg}` : `API Error: ${res.statusCode}`));
                    return;
                }
                if (data?.error?.message) {
                    console.error('[AI] request error payload', { duration, data });
                    reject(new Error(data.error.message));
                    return;
                }
                const reply = data.choices?.[0]?.message?.content || "No response.";
                console.log('[AI] request success', { duration });
                resolve(reply);
            },
            fail: (err) => {
                const duration = Date.now() - startTime;
                console.error('[AI] request error', { duration, err });
                const msg = err?.errMsg || err?.message || 'Network Error';
                reject(new Error(msg));
            }
        });
    });
};

// --- Storage ---

const CHAT_KEY_PREFIX = 'TJ_CHAT_MP_';

export const getChatSession = (profileId: string): ChatSession | null => {
    const raw = uni.getStorageSync(CHAT_KEY_PREFIX + profileId);
    if (!raw) return null;
    if (Array.isArray(raw)) {
        return { messages: raw, suggestions: [], lastUpdated: 0 };
    }
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.messages)) {
                return {
                    messages: parsed.messages,
                    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
                    lastUpdated: Number(parsed.lastUpdated) || 0
                };
            }
        } catch (e) {
            return null;
        }
    }
    if (raw && Array.isArray((raw as ChatSession).messages)) {
        const session = raw as ChatSession;
        return {
            messages: session.messages,
            suggestions: Array.isArray(session.suggestions) ? session.suggestions : [],
            lastUpdated: Number(session.lastUpdated) || 0
        };
    }
    return null;
};

export const saveChatSession = (profileId: string, session: { messages: ChatMessage[]; suggestions: string[] }) => {
    const payload: ChatSession = {
        messages: session.messages,
        suggestions: session.suggestions,
        lastUpdated: Date.now()
    };
    uni.setStorageSync(CHAT_KEY_PREFIX + profileId, payload);
};

export const clearChatSession = (profileId: string) => {
    uni.removeStorageSync(CHAT_KEY_PREFIX + profileId);
};

export const getChatHistory = (profileId: string): ChatMessage[] => {
    return getChatSession(profileId)?.messages || [];
};

export const saveChatHistory = (profileId: string, messages: ChatMessage[]) => {
    const existing = getChatSession(profileId);
    saveChatSession(profileId, { messages, suggestions: existing?.suggestions || [] });
};

export const clearChatHistory = (profileId: string) => {
    clearChatSession(profileId);
};

const extractEffectiveHistory = (history: ChatMessage[]) => {
    let start = 0;
    for (let i = history.length - 1; i >= 0; i -= 1) {
        if (history[i].role === 'divider') {
            start = i + 1;
            break;
        }
    }
    return history.slice(start).filter((m) => m.role !== 'divider');
};

const parseReplySuggestions = (text: string) => {
    const normalized = (text || '').replace(/\r/g, '');
    const markerRegex = /(^|\n)\s*(?:---\s*)?SUG[.:：]\s*(?=\n|$)/i;
    const match = markerRegex.exec(normalized);
    if (!match) {
        return { reply: normalized.trim(), suggestions: [] };
    }

    let reply = normalized.slice(0, match.index).trim();
    reply = reply.replace(/(?:\n\s*---\s*)+$/g, '').trim();

    const tail = normalized.slice(match.index + match[0].length).trim();
    const suggestions = tail
        .split(/\n+/)
        .map((line) => line.replace(/^\s*[-*•]?\s*\d*[\.\)]?\s*/, '').trim())
        .filter((line) => !!line)
        .slice(0, 4);

    return { reply, suggestions };
};

export const splitChatReply = (text: string) => parseReplySuggestions(text);

const decodeUtf8 = (input: ArrayBuffer | Uint8Array): string => {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let out = '';
    let i = 0;
    while (i < bytes.length) {
        const c = bytes[i++];
        if (c < 0x80) {
            out += String.fromCharCode(c);
            continue;
        }
        if (c < 0xE0) {
            const c2 = bytes[i++] & 0x3F;
            out += String.fromCharCode(((c & 0x1F) << 6) | c2);
            continue;
        }
        if (c < 0xF0) {
            const c2 = bytes[i++] & 0x3F;
            const c3 = bytes[i++] & 0x3F;
            out += String.fromCharCode(((c & 0x0F) << 12) | (c2 << 6) | c3);
            continue;
        }
        const c2 = bytes[i++] & 0x3F;
        const c3 = bytes[i++] & 0x3F;
        const c4 = bytes[i++] & 0x3F;
        let code = ((c & 0x07) << 18) | (c2 << 12) | (c3 << 6) | c4;
        code -= 0x10000;
        out += String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF));
    }
    return out;
};

// Daily Fortune Storage (per user/day)
const DAILY_KEY_PREFIX = 'TJ_DAILY_V2_';

export const DailyFortuneAPI = {
    save: async (signature: string, date: string, content: string): Promise<void> => {
        const key = `${DAILY_KEY_PREFIX}${signature}_${date}`;
        uni.setStorageSync(key, content);
    },
    get: async (signature: string, date: string): Promise<string | null> => {
        const key = `${DAILY_KEY_PREFIX}${signature}_${date}`;
        return uni.getStorageSync(key) || null;
    }
};

// --- Features ---

// 1. Simple Non-Streaming Chat
export const sendChatMessage = async (
    history: ChatMessage[],
    chart: BaziChart,
    question: string
): Promise<string> => {

    // System Prompt
    const systemPrompt = `
        Role: "Master TianJi", a professional Bazi astrologer.
        Context:
        - Day Master: ${chart.pillars.day.gan}
        - Month Branch: ${chart.pillars.month.zhi}
        - Wuxing Summary: ${chart.wuxing.summary}
        
        Task: Answer the user's question based on their chart. Be concise, professional, and encouraging.
        Output: Use Markdown. Add bullet points when helpful, and **bold** key phrases.
    `;

    // Build messages
    const effectiveHistory = extractEffectiveHistory(history);
    const messages = [
        { role: 'system', content: systemPrompt },
        ...effectiveHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: question }
    ];

    return callOpenAI(messages);
};

export const streamChatMessage = async (
    history: ChatMessage[],
    chart: BaziChart,
    question: string,
    onChunk: (chunk: string) => void
): Promise<{ fullReply: string; suggestions: string[] }> => {
    if (!API_KEY) {
        throw new Error('Missing API Key');
    }

    const systemPrompt = `
        Role: "Master TianJi", a professional Bazi astrologer.
        Context:
        - Day Master: ${chart.pillars.day.gan}
        - Month Branch: ${chart.pillars.month.zhi}
        - Wuxing Summary: ${chart.wuxing.summary}

        Task: Answer the user's question based on their chart. Be concise, professional, and encouraging.
        Output: Use Markdown. Add bullet points when helpful, and **bold** key phrases.
        After your answer, append a separator line "---SUG." and list 3 short follow-up questions.
        Format:
        [Answer content...]
        ---SUG.
        1. [Follow up Q1]
        2. [Follow up Q2]
        3. [Follow up Q3]
    `;

    const effectiveHistory = extractEffectiveHistory(history);
    const messages = [
        { role: 'system', content: systemPrompt },
        ...effectiveHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: question }
    ];

    const endpoint = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;

    return new Promise((resolve, reject) => {
        let fullText = '';
        let buffer = '';
        let finished = false;

        const finish = (text: string) => {
            if (finished) return;
            finished = true;
            const parsed = parseReplySuggestions(text);
            resolve({ fullReply: parsed.reply, suggestions: parsed.suggestions });
        };

        const decodeChunk = (data: any): string => {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (data instanceof ArrayBuffer) return decodeUtf8(data);
            if (data instanceof Uint8Array) return decodeUtf8(data);
            if (data?.data instanceof ArrayBuffer) return decodeUtf8(data.data);
            if (data?.data instanceof Uint8Array) return decodeUtf8(data.data);
            try {
                if (typeof TextDecoder !== 'undefined' && data) {
                    return new TextDecoder('utf-8').decode(data as ArrayBuffer);
                }
            } catch (e) {
                // ignore
            }
            return '';
        };

        const handleText = (chunk: string) => {
            if (!chunk) return;
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed === 'data: [DONE]') {
                    finish(fullText);
                    return;
                }
                if (!trimmed.startsWith('data:')) continue;
                const data = trimmed.replace(/^data:\s*/, '');
                try {
                    const json = JSON.parse(data);
                    const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
                    if (delta) {
                        fullText += delta;
                        onChunk(delta);
                    }
                } catch (e) {
                    // ignore
                }
            }
        };

        const task: any = uni.request({
            url: endpoint,
            method: 'POST',
            timeout: REQUEST_TIMEOUT_MS,
            enableChunked: true,
            dataType: 'text',
            responseType: 'arraybuffer',
            header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            data: {
                model: MODEL,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: 0.7,
                stream: true
            },
            success: (res: any) => {
                const data: any = res.data;
                if (res.statusCode !== 200) {
                    const errMsg = data?.error?.message;
                    reject(new Error(errMsg ? `API Error: ${errMsg}` : `API Error: ${res.statusCode}`));
                    return;
                }
                if (data?.error?.message) {
                    reject(new Error(data.error.message));
                    return;
                }
                if (typeof data === 'string' || data instanceof ArrayBuffer) {
                    handleText(decodeChunk(data));
                } else if (!fullText) {
                    const reply = data?.choices?.[0]?.message?.content || '';
                    if (reply) {
                        fullText = reply;
                        onChunk(reply);
                    }
                }
                finish(fullText);
            },
            fail: (err) => {
                const msg = err?.errMsg || err?.message || 'Network Error';
                if (!finished) reject(new Error(msg));
            }
        });

        if (task && typeof task.onChunkReceived === 'function') {
            task.onChunkReceived((res: any) => {
                const text = decodeChunk(res?.data ?? res);
                handleText(text);
            });
        } else {
            try {
                if (task && typeof task.abort === 'function') task.abort();
            } catch (e) {
                // ignore
            }
            callOpenAI(messages, 0.7)
                .then((reply) => {
                    if (!reply) {
                        finish(fullText);
                        return;
                    }
                    const step = 12;
                    let idx = 0;
                    const timer = setInterval(() => {
                        const part = reply.slice(idx, idx + step);
                        if (part) {
                            fullText += part;
                            onChunk(part);
                        }
                        idx += step;
                        if (idx >= reply.length) {
                            clearInterval(timer);
                            finish(fullText);
                        }
                    }, 30);
                })
                .catch((err) => reject(err));
        }
    });
};
// 2. Daily Guide (Ported)
export const generateDailyGuide = async (
    chart: BaziChart,
    dateContext: any
): Promise<string> => {
    const prompt = `
        # Role Definition
        你是“天机先生”，擅长结合八字与当日干支给出简明实用的日运建议。

        # Task
        根据【用户八字】与【今日历法数据】输出《每日运势指南》。

        # Input Data
        【日主】${chart.pillars.day.gan}
        【今日干支】${dateContext.ganZhiYear}年 ${dateContext.ganZhiMonth}月 ${dateContext.ganZhiDay}日
        【今日神煞】${(dateContext.jiShen || []).join('、')}
        【今日五行】${dateContext.naYin || '未知'}

        # Output Rules
        - **今日一言**：一句话概括今日能量
        - **财运方位**：今日利财方向/行动
        - **事业机缘**：工作/决策建议
        - **情感人际**：情感/社交建议
        - **避险指南**：今日忌讳与规避
        - **天机锦囊**：幸运色/数字/行动

        要求：简洁、明确、全中文输出，使用 Markdown 列表格式。
    `;

    return callOpenAI([{ role: 'system', content: "Expert Astrologer" }, { role: 'user', content: prompt }]);
};

// 3. Full Life Book Report
export const generateFullReport = async (chart: BaziChart): Promise<string> => {
    const chartContext = JSON.stringify({
        pillars: chart.pillars,
        meta: chart.meta,
        wuxing: {
            summary: chart.wuxing.summary,
            details: chart.wuxing.details
        },
        firstDaYun: chart.daYun[0],
    });

    const sections = [
        {
            title: '\u7b2c\u4e00\u7ae0\uff1a\u547d\u5c40\u603b\u8bc4',
            focus: 'Analyze day master strength, overall structure, and favored elements. Include one classical quote.'
        },
        {
            title: '\u7b2c\u4e8c\u7ae0\uff1a\u6027\u683c\u5256\u6790',
            focus: 'Discuss explicit traits and hidden tendencies based on five elements and ten gods.'
        },
        {
            title: '\u7b2c\u4e09\u7ae0\uff1a\u4e8b\u4e1a\u4e0e\u8d22\u5bcc',
            focus: 'Provide suitable industries, career path, and wealth patterns with practical guidance.'
        },
        {
            title: '\u7b2c\u56db\u7ae0\uff1a\u60c5\u611f\u4e0e\u5a5a\u59fb',
            focus: 'Analyze spouse palace, relationship tendencies, and family dynamics with cautions.'
        },
        {
            title: '\u7b2c\u4e94\u7ae0\uff1a\u5927\u8fd0\u6d41\u5e74\u63a8\u6f14',
            focus: 'Focus on current major cycle and the next 3 years. Highlight opportunities and risks.'
        },
        {
            title: '\u7b2c\u516d\u7ae0\uff1a\u5929\u673a\u9020\u547d\u5efa\u8bae',
            focus: 'Give actionable improvement tips: colors, directions, habits, and daily practices.'
        }
    ];

    const reportParts: string[] = [];
    for (let i = 0; i < sections.length; i += 1) {
        const section = sections[i];
        console.log('[AI] full report section start', { index: i + 1, title: section.title });
        const prompt = `
Role: You are "Master TianJi", a professional Bazi astrologer.
Task: Write only the specified section of the report "\u5929\u673a\u00b7\u4eba\u751f\u5168\u606f\u63a8\u6f14\u62a5\u544a".

Input Data (JSON):
${chartContext}

Section Title: ${section.title}
Section Focus: ${section.focus}

Rules:
1. Output Simplified Chinese only.
2. Start with "## ${section.title}".
3. 350-500 Chinese characters.
4. Add 2-4 bullet points after the main paragraph (use markdown list "- " ).
5. Use **bold** to emphasize 1-2 key phrases.
6. Be practical and objective; avoid fatalism or fear.
7. End with two lines:
   - "\u5929\u673a\u8bc4\u5206\uff1aX\u661f" (X is 1-5)
   - "\u5929\u673a\u5224\u8bed\uff1a" plus a concise classical-style sentence.
`;
        try {
            const content = await callOpenAI(
                [
                    { role: 'system', content: 'You are "Master TianJi", a profound Bazi astrologer.' },
                    { role: 'user', content: prompt }
                ],
                0.7,
                { maxTokens: 900 }
            );
            reportParts.push(content.trim());
            console.log('[AI] full report section done', { index: i + 1, length: content?.length || 0 });
        } catch (error) {
            console.error('[AI] full report section failed', { index: i + 1, title: section.title, error });
            throw error;
        }
    }

    return reportParts.join('\n\n');
};
// 4. Synastry Report
export const generateSynastryReport = async (
    chartA: BaziChart,
    chartB: BaziChart,
    relationType: string = 'couple'
): Promise<string> => {
    const prompt = `
        # Role
        你是“天机先生”，擅长八字合盘。

        # Task
        分析两个人的八字匹配度（${relationType === 'couple' ? '男女情感' : '商业合作'}），输出《天机·双人合盘推演报告》。

        # Input
        甲方：${JSON.stringify({ dayMaster: chartA.pillars.day.gan, dayBranch: chartA.pillars.day.zhi, wuxing: chartA.wuxing.details })}
        乙方：${JSON.stringify({ dayMaster: chartB.pillars.day.gan, dayBranch: chartB.pillars.day.zhi, wuxing: chartB.wuxing.details })}

        # Output Structure
        1. 缘分契合度（0-100分，分析天干五合/地支六合/三合）
        2. 性格互补性（是否互补，喜用神是否互补）
        3. 相处模式预判（刑冲破害点，可能摩擦）
        4. 未来关系趋势（3-5年大致走向）
        5. 天机锦囊（具体相处建议）

        语气理性、客观，避免绝对化。
        # Format
        - Use Markdown headings (##) for each section.
        - Use bullet lists for key points.
        - Use **bold** to emphasize keywords and scores.
    `;

    return callOpenAI([
        { role: 'system', content: 'You are "Master TianJi", expert in Bazi synastry.' },
        { role: 'user', content: prompt }
    ], 0.8);
};


// 5. Starter Questions
export const generateStarterQuestions = async (chart: BaziChart): Promise<string[]> => {
    const prompt = `
        Context: User's Bazi chart details.
        Day Master: ${chart.pillars.day.gan}
        Month Branch: ${chart.pillars.month.zhi}
        Year Pillar: ${chart.pillars.year.gan}${chart.pillars.year.zhi}
        Strength: ${chart.wuxing.summary}

        Task: Generate 3-5 short, specific questions that the user might ask a fortune teller.
        Requirements:
        1. Output in SIMPLIFIED CHINESE.
        2. Return ONLY a valid JSON array of strings.
        3. Each question under 15 words.
    `;

    try {
        const result = await callOpenAI([{ role: 'user', content: prompt }], 0.7, { maxTokens: 200 });
        const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // ignore
    }

    return [
        '我今年的财运如何？',
        '适合往哪个方向发展？',
        '今年事业有哪些机会？'
    ];
};
