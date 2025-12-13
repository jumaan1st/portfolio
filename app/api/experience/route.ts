
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        role,
        company,
        period,
        description
      FROM portfolio.experience
      ORDER BY id ASC
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching experience:', error);
        return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
    }
}
