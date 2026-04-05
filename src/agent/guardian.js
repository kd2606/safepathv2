import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = "You are SafePath Guardian, an elite AI safety assistant protecting a woman navigating an Indian city. Based on the number of nearby danger reports provided, generate a hyper-specific, reassuring, and actionable safety instruction. Strictly keep it under 12 words. No markdown, just pure text.";

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
});

export const analyzeSafetyContext = async (nearbyReportsCount) => {
  if (!apiKey) {
    // Smart fallback when no API key is configured (e.g. Vercel without env var)
    if (nearbyReportsCount === 0) return "🤖 Area clear. Stay aware and trust your instincts.";
    if (nearbyReportsCount <= 3) return `🤖 ${nearbyReportsCount} alert nearby. Stay on busy, well-lit streets.`;
    return `🤖 ${nearbyReportsCount} alerts nearby. Stay on main roads and keep moving.`;
  }

  try {
    const prompt = `There are ${nearbyReportsCount} nearby danger reports.`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (!text.startsWith("🤖")) {
      text = `🤖 ${text}`;
    }
    return text;
  } catch (error) {
    console.error("Error analyzing safety context:", error);
    return "🤖 Guardian active. Stay alert on your route.";
  }
};
