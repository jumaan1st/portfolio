// lib/ai-manager.ts
import { callGeminiAPI } from "./gemini";
import { callDeepSeekAPI } from "./deepseek";

export const callAI = async (
    prompt: string,
    systemInstruction = ""
): Promise<string> => {
    // Smart Provider Selection
    let provider = process.env.AI_PROVIDER;

    // If no provider set, auto-detect based on available keys
    if (!provider) {
        if (process.env.DEEPSEEK_API_KEY && !process.env.GEMINI_API_KEY) {
            provider = "deepseek";
        } else {
            provider = "gemini"; // Default
        }
    }

    console.log(`[AI-Manager] Routing request to: ${provider}`);

    if (provider.toLowerCase() === "deepseek") {
        return await callDeepSeekAPI(prompt, systemInstruction);
    } else {
        // Default to Gemini
        return await callGeminiAPI(prompt, systemInstruction);
    }
};
