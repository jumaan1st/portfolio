
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        title,
        excerpt,
        date,
        read_time AS "readTime",
        tags,
        content
      FROM portfolio.blogs
      ORDER BY id ASC
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
    }
}
