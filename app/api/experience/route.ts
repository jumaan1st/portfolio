
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio.experience ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, company, period, description } = body;

    // Generate ID
    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.experience');
    const newId = idRes.rows[0].new_id;

    const { rows } = await pool.query(
      'INSERT INTO portfolio.experience (id, role, company, period, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [newId, role, company, period, description]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { role, company, period, description } = body;

    const { rows } = await pool.query(`
            UPDATE portfolio.experience 
            SET role = COALESCE($1, role), company = COALESCE($2, company), period = COALESCE($3, period), description = COALESCE($4, description)
            WHERE id = $5 RETURNING *
         `, [role, company, period, description, id]);

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM portfolio.experience WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
