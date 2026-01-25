
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidateTag } from 'next/cache';


import { unstable_cache } from 'next/cache';

const getCachedProjects = unstable_cache(
  async (params: any) => {

    const { id, slug, limit, offset, search, category, summaryMode } = params;

    // Handle Single Fetch by ID
    if (id) {
      const { rows } = await pool.query(`
            SELECT 
                id, title, category, tech, description, 
                long_description AS "longDescription", 
                features, challenges, link, github_link AS "githubLink", color, image, slug
            FROM portfolio.projects
            WHERE id = $1
        `, [id]);
      return rows.length > 0 ? rows[0] : null;
    }

    // Handle Single Fetch by Slug
    if (slug) {
      const { rows } = await pool.query(`
            SELECT 
                id, title, category, tech, description, 
                long_description AS "longDescription", 
                features, challenges, link, github_link AS "githubLink", color, image, slug
            FROM portfolio.projects
            WHERE slug = $1
        `, [slug]);
      return rows.length > 0 ? rows[0] : null;
    }

    let query = summaryMode
      ? `
        SELECT 
          id, slug, title, category, tech, description, 
          link, github_link AS "githubLink", color, image
        FROM portfolio.projects
        WHERE 1=1
      `
      : `
        SELECT 
          id, slug, title, category, tech, description, 
          long_description AS "longDescription", 
          features, challenges, link, github_link AS "githubLink", color, image
        FROM portfolio.projects
        WHERE 1=1
      `;

    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND (title ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`;
    }

    if (category) {
      queryParams.push(category);
      query += ` AND category = $${queryParams.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${query}) as sub`, queryParams);
    const total = parseInt(countRes.rows[0].count);

    query += ` ORDER BY sort_order DESC, id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows } = await pool.query(query, queryParams);

    return {
      data: rows,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },
  ['projects-list'],
  { tags: ['projects'], revalidate: 3600 }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const summaryMode = searchParams.get('summary') === 'true';
    const offset = (page - 1) * limit;

    const result = await getCachedProjects({ id, slug, limit, offset, search, category, summaryMode });

    if ((id || slug) && !result) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
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
    const {
      title,
      category,
      tech,
      description,
      longDescription,
      features,
      challenges,
      link,
      githubLink,
      color,
      image
    } = body;

    // Generate ID since column is not SERIAL
    const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM portfolio.projects');
    const newId = idRes.rows[0].new_id;

    // Generate Slug
    let slug = body.slug ? toSlug(body.slug) : toSlug(title);
    if (!slug) slug = `project-${newId}`;

    // Ensure uniqueness
    const slugCheck = await pool.query('SELECT 1 FROM portfolio.projects WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${newId}`;
    }

    // Get Max Sort Order to put new project at top
    const sortRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as new_sort FROM portfolio.projects');
    const newSortOrder = sortRes.rows[0].new_sort;

    const { rows } = await pool.query(`
            INSERT INTO portfolio.projects (
                id, slug, title, category, tech, description, long_description,
                features, challenges, link, github_link, color, image, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *, long_description as "longDescription", github_link as "githubLink"
        `, [
      newId, slug, title, category, JSON.stringify(tech), description, longDescription,
      JSON.stringify(features), challenges, link, githubLink, color, image, newSortOrder
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
      githubLink,
      color,
      image,
      slug: requestedSlug
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
                github_link = COALESCE($9, github_link),
                color = COALESCE($10, color),
                image = COALESCE($11, image),
                slug = COALESCE($13, slug)
            WHERE id = $12
            RETURNING *, long_description as "longDescription", github_link as "githubLink"
        `, [
      title, category, JSON.stringify(tech), description, longDescription,
      JSON.stringify(features), challenges, link, githubLink, color, image,
      id, requestedSlug
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
