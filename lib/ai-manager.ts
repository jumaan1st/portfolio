import { callGeminiAPI } from "./gemini";
import { callDeepSeekAPI } from "./deepseek";
import { db } from "./db";
import { aiUsageLog } from "./schema";

export const callAIWithUsage = async (
    prompt: string,
    systemInstruction = "",
    userName?: string | null,
    userEmail?: string | null,
    actionType = "chat"
): Promise<{ text: string; promptTokens: number; completionTokens: number; totalTokens: number }> => {
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

    const providerName = provider.toLowerCase();
    let result: { text: string; promptTokens: number; completionTokens: number; totalTokens: number };

    console.log(`[AI-Manager] Routing request to: ${providerName}`);

    if (providerName === "deepseek") {
        result = await callDeepSeekAPI(prompt, systemInstruction);
    } else {
        result = await callGeminiAPI(prompt, systemInstruction);
    }

    // Log to DB
    try {
        await db.insert(aiUsageLog).values({
            user_name: userName || "Guest",
            user_email: userEmail || "unknown@guest.com",
            action_type: actionType,
            prompt_tokens: result.promptTokens,
            completion_tokens: result.completionTokens,
            total_tokens: result.totalTokens,
            provider: providerName,
        });
        console.log(`[AI-Manager] Logged AI token usage to DB (${result.totalTokens} tokens via ${providerName})`);
    } catch (e) {
        console.error("[AI-Manager] Error saving usage log to database:", e);
    }

    return result;
};

export const callAI = async (
    prompt: string,
    systemInstruction = ""
): Promise<string> => {
    const res = await callAIWithUsage(prompt, systemInstruction, "System", "system@portfolio.com", "system_task");
    return res.text;
};

