import { BaziChart } from '../types';

// Configuration from .env.local
// Note: In Vite, variables must start with VITE_ to be exposed to client
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';

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

// --- Specific Storage APIs ---

// 1. Daily Fortune Storage
export const DailyFortuneAPI = {
    save: async (signature: string, date: string, content: string): Promise<void> => {
        return new Promise((resolve) => {
            const key = `TJ_DAILY_V2_${signature}_${date}`;
            localStorage.setItem(key, content);
            resolve();
        });
    },
    get: async (signature: string, date: string): Promise<string | null> => {
        return new Promise((resolve) => {
            const key = `TJ_DAILY_V2_${signature}_${date}`;
            resolve(localStorage.getItem(key));
        });
    }
};

// 2. Chat History Storage
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'divider'; // 'divider' for Context Clear
    content: string;
    timestamp: number;
}

export interface ChatSession {
    messages: ChatMessage[];
    suggestions: string[];
    lastUpdated: number;
}

export const ChatStorageAPI = {
    save: async (profileId: string, session: { messages: ChatMessage[], suggestions: string[] }): Promise<void> => {
        return new Promise((resolve) => {
            const key = `TJ_CHAT_V1_${profileId}`;
            const data: ChatSession = {
                messages: session.messages,
                suggestions: session.suggestions,
                lastUpdated: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            resolve();
        });
    },
    get: async (profileId: string): Promise<ChatSession | null> => {
        return new Promise((resolve) => {
            const key = `TJ_CHAT_V1_${profileId}`;
            const raw = localStorage.getItem(key);
            if (!raw) {
                resolve(null);
                return;
            }
            try {
                const parsed = JSON.parse(raw);
                // Schema Migration: Handle legacy array format
                if (Array.isArray(parsed)) {
                    resolve({
                        messages: parsed,
                        suggestions: [], // Legacy has no persisted suggestions
                        lastUpdated: 0
                    });
                } else {
                    resolve(parsed as ChatSession);
                }
            } catch (e) {
                resolve(null);
            }
        });
    },
    clear: async (profileId: string): Promise<void> => {
        return new Promise((resolve) => {
            const key = `TJ_CHAT_V1_${profileId}`;
            localStorage.removeItem(key);
            resolve();
        });
    }
};

// --- AI Utils ---

const callOpenAI = async (messages: any[], temperature: number = 0.7): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Missing API Key. Please configure VITE_OPENAI_API_KEY in .env.local");
    }

    // Support Context Clearing in regular calls too
    let effectiveMessages = messages;
    const lastDividerIdx = messages.findLastIndex((m: any) => m.role === 'divider');
    if (lastDividerIdx !== -1) {
        effectiveMessages = messages.slice(lastDividerIdx + 1);
    }

    const endpoint = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: effectiveMessages.map(m => ({ role: m.role, content: m.content })),
                temperature: temperature,
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API Error: ${response.statusText}`);
        }

        const data: OpenAIResponse = await response.json();
        return data.choices?.[0]?.message?.content || "No response generated.";
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

// --- Streaming Support ---
const textDecoder = new TextDecoder("utf-8");

export const streamChatWithTianJi = async (
    history: ChatMessage[],
    chart: BaziChart,
    onChunk: (chunk: string) => void
): Promise<{ fullReply: string, suggestions: string[] }> => {

    // 1. Prepare Context & Divider Logic
    let effectiveHistory = history;
    const lastDividerIdx = history.findLastIndex(m => m.role === 'divider');
    if (lastDividerIdx !== -1) {
        effectiveHistory = history.slice(lastDividerIdx + 1);
    }

    // 2. System Prompt
    const systemPrompt = `
        # Role
        你即是“天机先生”——一位博古通今的命理宗师。你的回答应基于用户提供的八字命盘信息。

        # User's Bazi Context
        - 日元: ${chart.pillars.day.gan}
        - 月令: ${chart.pillars.month.zhi}
        - 整体旺衰: ${chart.wuxing.summary}
        - 喜用神: ${chart.wuxing.details?.yongShen || '需推导'}
        
        # Output Requirement
        1. Answer the user's question professionally, referring to their specific chart elements.
        2. Keep the advice practical and encouraging.
        3. AFTER your reply, use the separator "---SUG." and list 3 short follow-up questions.

        Format:
        [Answer Content...]
        ---SUG.
        1. [Follow up Q1]
        2. [Follow up Q2]
        3. [Follow up Q3]
    `;

    // Limit context to 6 turns (12 messages) to save tokens
    const contextMessages = effectiveHistory.slice(-12);

    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    // 3. Setup Stream
    if (!API_KEY) throw new Error("Missing API Key");
    const endpoint = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: apiMessages,
            temperature: 0.7,
            stream: true, // Enable streaming
        })
    });

    if (!response.ok || !response.body) throw new Error("Stream API Error");

    const reader = response.body.getReader();
    let fullText = "";
    let buffer = "";

    // 4. Read Loop
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += textDecoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || ""; // Keep incomplete line

            for (const line of lines) {
                const trimmed = line.trim();
                // Handle different OpenAI stream formats (sometimes data: { ... })
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(line.slice(6));
                    const content = json.choices[0]?.delta?.content || "";

                    fullText += content;

                    // Allow raw stream. UI handles the hiding of suggestions.
                    onChunk(content);

                } catch (e) { /* ignore partial json */ }
            }
        }
    } catch (e) {
        console.error("Stream reader error", e);
    }

    // 5. Post-Processing
    const parts = fullText.split('---SUG.');
    const reply = parts[0].trim();
    let suggestions: string[] = [];
    if (parts.length > 1) {
        suggestions = parts[1].trim().split('\n')
            .map(s => s.replace(/^\d+\.\s*/, '').trim())
            .filter(s => s.length > 0)
            .slice(0, 3);
    }

    if (suggestions.length === 0) {
        // Fallback suggestions
        suggestions = ["还能告诉我什么？", "未来三个月的运势？", "有什么化解建议？"];
    }

    return { fullReply: reply, suggestions };
};

// --- Report Functions (Retained) ---

export const generateMicroInterpretation = async (
    contextData: any,
    topic: string
): Promise<string> => {
    const prompt = `
    Role: Professional Bazi (Four Pillars) Astrologer "TianJi".
    Task: Interpret the following specific data point for a user.
    Topic: ${topic}
    Data: ${JSON.stringify(contextData)}
    
    Requirements:
    1. Concise (under 100 words).
    2. Professional but easy to understand.
    3. Focus on the implication of this specific data.
    4. Output in SIMPLIFIED CHINESE only.
  `;

    return callOpenAI([
        { role: 'system', content: 'You are a professional Bazi Astrologer.' },
        { role: 'user', content: prompt }
    ]);
};

export const generateFullReport = async (
    chart: BaziChart
): Promise<string> => {
    const prompt = `
        # Role Definition
        你是一名为“天机先生”的资深命理宗师。你精通子平八字法，熟读《三命通会》、《滴天髓》、《穷通宝鉴》。你的文笔古朴典雅与现代通俗并重，论命风格“理法兼备，重在根据五行流通提出改善建议”。
        
        # Task
        请根据提供的【八字数据 JSON】，为用户撰写一份《天机·人生全息推演报告》。
        
        # Input Data
        ${JSON.stringify({
        pillars: chart.pillars,
        meta: chart.meta,
        wuxing: {
            summary: chart.wuxing.summary,
            details: chart.wuxing.details
        },
        firstDaYun: chart.daYun[0],
    })}
        
        # Output Rules (Must Follow)
        1.  **结构要求**：必须输出为标准的 Markdown 格式，包含以下章节：
            -   **第一章：命局总评** (分析日元强弱、定格局、取用神，必须引用一句古籍原文印证)
            -   **第二章：性格剖析** (基于五行和十神心性，分析显性性格与隐性心理)
            -   **第三章：事业与财运** (分析适合行业、正财/偏财运势、人生财富高点)
            -   **第四章：情感与六亲** (分析配偶宫状态、桃花情况、与父母子女缘分)
            -   **第五章：大运流年推演** (重点分析当前大运及未来 3 年的吉凶趋势)
            -   **第六章：天机造命建议** (给出五行补救颜色、方位、行为建议)
        
        2.  **内容深度要求**：
            -   **严禁**只会说“你五行缺水”，必须分析“缺水导致的流通阻滞后果”。
            -   **严禁**宿命论恐吓。遇到凶象（如“七杀攻身”），必须给出“修身养性”或“职业化解”的方案。
            -   **特色化**：在每个章节结尾，给出一个【天机评分】（1-5星）和一句【天机判词】（类似古诗）。
        
        3.  **Tone of Voice**：
            -   专业、客观、不卑不亢。
            -   解释专业术语（如“伤官见官”）时，用现代职场或生活场景做比喻。
  `;

    return callOpenAI([
        { role: 'system', content: 'You are "Master TianJi" (天机先生), a profound scholar of Bazi.' },
        { role: 'user', content: prompt }
    ], 0.8);
};

export const generateSynastryReport = async (
    chartA: BaziChart,
    chartB: BaziChart,
    relationType: string = 'couple' // 'couple' | 'partner'
): Promise<string> => {
    const prompt = `
        # Role Definition
        你是一名为“天机先生”的资深命理宗师，精通《三命通会》与《子平真诠》，擅长分析两人关系的“合婚/合伙”匹配度。
        
        # Task
        请分析以下两个八字命盘的匹配程度（${relationType === 'couple' ? '男女婚恋' : '商业合伙'}），并输出《天机·双人合盘推演报告》。
        
        # Input Data
        【甲方】：${JSON.stringify({ dayMaster: chartA.pillars.day.gan, dayBranch: chartA.pillars.day.zhi, wuxing: chartA.wuxing.details })}
        【乙方】：${JSON.stringify({ dayMaster: chartB.pillars.day.gan, dayBranch: chartB.pillars.day.zhi, wuxing: chartB.wuxing.details })}
        (注意：以日柱为核心，兼看年柱与整体五行气势)
        
        # Output Rules
        1.  **章节结构**：
            -   **第一章：缘分契合度** (天干五合、地支六合/三合分析，给出一个 0-100 的匹配分数)
            -   **第二章：性格互补性** (分析双方日元强弱互补、五行喜用神是否互补)
            -   **第三章：相处模式预判** (是“相爱相杀”还是“举案齐眉”？分析夫妻宫/日支的刑冲破害)
            -   **第四章：未来关系趋势** (未来 3-5 年双方运势同步性简评)
            -   **第五章：天机锦囊** (针对两人关系的具体的相处建议)
        
        2.  **风格要求**：
            -   文风客观、理性，既指出契合点，也直言潜在冲突。
            -   严禁绝对化（如“必离婚”），应使用概率性语言（如“易生口角”）。
  `;

    return callOpenAI([
        { role: 'system', content: 'You are "Master TianJi", expert in Bazi Synastry.' },
        { role: 'user', content: prompt }
    ], 0.8);
};

export const generateDailyGuide = async (
    chart: BaziChart,
    dateContext: any
): Promise<string> => {
    const prompt = `
        # Role Definition
        你是一名为“天机先生”的资深命理宗师。你擅长使用“流日断法”，结合用户的八字命局与当日的干支、神煞、五行气场，给出精准的每日行动指南。

        # Task
        请根据【用户八字】与【今日历法数据】，撰写一份《天机·每日流年运势指南》。

        # Input Data
        【用户日柱】：${chart.pillars.day.gan}${chart.pillars.day.zhi} (日元: ${chart.pillars.day.gan})
        【用户喜用】：${JSON.stringify(chart.wuxing.summary.likes || '未知')}
        【今日干支】：${dateContext.ganZhiYear}年 ${dateContext.ganZhiMonth}月 ${dateContext.ganZhiDay}日
        【今日农历】：${dateContext.cnMonth}月${dateContext.cnDay}
        【今日神煞】：${(dateContext.jiShen || []).join(',')}
        【今日五行】：${dateContext.naYin || '未知'}

        # Output Rules
        1. **结构要求**：请直接输出 Markdown，包含以下简短板块：
           - **今日运势·一言诀** (一句诗或成语概括今日运势核心)
           - **💰 财运方位** (结合日元与今日干支，指出今日利财的方位及行业/活动建议)
           - **💼 事业机缘** (今日工作运势，贵人方位，适合做什么决策)
           - **❤️ 情感人际** (桃花运势或社交建议)
           - **🛡️ 避险指南** (基于今日冲煞 ${dateContext.chong || '无'}，给出避雷建议)
           - **💡 天机锦囊** (今日幸运色、幸运数字、首选开运活动)

        2. **Tone of Voice**:
           - 亲切、笃定、实用。
           - 避免模棱两可，给出具体的建议（如“宜穿红色上衣”，“宜向正南谈合作”）。
    `;

    return callOpenAI([
        { role: 'system', content: 'You are "Master TianJi", creating a daily fortune guide.' },
        { role: 'user', content: prompt }
    ], 0.7);
};

export const generateStarterQuestions = async (chart: BaziChart): Promise<string[]> => {
    const prompt = `
        Context: User's Bazi Chart details:
        Day Master: ${chart.pillars.day.gan}
        Month Branch: ${chart.pillars.month.zhi}
        Year Pillar: ${chart.pillars.year.gan}${chart.pillars.year.zhi}
        Strong/Weak: ${chart.wuxing.summary}

        Task: Generate 3 short, specific questions (under 15 words) that this user might want to ask a fortune teller based on their chart structure.
        Examples: "我今年的财运如何？", "适合往哪个方向发展？", "我的正缘什么时候出现？"
        
        Output Rule: Return ONLY a valid JSON array of strings. Do not add markdown code blocks.
    `;

    try {
        const result = await callOpenAI([{ role: 'user', content: prompt }], 0.7);
        // Clean cleanup
        const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        return ["我今年的财运如何？", "我的事业运势怎样？", "命中注定的另一半特征？"];
    }
};

export const chatWithTianJi = async (
    history: { role: 'user' | 'assistant', content: string }[],
    chart: BaziChart
) => {
    return { reply: "[Please use streamChatWithTianJi]", suggestions: [] };
};
