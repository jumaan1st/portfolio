
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper to map DB row to Frontend Interface
const mapRow = (row: any) => ({
  ...row,
  readTime: row.read_time,
  // Ensure we consistently provide readTime (camelCase)
});

import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedBlogs = unstable_cache(
  async (params: any) => {
    const { id, slug, limit, offset, search, tag, summaryMode, includeHidden } = params;

    // Handle Single Fetch by ID
    if (id) {
      const { rows } = await pool.query('SELECT * FROM portfolio.blogs WHERE id = $1', [id]);
      return rows.length > 0 ? mapRow(rows[0]) : null;
    }

    // Handle Single Fetch by Slug
    if (slug) {
      const { rows } = await pool.query('SELECT * FROM portfolio.blogs WHERE slug = $1', [slug]);
      return rows.length > 0 ? mapRow(rows[0]) : null;
    }

    // If summary mode, select only necessary fields (exclude content strings to reduce payload)
    let query = summaryMode
      ? 'SELECT id, slug, title, excerpt, tags, date, read_time, image, is_hidden FROM portfolio.blogs WHERE 1=1'
      : 'SELECT * FROM portfolio.blogs WHERE 1=1';

    // By default, exclude hidden blogs unless specifically requested (Admin) 
    // OR if we are fetching a specific ID (which is handled above individually).
    if (!includeHidden) {
      query += ' AND is_hidden = FALSE';
    }
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (title ILIKE $${queryParams.length} OR content ILIKE $${queryParams.length})`;
    }

    if (tag) {
      queryParams.push(`%${tag}%`);
      query += ` AND tags::text ILIKE $${queryParams.length}`; // Simple text check for JSON array
    }

    // Count Total
    const countRes = await pool.query(`SELECT COUNT(*) FROM (${query}) as sub`, queryParams);
    const total = parseInt(countRes.rows[0].count);

    // Fetch Data
    query += ` ORDER BY sort_order DESC, id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows } = await pool.query(query, queryParams);

    return {
      data: rows.map(mapRow),
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },
  ['blogs-list'],
  { tags: ['blogs'], revalidate: 3600 }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const offset = (page - 1) * limit;

    const includeHidden = searchParams.get('include_hidden') === 'true';
    const summaryMode = searchParams.get('summary') === 'true';

    // Update cache call to accept slug
    // We need to update getCachedBlogs signature too, but let's pass it anyway as it accepts 'params' any
    const result = await getCachedBlogs({ id, slug, limit, offset, search, tag, summaryMode, includeHidden });

    if ((id || slug) && !result) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Slug Helper
const toSlug = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, content, tags, date, readTime, image, is_hidden } = body;

    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.blogs');
    const newId = idRes.rows[0].new_id;

    // Generate Slug
    let slug = body.slug ? toSlug(body.slug) : toSlug(title);
    if (!slug) slug = `post-${newId}`;

    // Ensure uniqueness
    const slugCheck = await pool.query('SELECT 1 FROM portfolio.blogs WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${newId}`;
    }

    // Get Max Sort Order to put new blog at top
    const sortRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as new_sort FROM portfolio.blogs');
    const newSortOrder = sortRes.rows[0].new_sort;

    const { rows } = await pool.query(
      'INSERT INTO portfolio.blogs (id, slug, title, excerpt, content, tags, date, read_time, image, is_hidden, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [newId, slug, title, excerpt, content, JSON.stringify(tags), date, readTime, image, is_hidden || false, newSortOrder]
    );
    return NextResponse.json(mapRow(rows[0]));
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  } finally {
    revalidateTag('blogs', { expire: 0 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { title, excerpt, content, tags, date, readTime, image, is_hidden, slug: requestedSlug } = body;

    // Optional: Allow updating slug, but usually careful about breaking links
    // For now let's only set it if provided explicity, else leave it. 
    // If we want to auto-update slug on title change, that breaks SEO links. Let's ONLY update if requested directly.

    const { rows } = await pool.query(`
            UPDATE portfolio.blogs 
            SET title = COALESCE($1, title), 
                excerpt = COALESCE($2, excerpt), 
                content = COALESCE($3, content), 
                tags = COALESCE($4, tags), 
                date = COALESCE($5, date),
                read_time = COALESCE($6, read_time),
                image = COALESCE($7, image),
                is_hidden = COALESCE($8, is_hidden),
                slug = COALESCE($10, slug)
            WHERE id = $9 RETURNING *
         `, [title, excerpt, content, JSON.stringify(tags), date, readTime, image, is_hidden, id, requestedSlug]);

    return NextResponse.json(mapRow(rows[0]));
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('blogs', { expire: 0 });
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
  } finally {
    revalidateTag('blogs', { expire: 0 });
  }
}
