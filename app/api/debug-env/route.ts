import { NextResponse } from 'next/server';

export async function GET() {
    const gemini = process.env.GEMINI_API_KEY;
    const deepseek = process.env.DEEPSEEK_API_KEY;
    const provider = process.env.AI_PROVIDER;

    return NextResponse.json({
        provider_env: provider || 'undefined',
        has_gemini: !!gemini,
        has_deepseek: !!deepseek,
        gemini_preview: gemini ? gemini.substring(0, 4) + '...' : null,
        deepseek_preview: deepseek ? deepseek.substring(0, 4) + '...' : null,
        node_env: process.env.NODE_ENV
    });
}
