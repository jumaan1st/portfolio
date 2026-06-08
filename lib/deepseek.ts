// lib/deepseek.ts

export const callDeepSeekAPI = async (
    prompt: string,
    systemInstruction = ""
): Promise<{ text: string; promptTokens: number; completionTokens: number; totalTokens: number }> => {
    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) return { text: "Error: Missing DeepSeek API key.", promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    const url = "https://api.deepseek.com/chat/completions";

    const payload = {
        model: "deepseek-chat",
        messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
        ],
        stream: false
    };

    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                if (res.status === 429) throw new Error("Rate limit exceeded");
                const errText = await res.text();
                throw new Error(`API Error: ${res.status} - ${errText}`);
            }

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || "No response generated.";
            const usage = data.usage || {};
            const promptTokens = usage.prompt_tokens || 0;
            const completionTokens = usage.completion_tokens || 0;
            const totalTokens = usage.total_tokens || 0;

            return { text, promptTokens, completionTokens, totalTokens };

        } catch (err: unknown) {
            console.error(`DeepSeek Attempt ${attempt + 1} failed:`, err);
            attempt++;
            const errorMessage = err instanceof Error ? err.message : String(err);

            if (attempt >= maxRetries) {
                // Return friendly error for UI handling
                if (errorMessage.includes("Rate limit")) return { text: "Error: 429 Rate limit exceeded.", promptTokens: 0, completionTokens: 0, totalTokens: 0 };
                return { text: `Error: ${errorMessage}. Please try again later.`, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
            }

            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
        }
    }
    return { text: "Unknown error.", promptTokens: 0, completionTokens: 0, totalTokens: 0 };
};

