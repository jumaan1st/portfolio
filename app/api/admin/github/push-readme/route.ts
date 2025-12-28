
import { NextResponse } from 'next/server';
import { pushProjectReadme } from '@/lib/github-sync';

export async function POST(request: Request) {
    try {
        const { githubLink, content } = await request.json();

        if (!githubLink || !content) {
            return NextResponse.json({ error: 'GitHub Link and Content are required' }, { status: 400 });
        }

        // Optional: Verify username matches GITHUB_USERNAME env to prevent pushing to wrong repos
        // const myUsername = process.env.GITHUB_USERNAME;
        // if (myUsername && !githubLink.includes(myUsername)) { ... } 
        // For now, relying on GITHUB_TOKEN permissions (it will fail if no access)

        await pushProjectReadme(githubLink, content);
        return NextResponse.json({ success: true, message: 'README pushed successfully!' });

    } catch (error: any) {
        console.error('Push Readme Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
