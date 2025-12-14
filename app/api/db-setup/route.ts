import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS portfolio.ai_email_usage (
                email VARCHAR(255) PRIMARY KEY,
                usage_count INT DEFAULT 0,
                last_updated DATE DEFAULT CURRENT_DATE
            );
        `);
        return NextResponse.json({ success: true, message: 'Table ai_email_usage created or already exists.' });
    } catch (error) {
        console.error('DB Setup Error:', error);
        return NextResponse.json({ error: 'Failed to setup DB' }, { status: 500 });
    }
}
