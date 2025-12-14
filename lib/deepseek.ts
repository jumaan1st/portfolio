// lib/deepseek.ts

export const callDeepSeekAPI = async (
    prompt: string,
    systemInstruction = ""
): Promise<string> => {
    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) return "Error: Missing DeepSeek API key.";

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
            return data.choices?.[0]?.message?.content || "No response generated.";

        } catch (err: unknown) {
            console.error(`DeepSeek Attempt ${attempt + 1} failed:`, err);
            attempt++;
            const errorMessage = err instanceof Error ? err.message : String(err);

            if (attempt >= maxRetries) {
                // Return friendly error for UI handling
                if (errorMessage.includes("Rate limit")) return "Error: 429 Rate limit exceeded.";
                return `Error: ${errorMessage}. Please try again later.`;
            }

            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
        }
    }
    return "Unknown error.";
};
