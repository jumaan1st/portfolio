
import { NextResponse } from 'next/server';
import { generateProjectReadme } from '@/lib/github-sync';

export async function POST(request: Request) {
    try {
        const project = await request.json();

        if (!project.title || !project.description) {
            return NextResponse.json({ error: 'Project Title and Description are required' }, { status: 400 });
        }

        const markdown = await generateProjectReadme(project);
        return NextResponse.json({ markdown });

    } catch (error: any) {
        console.error('Generate Readme Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
