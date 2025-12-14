// lib/ai-manager.ts
import { callGeminiAPI } from "./gemini";
import { callDeepSeekAPI } from "./deepseek";

export const callAI = async (
    prompt: string,
    systemInstruction = ""
): Promise<string> => {
    const provider = process.env.AI_PROVIDER || "gemini";

    console.log(`[AI-Manager] Routing request to: ${provider}`);

    if (provider.toLowerCase() === "deepseek") {
        return await callDeepSeekAPI(prompt, systemInstruction);
    } else {
        // Default to Gemini
        return await callGeminiAPI(prompt, systemInstruction);
    }
};
