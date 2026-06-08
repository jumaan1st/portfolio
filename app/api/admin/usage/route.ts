import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiUsageLog, jobApplications } from '@/lib/schema';
import { desc, count, ilike, and, eq, or, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function checkAuth(req: Request) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return false;
    try {
        await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        return true;
    } catch {
        return false;
    }
}

export async function GET(req: Request) {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        
        // Pagination for AI logs
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        const search = searchParams.get('search');
        const provider = searchParams.get('provider'); // 'all', 'gemini', 'deepseek'
        const actionType = searchParams.get('actionType'); // 'all', 'chat', 'email_reply', etc.

        // Pagination for outreach applications
        const outreachPage = parseInt(searchParams.get('outreachPage') || '1');
        const outreachLimit = parseInt(searchParams.get('outreachLimit') || '10');
        const outreachOffset = (outreachPage - 1) * outreachLimit;

        // 1. Build AI Log Query
        const aiConditions = [];
        if (search) {
            aiConditions.push(or(
                ilike(aiUsageLog.user_name, `%${search}%`),
                ilike(aiUsageLog.user_email, `%${search}%`)
            ));
        }
        if (provider && provider !== 'all') {
            aiConditions.push(eq(aiUsageLog.provider, provider.toLowerCase()));
        }
        if (actionType && actionType !== 'all') {
            aiConditions.push(eq(aiUsageLog.action_type, actionType));
        }

        const aiWhere = aiConditions.length > 0 ? and(...aiConditions) : undefined;

        // Fetch AI Logs counts and data
        const aiCountRes = await db.select({ count: count() }).from(aiUsageLog).where(aiWhere);
        const totalAi = aiCountRes[0].count;

        const logs = await db.select()
            .from(aiUsageLog)
            .where(aiWhere)
            .orderBy(desc(aiUsageLog.created_at))
            .limit(limit)
            .offset(offset);

        // 2. Fetch AI Token Aggregates (Cumulative Stats)
        const aggregatesRes = await db.select({
            totalTokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            promptTokens: sql<string>`COALESCE(SUM(${aiUsageLog.prompt_tokens}), 0)`,
            completionTokens: sql<string>`COALESCE(SUM(${aiUsageLog.completion_tokens}), 0)`,
            totalRequests: count()
        }).from(aiUsageLog);

        const aggregates = {
            totalTokens: parseInt(aggregatesRes[0]?.totalTokens || '0'),
            promptTokens: parseInt(aggregatesRes[0]?.promptTokens || '0'),
            completionTokens: parseInt(aggregatesRes[0]?.completionTokens || '0'),
            totalRequests: aggregatesRes[0]?.totalRequests || 0
        };

        // Group by provider
        const providerStatsRes = await db.select({
            provider: aiUsageLog.provider,
            tokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            requests: count()
        })
        .from(aiUsageLog)
        .groupBy(aiUsageLog.provider);

        const providers = providerStatsRes.map(row => ({
            provider: row.provider || 'unknown',
            tokens: parseInt(row.tokens || '0'),
            requests: row.requests
        }));

        // Group by action type
        const actionStatsRes = await db.select({
            action: aiUsageLog.action_type,
            tokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            requests: count()
        })
        .from(aiUsageLog)
        .groupBy(aiUsageLog.action_type);

        const actions = actionStatsRes.map(row => ({
            action: row.action,
            tokens: parseInt(row.tokens || '0'),
            requests: row.requests
        }));

        // 3. Fetch Outreach/Job Applications (Paginated)
        const jobAppsCount = await db.select({ count: count() }).from(jobApplications);
        const totalApps = jobAppsCount[0].count;

        const applications = await db.select()
            .from(jobApplications)
            .orderBy(desc(jobApplications.created_at))
            .limit(outreachLimit)
            .offset(outreachOffset);

        return NextResponse.json({
            success: true,
            aiLogs: {
                logs,
                pagination: {
                    total: totalAi,
                    page,
                    limit,
                    totalPages: Math.ceil(totalAi / limit)
                }
            },
            outreachLogs: {
                applications,
                pagination: {
                    total: totalApps,
                    page: outreachPage,
                    limit: outreachLimit,
                    totalPages: Math.ceil(totalApps / outreachLimit)
                }
            },
            stats: {
                aggregates,
                providers,
                actions
            }
        });

    } catch (error) {
        console.error('Usage Admin API Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
