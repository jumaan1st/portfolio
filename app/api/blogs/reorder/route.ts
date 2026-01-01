
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { items } = body; // Array of { id, sort_order }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const item of items) {
                await client.query('UPDATE portfolio.blogs SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error reordering blogs:', error);
        if (error.code === '42501') {
            return NextResponse.json({ error: 'Permission denied: Read-only access' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to reorder blogs' }, { status: 500 });
    } finally {
        revalidateTag('blogs', { expire: 0 });
        revalidateTag('essentials', { expire: 0 }); // Blogs might be in essentials? Probably not but good to check.
    }
}
