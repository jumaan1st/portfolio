
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const cleanKey = key.replace('export ', '').trim();
            const cleanValue = value.trim().replace(/^["']|["']$/g, '');
            process.env[cleanKey] = cleanValue;
        }
    });
}

// Mock fetch for demonstration if needed, but we want real connection test.
// We need to support TS imports if running via ts-node, but here we are in JS land.
// So we will just implement a simple test using the same logic as the lib files to verify KEYS and ENDPOINTS.

async function testDeepSeek() {
    console.log("\n--- TESTING DEEPSEEK ---");
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        console.error("❌ Skipped: DEEPSEEK_API_KEY not found.");
        return;
    }

    const url = "https://api.deepseek.com/chat/completions";
    console.log("Endpoint:", url);
    console.log("Key Length:", apiKey.length);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: "Say 'DeepSeek is working' in 3 words." }],
                stream: false
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Status ${res.status}: ${txt}`);
        }

        const data = await res.json();
        console.log("✅ Success! Response:", data.choices[0].message.content);

    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

async function testGemini() {
    console.log("\n--- TESTING GEMINI ---");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ Skipped: GEMINI_API_KEY not found.");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say 'Gemini is working' in 3 words." }] }]
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Status ${res.status}: ${txt}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("✅ Success! Response:", text);

    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

(async () => {
    console.log("Current AI_PROVIDER env var:", process.env.AI_PROVIDER);
    await testDeepSeek();
    await testGemini();
})();
