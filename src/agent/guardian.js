import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import config from "../config/keys";

const GEMINI_API_KEY = config.geminiApiKey;
const OPENROUTER_API_KEY = config.openRouterApiKey;
const OPENAI_API_KEY = config.openaiApiKey;

// Choose preferred provider: "openrouter", "openai", or "gemini"
const PREFERRED_PROVIDER = OPENROUTER_API_KEY ? "openrouter" : (OPENAI_API_KEY ? "openai" : "gemini");

console.log("SafePath Guardian: Using AI provider:", PREFERRED_PROVIDER);

// Initialize Gemini if needed
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// ─── Utility: Robust JSON Parser ───────────────────────────
const extractJSON = (text) => {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Look for JSON block between { and }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerE) {
        console.error("Outer JSON extract failed:", innerE);
      }
    }
    return null;
  }
};

// ─── AI Call Implementation ──────────────────────────────
const callAI = async (systemInstruction, userPrompt, jsonMode = false) => {
  // 1. Try OpenRouter (Primary if available)
  if (PREFERRED_PROVIDER === "openrouter") {
    try {
      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: "google/gemini-2.0-flash-001", // Fast and reliable
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined
      }, {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://safepathv2.web.app",
          "X-Title": "SafePath AI"
        },
        timeout: 10000
      });
      return response.data.choices[0].message.content;
    } catch (err) {
      console.error("OpenRouter Error:", err.response?.data || err.message);
      // Fallback to OpenAI if exists
      if (OPENAI_API_KEY) return callOpenAI(systemInstruction, userPrompt, jsonMode);
    }
  }

  // 2. Try OpenAI
  if (PREFERRED_PROVIDER === "openai" || (PREFERRED_PROVIDER === "openrouter" && OPENAI_API_KEY)) {
    return callOpenAI(systemInstruction, userPrompt, jsonMode);
  }

  // 3. Try Gemini (Native)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err) {
      console.error("Gemini Error:", err.message);
    }
  }

  throw new Error("No AI providers available or all failed.");
};

const callOpenAI = async (system, prompt, json) => {
  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      response_format: json ? { type: "json_object" } : undefined
    }, {
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
      timeout: 10000
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.message);
    throw err;
  }
};

// ─── Main Guardian Function ────────────────────────────────
export const analyzeFullSafetyContext = async (context) => {
  const {
    userLat, userLng, nearbyReports = [],
    batteryLevel = 100, isMoving = true, stationaryMinutes = 0,
    hour = new Date().getHours()
  } = context;

  const within300m = nearbyReports.filter(r => getDistance(userLat, userLng, r.lat, r.lng) <= 300);
  const isNight = hour >= 20 || hour < 6;

  // Local static fallbacks
  if (within300m.length > 0 && within300m.some(r => r.severity === 'high')) {
    return { status: "DANGER", message: "🤖 Emergency! High-risk alert very close. Move to a safe, crowded area immediately.", action: "warn" };
  }

  const systemInstruction = `You are SafePath Guardian — an autonomous AI safety agent protecting a user in India.
Analyze the context and respond with ONLY a valid JSON object:
{
  "status": "SAFE" | "CAUTION" | "DANGER",
  "message": "reassuring advice (max 15 words)",
  "action": "none" | "warn" | "reroute" | "checkin" | "sos"
}`;

  const userPrompt = `CONTEXT:
- Time: ${hour}:00 (${isNight ? 'Night' : 'Day'})
- Battery: ${batteryLevel}%
- Moving: ${isMoving ? 'Yes' : 'No'}
- Stationary: ${stationaryMinutes} mins
- Nearby Reports: ${nearbyReports.length}
- Within 300m: ${within300m.length}
- Categories: ${[...new Set(nearbyReports.map(r => r.category))].join(', ') || 'None'}`;

  try {
    const responseText = await callAI(systemInstruction, userPrompt, true);
    const parsed = extractJSON(responseText);

    if (parsed) {
      if (!parsed.message.startsWith('🤖')) parsed.message = `🤖 ${parsed.message}`;
      return {
        status: parsed.status || 'SAFE',
        message: parsed.message || '🤖 Monitoring your safety.',
        action: parsed.action || 'none'
      };
    }
  } catch (error) {
    console.error("Guardian analysis failed:", error);
  }

  // Final Intelligent Fallback
  return {
    status: within300m.length > 0 ? "CAUTION" : "SAFE",
    message: within300m.length > 0 ? `🤖 ${within300m.length} alerts nearby. Stay aware.` : "🤖 Guardian active. Safe travels.",
    action: "none"
  };
};

export const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const getGuardianChatResponse = async (history, message) => {
  const system = "You are SafePath Guardian, an elite AI safety assistant for women in India. Provide concise, actionable, and calm safety advice. Max 2 sentences.";
  try {
    // Format history for chat
    const chatPrompt = history.map(m => `${m.sender}: ${m.text}`).join("\n") + "\nuser: " + message;
    return await callAI(system, chatPrompt, false);
  } catch (error) {
    return "🤖 I'm having trouble connecting right now, but I'm still monitoring your location. Stay safe!";
  }
};
