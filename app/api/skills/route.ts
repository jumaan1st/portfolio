
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        name,
        icon
      FROM portfolio.skills
      ORDER BY id ASC
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }
}
