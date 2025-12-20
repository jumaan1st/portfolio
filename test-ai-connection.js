const fs = require('fs');
const path = require('path');

// Robust Env Loader
const loadEnv = (filename) => {
    const envPath = path.resolve(__dirname, filename);
    if (!fs.existsSync(envPath)) return {};

    console.log(`Loading env from: ${filename}`);
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    // Handle CRLF, LF, etc.
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const idx = trimmed.indexOf('=');
        if (idx === -1) return;

        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();

        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }

        env[key] = val;
    });
    return env;
};

// Start
const env = loadEnv('.env.local');
const GEMINI_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const DEEPSEEK_KEY = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

console.log(`\n--- Config Check ---`);
console.log(`Gemini Key Found: ${!!GEMINI_KEY ? 'YES (' + GEMINI_KEY.slice(0, 4) + '...)' : 'NO'}`);
console.log(`DeepSeek Key Found: ${!!DEEPSEEK_KEY ? 'YES (' + DEEPSEEK_KEY.slice(0, 4) + '...)' : 'NO'}`);
console.log(`--------------------\n`);

async function testGemini() {
    if (!GEMINI_KEY) {
        console.log('SKIP: Gemini (No Key)');
        return;
    }
    console.log('Testing Gemini (gemini-1.5-flash)...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
        });

        if (!res.ok) {
            console.error(`Gemini Failed: ${res.status} ${await res.text()}`);
        } else {
            console.log('Gemini Success! HTTP 200');
        }
    } catch (e) {
        console.error('Gemini Exception:', e.message);
    }
}

async function testDeepSeek() {
    if (!DEEPSEEK_KEY) {
        console.log('SKIP: DeepSeek (No Key)');
        return;
    }
    console.log('\nTesting DeepSeek (deepseek-chat)...');
    const url = "https://api.deepseek.com/chat/completions";

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: "Hello" }],
                stream: false
            })
        });

        if (!res.ok) {
            console.error(`DeepSeek Failed: ${res.status} ${await res.text()}`);
        } else {
            const data = await res.json();
            console.log('DeepSeek Success! HTTP 200');
            console.log('Response:', data.choices?.[0]?.message?.content?.slice(0, 50));
        }
    } catch (e) {
        console.error('DeepSeek Exception:', e.message);
    }
}

async function run() {
    await testGemini();
    await testDeepSeek();
}

run();
