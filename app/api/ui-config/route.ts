
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        hero_tagline AS "heroTagline",
        status_label AS "statusLabel",
        blog_title AS "blogTitle",
        blog_subtitle AS "blogSubtitle",
        project_title AS "projectTitle",
        project_subtitle AS "projectSubtitle"
      FROM portfolio.ui_config
      LIMIT 1
    `);

        return NextResponse.json(rows[0] || {});
    } catch (error) {
        console.error('Error fetching ui-config:', error);
        return NextResponse.json({ error: 'Failed to fetch ui-config' }, { status: 500 });
    }
}
