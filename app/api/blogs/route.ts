import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogs } from '@/lib/schema';
import { eq, ilike, and, desc, sql, or, count, not } from 'drizzle-orm';

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
      const rows = await db.select().from(blogs).where(eq(blogs.id, id));
      return rows.length > 0 ? mapRow(rows[0]) : null;
    }

    // Handle Single Fetch by Slug
    if (slug) {
      const rows = await db.select().from(blogs).where(eq(blogs.slug, slug));
      return rows.length > 0 ? mapRow(rows[0]) : null;
    }

    let conditions = [];

    // Hidden Logic: By default Exclude hidden, unless includeHidden is true.
    if (!includeHidden) {
      conditions.push(eq(blogs.is_hidden, false));
    }

    if (search) {
      conditions.push(or(ilike(blogs.title, `%${search}%`), ilike(blogs.content, `%${search}%`)));
    }

    if (tag) {
      // JSONB array check: cast to text and ILIKE
      conditions.push(sql`${blogs.tags}::text ILIKE ${`%${tag}%`}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count Total
    const countRes = await db.select({ count: count() }).from(blogs).where(whereClause);
    const total = countRes[0].count;

    // Fetch Data
    let query;
    // We must reconstruct the chain for each branch because 'db.from' is not valid. Start with db.select(...)

    if (summaryMode) {
      query = db.select({
        id: blogs.id, slug: blogs.slug, title: blogs.title, excerpt: blogs.excerpt,
        tags: blogs.tags, date: blogs.date, read_time: blogs.read_time, image: blogs.image, is_hidden: blogs.is_hidden
      }).from(blogs).where(whereClause).orderBy(desc(blogs.sort_order), desc(blogs.id)).limit(limit).offset(offset);
    } else {
      query = db.select().from(blogs).where(whereClause).orderBy(desc(blogs.sort_order), desc(blogs.id)).limit(limit).offset(offset);
    }

    const rows = await query;

    return {
      data: rows.map(mapRow),
      meta: {
        total: Number(total),
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(Number(total) / limit)
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

    const idRes = await db.select({ new_id: sql<number>`COALESCE(MAX(${blogs.id}), 0) + 1` }).from(blogs);
    const newId = idRes[0].new_id;

    // Generate Slug
    let slug = body.slug ? toSlug(body.slug) : toSlug(title);
    if (!slug) slug = `post-${newId}`;

    // Ensure uniqueness
    const slugCheck = await db.select({ id: blogs.id }).from(blogs).where(eq(blogs.slug, slug));
    if (slugCheck.length > 0) {
      slug = `${slug}-${newId}`;
    }

    // Get Max Sort Order to put new blog at top
    const sortRes = await db.select({ new_sort: sql<number>`COALESCE(MAX(${blogs.sort_order}), 0) + 1` }).from(blogs);
    const newSortOrder = sortRes[0].new_sort;

    const rows = await db.insert(blogs).values({
      id: newId,
      slug: slug,
      title: title,
      excerpt: excerpt,
      content: content,
      tags: tags,
      date: date,
      read_time: readTime,
      image: image,
      is_hidden: is_hidden || false,
      sort_order: newSortOrder
    }).returning();
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (date !== undefined) updateData.date = date;
    if (readTime !== undefined) updateData.read_time = readTime;
    if (image !== undefined) updateData.image = image;
    if (is_hidden !== undefined) updateData.is_hidden = is_hidden;
    if (requestedSlug !== undefined) updateData.slug = requestedSlug;

    const rows = await db.update(blogs)
      .set(updateData)
      .where(eq(blogs.id, parseInt(id!)))
      .returning();

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
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(blogs).where(eq(blogs.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '42501') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    revalidateTag('blogs', { expire: 0 });
  }
}
