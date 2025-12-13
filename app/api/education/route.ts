
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query(`
      SELECT 
        id,
        degree,
        school,
        year,
        grade
      FROM portfolio.education
      ORDER BY id ASC
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching education:', error);
        return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
    }
}
