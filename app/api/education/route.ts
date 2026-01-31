
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { education } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const rows = await db.select().from(education)
      .orderBy(sql`${education.start_date} DESC NULLS LAST`, desc(education.id));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { degree, school, grade, start_date, end_date } = body;

    // Manual ID generation (not serial)
    const idRes = await db.select({ new_id: sql<number>`COALESCE(MAX(${education.id}), 0) + 1` }).from(education);
    const newId = idRes[0].new_id;

    const rows = await db.insert(education).values({
      id: newId, degree, school, grade, start_date: start_date || null, end_date: end_date || null
    }).returning();
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  } finally {
    revalidateTag('education', { expire: 0 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { degree, school, grade, start_date, end_date } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const rows = await db.update(education)
      .set({ degree, school, grade, start_date: start_date || null, end_date: end_date || null })
      .where(eq(education.id, parseInt(id)))
      .returning();

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  } finally {
    revalidateTag('education', { expire: 0 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(education).where(eq(education.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('education', { expire: 0 });
  }
}
