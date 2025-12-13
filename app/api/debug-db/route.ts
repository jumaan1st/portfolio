
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        client.release();
        return NextResponse.json({
            status: 'success',
            time: res.rows[0].now,
            env: {
                user: !!process.env.DB_USER,
                host: !!process.env.DB_HOST,
                pass: !!process.env.DB_PASSWORD,
                db: !!process.env.DB_NAME,
                port: process.env.DB_PORT || 'default'
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            env: {
                user: !!process.env.DB_USER,
                host: !!process.env.DB_HOST,
                pass: !!process.env.DB_PASSWORD,
                db: !!process.env.DB_NAME,
                port: process.env.DB_PORT || 'default'
            }
        }, { status: 500 });
    }
}
