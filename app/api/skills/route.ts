
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio.skills ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, icon } = await request.json();
    const { rows } = await pool.query(
      'INSERT INTO portfolio.skills (name, icon) VALUES ($1, $2) RETURNING *',
      [name, icon]
    );
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
    await pool.query('DELETE FROM portfolio.skills WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('skills', { expire: 0 });
  }
}
