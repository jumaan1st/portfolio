
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio.education ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { degree, school, year, grade } = body;

    // Manual ID generation (not serial)
    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.education');
    const newId = idRes.rows[0].new_id;

    const { rows } = await pool.query(
      'INSERT INTO portfolio.education (id, degree, school, year, grade) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [newId, degree, school, year, grade]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { degree, school, year, grade } = body;

    const { rows } = await pool.query(
      'UPDATE portfolio.education SET degree = $1, school = $2, year = $3, grade = $4 WHERE id = $5 RETURNING *',
      [degree, school, year, grade, id]
    );

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
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
  }
}
