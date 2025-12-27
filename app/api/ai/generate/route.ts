
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
        } else if (type === 'text') {
            // Context aware generation for Editor
            const context = body.context || {};
            finalSystemPrompt = `
            You are an expert content writer and HTML formatter.
            The user wants you to generate or improve text for a blog post.
            
            Instructions:
            1. Return semantic, valid HTML (e.g., <p>, <h2>, <ul>, <strong>).
            2. Do NOT wrap the entire answer in markdown code fences (like \`\`\`html). just return the HTML string.
            3. If images are provided in the context, try to incorporate them intelligently using <img src="..."> tags.
               - Context Images: ${JSON.stringify(context.images || [])}
               - You can add inline styles for floating or sizing (e.g. style="float: right; width: 300px; margin: 0 0 1rem 1rem;") if it makes sense.
            
            Current Content Context (if any):
            ${context.content || "None"}

            User's Specific Request:
            ${userPrompt}
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

        const result = type === 'text' ? { text: generatedText } : JSON.parse(generatedText);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('AI Gen Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
    }
}
