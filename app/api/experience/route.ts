
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { experience } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const rows = await db.select().from(experience)
      .orderBy(sql`${experience.start_date} DESC NULLS LAST`, desc(experience.id));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, company, description, start_date, end_date } = body;

    // Generate ID
    const idRes = await db.select({ new_id: sql<number>`COALESCE(MAX(${experience.id}), 0) + 1` }).from(experience);
    const newId = idRes[0].new_id;

    const rows = await db.insert(experience).values({
      id: newId,
      role,
      company,
      description,
      start_date: start_date || null,
      end_date: end_date || null
    }).returning();
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('experience', { expire: 0 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { role, company, description, start_date, end_date } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const rows = await db.update(experience)
      .set({ role, company, description, start_date: start_date || null, end_date: end_date || null })
      .where(eq(experience.id, parseInt(id)))
      .returning();

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('experience', { expire: 0 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(experience).where(eq(experience.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('experience', { expire: 0 });
  }
}
