// lib/gemini.ts
export const callGeminiAPI = async (
    prompt: string,
    systemInstruction = ""
): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return "Error: Missing Gemini API key.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
    };

    const maxRetries = 5;
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                if (res.status === 429) throw new Error("Rate limit exceeded");
                throw new Error(`API Error: ${res.status}`);
            }

            const data = await res.json();
            return (
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                "No response generated."
            );
        } catch (err: unknown) {
            attempt++;
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (attempt >= maxRetries)
                return `Error: ${errorMessage}. Please try again later.`;
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
        }
    }
    return "Unknown error.";
};
