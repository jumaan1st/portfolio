
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
You are a helpful Portfolio Assistant. 
The user will provide text describing a project or a blog post.
You must extract or generate the following JSON structure:

For a Project:
{
  "type": "project",
  "title": "Project Title",
  "category": "Web App/Mobile App/etc",
  "tech": ["React", "Node.js", ...],
  "description": "Short summary...",
  "longDescription": "longer detailed description...",
  "features": ["Feature 1", "Feature 2"],
  "link": "#",
  "color": "from-blue-500 to-cyan-500"
}

For a Blog:
{
  "type": "blog",
  "title": "Blog Title",
  "excerpt": "Short excerpt...",
  "content": "Full markdown content...",
  "tags": ["tag1", "tag2"]
}

Return ONLY raw JSON. No markdown formatting.
`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Frontend sends 'prompt' and 'type', but previous code used 'text'. Handle both.
        const userPrompt = body.prompt || body.text;
        const { type } = body;

        console.log(`AI Request: Type=${type}, Length=${userPrompt?.length}`);

        const provider = process.env.AI_PROVIDER || 'gemini';
        let apiKey = process.env.AI_API_KEY; // Fallback

        if (provider === 'gemini') {
            apiKey = process.env.GEMINI_API_KEY || apiKey;
        } else if (provider === 'deepseek') {
            apiKey = process.env.DEEPSEEK_API_KEY || apiKey;
        }

        if (!apiKey) {
            console.error(`AI Key missing for provider ${provider}`);
            return NextResponse.json({ error: `${provider} API Key is not configured` }, { status: 500 });
        }

        let finalSystemPrompt = SYSTEM_PROMPT;
        if (type === 'resume') {
            finalSystemPrompt = `
            You are an expert resume parser. Extract information from the following resume text and format it into a strictly valid JSON object matching this TypeScript interface:

            interface PortfolioData {
                profile: {
                    name: string;
                    currentRole: string; // e.g. "Senior Frontend Engineer"
                    currentCompany: string; // e.g. "Google"
                    summary: string; // A punchy 2-3 sentence summary
                    location: string;
                    email: string;
                    phone: string;
                    linkedin: string;
                    github: string;
                };
                skills: { name: string; icon: string }[]; // Use 'devicon-[name]-plain' or 'devicon-[name]-original' for icon classes. Try to find the best match.
                experience: { role: string; company: string; period: string; description: string }[];
                education: { degree: string; school: string; year: string; grade: string }[];
            }

            RESUME TEXT:
            ${userPrompt}

            Return ONLY the raw JSON object. No markdown formatting, no code fences.
            `;
        } else {
            finalSystemPrompt = SYSTEM_PROMPT + "\n\nUser Input:\n" + userPrompt;
        }

        let generatedText = "";

        if (provider === 'gemini') {
            // Updated model to gemini-1.5-flash for better performance/cost if available, fallback to pro
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: finalSystemPrompt }] }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        } else if (provider === 'deepseek') {
            const url = 'https://api.deepseek.com/v1/chat/completions';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." }, // Deepseek might prefer simple system prompt + user prompt
                        { role: "user", content: finalSystemPrompt }
                    ]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            generatedText = data.choices?.[0]?.message?.content || "{}";
        }

        // Clean up markdown blocks if present
        generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("AI Raw Output:", generatedText.substring(0, 100) + "...");

        const result = JSON.parse(generatedText);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('AI Gen Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
    }
}
