
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { callAI } from '@/lib/ai-manager';

export async function POST(request: Request) {
    try {
        const { message, context, name, email } = await request.json();

        if (!message || !context) {
            return NextResponse.json({ error: 'Message and context are required' }, { status: 400 });
        }

        // Identity check for rate limiting
        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required for identity' }, { status: 401 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const today = new Date().toISOString().split('T')[0];

        console.log(`[AI Chat] Request from ${normalizedEmail} (${name}) on ${today}`);

        // 1. Check Rate Limit
        const usageRes = await pool.query(
            'SELECT usage_id, chat_count FROM portfolio.ai_chat_usage WHERE email = $1 AND chat_date = $2',
            [normalizedEmail, today]
        );

        let currentCount = 0;
        let usageId = null;

        if (usageRes.rows.length > 0) {
            currentCount = usageRes.rows[0].chat_count;
            usageId = usageRes.rows[0].usage_id;
            console.log(`[AI Chat] User has used ${currentCount} requests today.`);
        } else {
            console.log(`[AI Chat] New user for today.`);
        }

        if (currentCount >= 5) {
            console.warn(`[AI Chat] Rate limit exceeded for ${normalizedEmail}`);
            return NextResponse.json(
                { error: 'Rate limit exceeded. You have used your 5 free AI requests for today.' },
                { status: 429 }
            );
        }

        // 2. Call AI Manager (Switches between Gemini/DeepSeek)
        const aiResponse = await callAI(context);

        if (aiResponse.startsWith("Error:") || aiResponse.startsWith("No response")) {
            console.warn(`[AI Chat] Gemini API Error: ${aiResponse}`);
            // If we suspect a quota limit, return 429 so UI can show the right message
            if (aiResponse.includes("429") || aiResponse.includes("Rate limit")) {
                return NextResponse.json(
                    { error: "I'm receiving too many messages right now! Please try again tomorrow. ⏳" },
                    { status: 429 }
                );
            }
            return NextResponse.json({ error: "I'm having trouble connecting to the server. Please try again later! 🔌" }, { status: 503 });
        }

        // 3. Update Usage
        if (usageId) {
            await pool.query(
                'UPDATE portfolio.ai_chat_usage SET chat_count = chat_count + 1 WHERE usage_id = $1',
                [usageId]
            );
        } else {
            await pool.query(
                'INSERT INTO portfolio.ai_chat_usage (name, email, chat_date, chat_count) VALUES ($1, $2, $3, 1)',
                [name, normalizedEmail, today]
            );
        }

        console.log(`[AI Chat] Success. New count: ${currentCount + 1}`);

        return NextResponse.json({ response: aiResponse, remaining: 5 - (currentCount + 1) });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
