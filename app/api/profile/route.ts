
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        name,
        roles,
        role AS "currentRole",
        current_company AS "currentCompany",
        current_company_url AS "currentCompanyUrl",
        summary,
        location,
        email,
        phone,
        linkedin,
        github,
        twitter,
        resume_url AS "resumeUrl",
        photo_light_url AS "photoLightUrl",
        photo_dark_url AS "photoDarkUrl"
      FROM portfolio.profile
      LIMIT 1
    `);

        // If no profile found, return null or empty object? 
        // Usually there is 1.
        return NextResponse.json(rows[0] || {});
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
