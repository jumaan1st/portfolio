import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/schema';
import { desc, count, ilike, and, gte, lte, eq } from 'drizzle-orm';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const ip = searchParams.get('ip');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const conditions = [];

        if (ip) conditions.push(ilike(sessions.ip_address, `%${ip}%`));
        if (startDate) conditions.push(gte(sessions.started_at, new Date(startDate)));
        if (endDate) conditions.push(lte(sessions.started_at, new Date(endDate)));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Count
        const countRes = await db.select({ count: count() }).from(sessions).where(whereClause);
        const total = countRes[0].count;

        // Data
        const logs = await db.select().from(sessions)
            .where(whereClause)
            .orderBy(desc(sessions.last_active_at))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            logs: logs,
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

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
        }

        await db.delete(sessions).where(eq(sessions.session_id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Audit Log Delete Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
