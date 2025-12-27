
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Handle Single Fetch
    if (id) {
      const { rows } = await pool.query(`
            SELECT 
                id, title, category, tech, description, 
                long_description AS "longDescription", 
                features, challenges, link, color, image
            FROM portfolio.projects
            WHERE id = $1
        `, [id]);

      if (rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, title, category, tech, description, 
        long_description AS "longDescription", 
        features, challenges, link, color, image
      FROM portfolio.projects
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${query}) as sub`, params);
    const total = parseInt(countRes.rows[0].count);

    query += ` ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    return NextResponse.json({
      data: rows,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      tech,
      description,
      longDescription,
      features,
      challenges,
      link,
      color,
      image
    } = body;

    // Generate ID since column is not SERIAL
    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.projects');
    const newId = idRes.rows[0].new_id;

    const { rows } = await pool.query(`
            INSERT INTO portfolio.projects (
                id, title, category, tech, description, long_description,
                features, challenges, link, color, image
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *, long_description as "longDescription"
        `, [
      newId, title, category, JSON.stringify(tech), description, longDescription,
      JSON.stringify(features), challenges, link, color, image
    ]);

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Permission denied: Read-only access' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  } finally {
    revalidateTag('projects', { expire: 0 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      category,
      tech,
      description,
      longDescription,
      features,
      challenges,
      link,
      color,
      image
    } = body;

    const { rows } = await pool.query(`
            UPDATE portfolio.projects
            SET
                title = COALESCE($1, title),
                category = COALESCE($2, category),
                tech = COALESCE($3, tech),
                description = COALESCE($4, description),
                long_description = COALESCE($5, long_description),
                features = COALESCE($6, features),
                challenges = COALESCE($7, challenges),
                link = COALESCE($8, link),
                color = COALESCE($9, color),
                image = COALESCE($10, image)
            WHERE id = $11
            RETURNING *, long_description as "longDescription"
        `, [
      title, category, JSON.stringify(tech), description, longDescription,
      JSON.stringify(features), challenges, link, color, image,
      id
    ]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating project:', error);
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Permission denied: Read-only access' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  } finally {
    revalidateTag('projects', { expire: 0 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { rowCount } = await pool.query('DELETE FROM portfolio.projects WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Permission denied: Read-only access' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  } finally {
    revalidateTag('projects', { expire: 0 });
  }
}
