
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Handle Single Fetch
    if (id) {
      const { rows } = await pool.query('SELECT * FROM portfolio.blogs WHERE id = $1', [id]);
      if (rows.length === 0) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM portfolio.blogs WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    if (tag) {
      params.push(`%${tag}%`);
      query += ` AND tags::text ILIKE $${params.length}`; // Simple text check for JSON array
    }

    // Count Total
    const countRes = await pool.query(`SELECT COUNT(*) FROM (${query}) as sub`, params);
    const total = parseInt(countRes.rows[0].count);

    // Fetch Data
    query += ` ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    return NextResponse.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, content, tags, date, readTime } = body;

    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.blogs');
    const newId = idRes.rows[0].new_id;

    const { rows } = await pool.query(
      'INSERT INTO portfolio.blogs (id, title, excerpt, content, tags, date, read_time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [newId, title, excerpt, content, JSON.stringify(tags), date, readTime]
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
    const { title, excerpt, content, tags, date, readTime } = body;

    const { rows } = await pool.query(`
            UPDATE portfolio.blogs 
            SET title = COALESCE($1, title), 
                excerpt = COALESCE($2, excerpt), 
                content = COALESCE($3, content), 
                tags = COALESCE($4, tags), 
                date = COALESCE($5, date),
                read_time = COALESCE($6, read_time)
            WHERE id = $7 RETURNING *
         `, [title, excerpt, content, JSON.stringify(tags), date, readTime, id]);

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
    await pool.query('DELETE FROM portfolio.blogs WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
