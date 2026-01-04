import { GoogleGenAI } from "@google/genai";
import { BaziChart } from "../types";

// NOTE: In a real production app, never expose API keys on the client side like this.
// The user should supply this or it should be proxied.
// For this demo, we assume process.env.API_KEY is available or prompt user.

const getAIClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export const generateMicroInterpretation = async (
  apiKey: string,
  contextData: any,
  topic: string
): Promise<string> => {
  const ai = getAIClient(apiKey);

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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    return response.text || "Interpretation unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating interpretation. Please check your API Key.";
  }
};

export const generateFullReport = async (
  apiKey: string,
  chart: BaziChart
): Promise<string> => {
  const ai = getAIClient(apiKey);

  const prompt = `
        # Role Definition
        你是一名为“天机先生”的资深命理宗师。你精通子平八字法，熟读《三命通会》、《滴天髓》、《穷通宝鉴》。你的文笔古朴典雅与现代通俗并重，论命风格“理法兼备，重在根据五行流通提出改善建议”。
        
        # Task
        请根据提供的【八字数据 JSON】，为用户撰写一份《天机·人生全息推演报告》。
        
        # Input Data
        ${JSON.stringify({
    pillars: chart.pillars,
    meta: chart.meta,
    wuxing: chart.wuxing,
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    return response.text || "Report unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "生成报告时发生错误，请检查 API Key 是否正确。";
  }
};
