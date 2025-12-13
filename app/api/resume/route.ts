
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get the resume URL from DB
        const { rows } = await pool.query(`SELECT resume_url FROM portfolio.profile LIMIT 1`);

        if (rows.length === 0 || !rows[0].resume_url) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const resumeUrl = rows[0].resume_url;

        // 2. Fetch the file from the remote URL (Bucket)
        const response = await fetch(resumeUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch resume file' }, { status: 502 });
        }

        // 3. Create a response with the file stream and proper headers
        const contentDisposition = 'attachment; filename="Mohammed_Jumaan_Resume.pdf"';

        return new NextResponse(response.body, {
            status: 200,
            headers: {
                'Content-Disposition': contentDisposition,
                'Content-Type': 'application/pdf',
            },
        });

    } catch (error) {
        console.error('Resume download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
