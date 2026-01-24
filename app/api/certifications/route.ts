
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function GET() {
    try {
        const { rows } = await pool.query('SELECT * FROM portfolio.certifications ORDER BY id DESC');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, issuer, url, date, icon } = await request.json();
        const { rows } = await pool.query(
            'INSERT INTO portfolio.certifications (name, issuer, url, date, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, issuer, url || null, date, icon]
        );
        return NextResponse.json(rows[0]);
    } catch (error: any) {
        if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        revalidateTag('certifications', { expire: 0 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { name, issuer, url, date, icon } = await request.json();

        await pool.query(
            'UPDATE portfolio.certifications SET name = $1, issuer = $2, url = $3, date = $4, icon = $5 WHERE id = $6',
            [name, issuer, url || null, date, icon, id]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        revalidateTag('certifications', { expire: 0 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await pool.query('DELETE FROM portfolio.certifications WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        revalidateTag('certifications', { expire: 0 });
    }
}
