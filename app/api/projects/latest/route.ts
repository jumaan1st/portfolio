
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id, title, description, link
      FROM portfolio.projects
      ORDER BY id DESC
      LIMIT 10
    `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching latest projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}
