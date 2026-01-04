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

const callOpenAI = async (messages: any[], temperature: number = 0.7): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Missing API Key. Please configure VITE_OPENAI_API_KEY in .env.local");
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
                messages: messages,
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
