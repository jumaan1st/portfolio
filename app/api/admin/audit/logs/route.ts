import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const ip = searchParams.get('ip');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const values: any[] = [];
        const conditions: string[] = [];

        if (ip) {
            conditions.push(`ip_address ILIKE $${values.length + 1}`);
            values.push(`%${ip}%`);
        }
        if (startDate) {
            conditions.push(`started_at >= $${values.length + 1}`);
            values.push(startDate);
        }
        if (endDate) {
            conditions.push(`started_at <= $${values.length + 1}`);
            values.push(endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count total sessions
        const countQuery = `SELECT COUNT(*) FROM request_audit.sessions ${whereClause}`;
        const countRes = await pool.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        // Fetch paginated sessions
        const dataQuery = `
            SELECT 
                session_id,
                ip_address,
                user_identity,
                geo_info,
                device_info,
                visit_history,
                started_at,
                last_active_at,
                browser_name,
                operating_system,
                device_type,
                country_name,
                city_name,
                user_name,
                user_email
            FROM request_audit.sessions
            ${whereClause}
            ORDER BY last_active_at DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;

        const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

        return NextResponse.json({
            logs: dataRes.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Audit Logs Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
