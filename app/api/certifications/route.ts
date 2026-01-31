
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { certifications } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function GET() {
    try {
        const rows = await db.select().from(certifications).orderBy(desc(certifications.id));
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, issuer, url, date, icon } = await request.json();
        const rows = await db.insert(certifications).values({
            name,
            issuer,
            url: url || null,
            date,
            icon
        }).returning();
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

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.update(certifications)
            .set({ name, issuer, url: url || null, date, icon })
            .where(eq(certifications.id, parseInt(id)));

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
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        await db.delete(certifications).where(eq(certifications.id, parseInt(id)));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        revalidateTag('certifications', { expire: 0 });
    }
}
