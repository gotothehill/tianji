import { GoogleGenAI } from "@google/genai";
import { BaziChart } from "../types";

// NOTE: In a real production app, never expose API keys on the client side like this.
// The user should supply this or it should be proxied.
// For this demo, we assume process.env.API_KEY is available or prompt user.
// Since we can't use process.env in this strict frontend build easily without vite config,
// we will look for a key in localStorage or let the UI prompt for it.

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
      model: 'gemini-3-flash-preview',
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
    You are "Master TianJi" (天机先生), a profound scholar of Bazi (Four Pillars of Destiny). You combine the classics (Di Tian Sui, San Ming Tong Hui) with modern psychological advice.

    # Input Data
    ${JSON.stringify({
      pillars: chart.pillars,
      meta: chart.meta,
      wuxing: chart.wuxing,
      firstDaYun: chart.daYun[0], // Only sending first for brevity in context
    })}

    # Output Rules
    1. Language: MUST BE SIMPLIFIED CHINESE (简体中文).
    2. Structure the response in Markdown.
    3. Chapter 1: 命局总评 (General Analysis - Strength, Pattern, Useful God).
    4. Chapter 2: 性格剖析 (Personality & Character).
    5. Chapter 3: 事业财运 (Career & Wealth).
    6. Chapter 4: 情感婚姻 (Love & Relationships).
    7. Chapter 5: 当下运程 (Current Decade Trend).
    8. Chapter 6: 天机建议 (Suggestions - Colors, Directions).
    
    Tone: Mystical, authoritative, compassionate (古朴典雅与现代通俗并重).
    Format: Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Use Pro for complex reasoning
      contents: prompt,
    });
    return response.text || "Report unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "生成报告时发生错误，请检查 API Key 是否正确。";
  }
};
