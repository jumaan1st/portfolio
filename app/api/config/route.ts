
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        admin_email AS "adminEmail",
        show_welcome_modal AS "showWelcomeModal"
      FROM portfolio.config
      LIMIT 1
    `);

    return NextResponse.json(rows[0] || {});
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
