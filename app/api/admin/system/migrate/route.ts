import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                ALTER TABLE request_audit.request_context_log
                ADD COLUMN IF NOT EXISTS user_name VARCHAR(150),
                ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
                ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);
            `);
            return NextResponse.json({ success: true, message: "Migration applied successfully" });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
