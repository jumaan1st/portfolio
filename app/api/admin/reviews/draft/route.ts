import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { callAIWithUsage } from '@/lib/ai-manager';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function checkAuth(req: Request) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return false;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        return role === 'admin';
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, feedback, type } = await req.json();

        if (!name || !feedback) {
            return NextResponse.json({ error: 'Missing name or feedback' }, { status: 400 });
        }

        const isProjectReview = feedback.startsWith('[Project Review]');
        const cleanMessage = feedback.replace(/^\[(Project Review|Contact)\]\s*/, '');

        const prompt = `
You are Mohammed Jumaan. You received a message from ${name}.
Their message details:
Message/Feedback: "${cleanMessage}"
Category: ${isProjectReview ? 'Project Review' : 'Contact Inquiry'}

Task:
1. Generate a professional and polite email subject line (e.g. "Re: Your review on my portfolio" or "Re: Your message to Mohammed Jumaan").
2. Generate a personalized email reply. Be professional, friendly, and helpful. Thank them for their review/message and address their input.
3. Keep the email body concise (under 150 words). Start with "Hi ${name}," and end with:
Best regards,
Mohammed Jumaan
Full Stack Developer

Format your output EXACTLY as follows with a "---" line separator:
Subject: [Your generated email subject]
---
[Your generated email body]
`;

        const aiRes = await callAIWithUsage(
            prompt,
            "You are Mohammed Jumaan, replying to a message or feedback. Follow formatting instructions exactly.",
            "System Admin",
            "admin@portfolio.com",
            "outreach_draft"
        );

        const text = aiRes.text;
        const parts = text.split('---');
        let subject = 'Re: Your inquiry';
        let body = text;

        if (parts.length >= 2) {
            subject = parts[0].replace(/^Subject:\s*/i, '').trim();
            body = parts.slice(1).join('---').trim();
        } else {
            // Fallback parsing if separator not found perfectly
            const match = text.match(/Subject:\s*(.+)/i);
            if (match) {
                subject = match[1].trim();
                body = text.replace(/Subject:\s*.+/i, '').trim();
            }
        }

        return NextResponse.json({
            success: true,
            subject,
            body
        });

    } catch (error) {
        console.error('Draft API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
