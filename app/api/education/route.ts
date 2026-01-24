
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio.education ORDER BY start_date DESC NULLS LAST, id DESC');
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
    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.education');
    const newId = idRes.rows[0].new_id;

    const { rows } = await pool.query(
      'INSERT INTO portfolio.education (id, degree, school, grade, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [newId, degree, school, grade, start_date || null, end_date || null]
    );
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

    const { rows } = await pool.query(
      'UPDATE portfolio.education SET degree = $1, school = $2, grade = $3, start_date = $4, end_date = $5 WHERE id = $6 RETURNING *',
      [degree, school, grade, start_date || null, end_date || null, id]
    );

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
    await pool.query('DELETE FROM portfolio.education WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('education', { expire: 0 });
  }
}
