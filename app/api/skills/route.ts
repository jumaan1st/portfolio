
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { skills } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const rows = await db.select().from(skills).orderBy(asc(skills.id));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, icon } = await request.json();
    const rows = await db.insert(skills).values({ name, icon }).returning();
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('skills', { expire: 0 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(skills).where(eq(skills.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('skills', { expire: 0 });
  }
}
