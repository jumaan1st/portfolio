import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { review as reviewTable } from '@/lib/schema';
import { desc, count, ilike, and, eq, or, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function checkAuth(req: Request, allowViewOnly = false) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return false;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        return role === 'admin' || (allowViewOnly && role === 'view_only_admin');
    } catch {
        return false;
    }
}

export async function GET(req: Request) {
    const isAuthed = await checkAuth(req, true);
    if (!isAuthed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        const type = searchParams.get('type') || 'all'; // 'all', 'review', 'contact'
        const stars = searchParams.get('stars');
        const search = searchParams.get('search');
        const userEmail = searchParams.get('userEmail');

        const conditions = [];

        if (type === 'review') {
            conditions.push(ilike(reviewTable.feedback, '[Project Review]%'));
        } else if (type === 'contact') {
            conditions.push(ilike(reviewTable.feedback, '[Contact]%'));
        }

        if (stars) {
            conditions.push(eq(reviewTable.stars, parseInt(stars)));
        }

        if (search) {
            conditions.push(or(
                ilike(reviewTable.name, `%${search}%`),
                ilike(reviewTable.email, `%${search}%`)
            ));
        }

        if (userEmail && userEmail !== 'all') {
            conditions.push(eq(reviewTable.email, userEmail));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Fetch counts
        const countRes = await db.select({ count: count() }).from(reviewTable).where(whereClause);
        const total = countRes[0].count;

        // Fetch reviews
        const reviews = await db.select()
            .from(reviewTable)
            .where(whereClause)
            .orderBy(desc(reviewTable.created_at))
            .limit(limit)
            .offset(offset);

        // Fetch unique users (by email only) for the filter dropdown
        // Group only by email so that name variations for the same email don't produce duplicates
        const uniqueUsersRaw = await db.select({
            name: sql<string>`MIN(${reviewTable.name})`,
            email: reviewTable.email
        })
        .from(reviewTable)
        .groupBy(reviewTable.email)
        .orderBy(reviewTable.email);

        // Extra dedup safeguard in JS (in case DB returns duplicates)
        const seenEmails = new Set<string>();
        const uniqueUsers = uniqueUsersRaw.filter(u => {
            if (seenEmails.has(u.email)) return false;
            seenEmails.add(u.email);
            return true;
        });

        // Calculate Stats for KPI Cards (Only for Reviews)
        const statsRes = await db.select({
            totalReviews: count(),
            avgRating: sql<string>`COALESCE(AVG(${reviewTable.stars}), 0)`
        })
        .from(reviewTable)
        .where(ilike(reviewTable.feedback, '[Project Review]%'));

        const totalReviewsCount = statsRes[0]?.totalReviews || 0;
        const averageRating = parseFloat(parseFloat(statsRes[0]?.avgRating || '0').toFixed(1));

        // Star breakdown
        const starBreakdownRes = await db.select({
            stars: reviewTable.stars,
            count: count()
        })
        .from(reviewTable)
        .where(ilike(reviewTable.feedback, '[Project Review]%'))
        .groupBy(reviewTable.stars);

        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        starBreakdownRes.forEach(row => {
            if (row.stars >= 1 && row.stars <= 5) {
                breakdown[row.stars as 1 | 2 | 3 | 4 | 5] = row.count;
            }
        });

        // Contact count vs Review count
        const countsRes = await Promise.all([
            db.select({ count: count() }).from(reviewTable).where(ilike(reviewTable.feedback, '[Project Review]%')),
            db.select({ count: count() }).from(reviewTable).where(ilike(reviewTable.feedback, '[Contact]%'))
        ]);

        return NextResponse.json({
            success: true,
            reviews,
            users: uniqueUsers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                totalReviews: totalReviewsCount,
                averageRating,
                starBreakdown: breakdown,
                reviewsCount: countsRes[0][0].count,
                contactsCount: countsRes[1][0].count
            }
        });

    } catch (error) {
        console.error('Reviews Admin API Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const isAuthed = await checkAuth(req, false);
    if (!isAuthed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
        }

        await db.delete(reviewTable).where(eq(reviewTable.review_id, parseInt(id)));

        return NextResponse.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Review Delete Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
