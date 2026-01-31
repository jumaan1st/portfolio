import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, ilike, and, desc, sql, or, count } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';


import { unstable_cache } from 'next/cache';

const getCachedProjects = unstable_cache(
  async (params: any) => {

    const { id, slug, limit, offset, search, category, summaryMode } = params;

    // Handle Single Fetch by ID
    if (id) {
      const rows = await db.select({
        id: projects.id,
        title: projects.title,
        category: projects.category,
        tech: projects.tech,
        description: projects.description,
        longDescription: projects.long_description,
        features: projects.features,
        challenges: projects.challenges,
        link: projects.link,
        githubLink: projects.github_link,
        color: projects.color,
        image: projects.image,
        slug: projects.slug
      }).from(projects).where(eq(projects.id, id));

      return rows.length > 0 ? rows[0] : null;
    }

    // Handle Single Fetch by Slug
    if (slug) {
      const rows = await db.select({
        id: projects.id,
        title: projects.title,
        category: projects.category,
        tech: projects.tech,
        description: projects.description,
        longDescription: projects.long_description,
        features: projects.features,
        challenges: projects.challenges,
        link: projects.link,
        githubLink: projects.github_link,
        color: projects.color,
        image: projects.image,
        slug: projects.slug
      }).from(projects).where(eq(projects.slug, slug));
      return rows.length > 0 ? rows[0] : null;
    }

    // List Query
    let conditions = [];
    if (search) {
      conditions.push(or(ilike(projects.title, `%${search}%`), ilike(projects.description, `%${search}%`)));
    }
    if (category) {
      conditions.push(eq(projects.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countRes = await db.select({ count: count() }).from(projects).where(whereClause);
    const total = countRes[0].count; // count() returns number or string depending on driver, but usually safe to parse or use. Drizzle auto-maps? node-postgres returns string for count.

    // Data
    const rows = await db.select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      category: projects.category,
      tech: projects.tech,
      description: projects.description,
      link: projects.link,
      githubLink: projects.github_link,
      color: projects.color,
      image: projects.image,
      ...(summaryMode ? {} : {
        longDescription: projects.long_description,
        features: projects.features,
        challenges: projects.challenges,
      })
    })
      .from(projects)
      .where(whereClause)
      .orderBy(desc(projects.sort_order), desc(projects.id))
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      meta: {
        total: Number(total), // Ensure number
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(Number(total) / limit)
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

    // Generate ID
    const idRes = await db.select({ new_id: sql<number>`COALESCE(MAX(${projects.id}), 0) + 1` }).from(projects);
    const newId = idRes[0].new_id;

    // Generate Slug
    let slug = body.slug ? toSlug(body.slug) : toSlug(title);
    if (!slug) slug = `project-${newId}`;

    // Ensure uniqueness
    const slugCheck = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug));
    if (slugCheck.length > 0) {
      slug = `${slug}-${newId}`;
    }

    // Get Max Sort Order
    const sortRes = await db.select({ new_sort: sql<number>`COALESCE(MAX(${projects.sort_order}), 0) + 1` }).from(projects);
    const newSortOrder = sortRes[0].new_sort;

    const rows = await db.insert(projects).values({
      id: newId,
      slug: slug,
      title: title,
      category: category,
      tech: tech, // Drizzle handles array<string> for jsonb
      description: description,
      long_description: longDescription,
      features: features,
      challenges: challenges,
      link: link,
      github_link: githubLink,
      color: color,
      image: image,
      sort_order: newSortOrder
    }).returning({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      category: projects.category,
      tech: projects.tech,
      description: projects.description,
      longDescription: projects.long_description,
      features: projects.features,
      challenges: projects.challenges,
      link: projects.link,
      githubLink: projects.github_link,
      color: projects.color,
      image: projects.image,
      sort_order: projects.sort_order
    });

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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (tech !== undefined) updateData.tech = tech;
    if (description !== undefined) updateData.description = description;
    if (longDescription !== undefined) updateData.long_description = longDescription;
    if (features !== undefined) updateData.features = features;
    if (challenges !== undefined) updateData.challenges = challenges;
    if (link !== undefined) updateData.link = link;
    if (githubLink !== undefined) updateData.github_link = githubLink;
    if (color !== undefined) updateData.color = color;
    if (image !== undefined) updateData.image = image;
    if (requestedSlug !== undefined) updateData.slug = requestedSlug;

    const rows = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, parseInt(id)))
      .returning({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        category: projects.category,
        tech: projects.tech,
        description: projects.description,
        longDescription: projects.long_description,
        features: projects.features,
        challenges: projects.challenges,
        link: projects.link,
        githubLink: projects.github_link,
        color: projects.color,
        image: projects.image,
        sort_order: projects.sort_order
      });

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

    const res = await db.delete(projects).where(eq(projects.id, parseInt(id)));
    const deletedCount = res.rowCount;

    if (deletedCount === 0) {
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
