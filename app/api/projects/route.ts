
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        title,
        category,
        tech,
        description,
        long_description AS "longDescription",
        features,
        challenges,
        link,
        color,
        image
      FROM portfolio.projects
      ORDER BY id ASC
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}
