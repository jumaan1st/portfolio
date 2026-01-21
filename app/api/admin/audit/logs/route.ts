import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const ip = searchParams.get('ip'); // session_id stores IP
    const type = searchParams.get('type'); // 'home' | 'blog' | 'project'

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        values.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        // Assume endDate is inclusive for the day, so +1 day or check implementation
        // If string is YYYY-MM-DD, we might want < endDate + 1day
        whereClause += ` AND created_at <= $${paramIndex}::date + interval '1 day'`;
        values.push(endDate);
        paramIndex++;
    }

    if (ip) {
        whereClause += ` AND session_id LIKE $${paramIndex}`; // session_id stores IP
        values.push(`%${ip}%`);
        paramIndex++;
    }

    if (type) {
        if (type === 'home') {
            whereClause += ` AND request_uri = '/'`;
        } else if (type === 'blog') {
            whereClause += ` AND request_uri LIKE '/blogs/%'`;
        } else if (type === 'project') {
            whereClause += ` AND request_uri LIKE '/projects/%'`;
        }
    }

    try {
        const countQuery = `SELECT COUNT(*) FROM request_audit.request_context_log ${whereClause}`;
        const countRes = await pool.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        const dataQuery = `
            SELECT *
            FROM request_audit.request_context_log
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
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
        console.error('Fetch Logs Error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
