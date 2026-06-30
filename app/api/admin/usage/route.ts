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

        // Helper to calculate exact cost
        const calculateCost = (prov: string | null, prompt: number, completion: number) => {
            const p = (prov || '').toLowerCase();
            if (p === 'deepseek') {
                return (prompt * 0.14 + completion * 0.28) / 1000000;
            } else if (p === 'gemini') {
                return (prompt * 0.075 + completion * 0.30) / 1000000;
            } else {
                return ((prompt + completion) * 0.15) / 1000000;
            }
        };

        // Attach cost to each paginated log
        const logsWithCost = logs.map(l => ({
            ...l,
            cost: parseFloat(calculateCost(l.provider, l.prompt_tokens || 0, l.completion_tokens || 0).toFixed(6))
        }));

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
            totalRequests: aggregatesRes[0]?.totalRequests || 0,
            totalCost: 0 // Will compute below
        };

        // Group by provider with prompt/completion splits for cost calculation
        const providerStatsRes = await db.select({
            provider: aiUsageLog.provider,
            tokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            promptTokens: sql<string>`COALESCE(SUM(${aiUsageLog.prompt_tokens}), 0)`,
            completionTokens: sql<string>`COALESCE(SUM(${aiUsageLog.completion_tokens}), 0)`,
            requests: count()
        })
        .from(aiUsageLog)
        .groupBy(aiUsageLog.provider);

        const providers = providerStatsRes.map(row => {
            const prompt = parseInt(row.promptTokens || '0');
            const completion = parseInt(row.completionTokens || '0');
            const cost = calculateCost(row.provider, prompt, completion);
            return {
                provider: row.provider || 'unknown',
                tokens: parseInt(row.tokens || '0'),
                promptTokens: prompt,
                completionTokens: completion,
                requests: row.requests,
                cost: parseFloat(cost.toFixed(6))
            };
        });

        // Compute total cost across all providers
        aggregates.totalCost = parseFloat(providers.reduce((acc, curr) => acc + curr.cost, 0).toFixed(4));

        // Group by action type and provider for precise action-type cost calculation
        const actionStatsRes = await db.select({
            action: aiUsageLog.action_type,
            provider: aiUsageLog.provider,
            tokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            promptTokens: sql<string>`COALESCE(SUM(${aiUsageLog.prompt_tokens}), 0)`,
            completionTokens: sql<string>`COALESCE(SUM(${aiUsageLog.completion_tokens}), 0)`,
            requests: count()
        })
        .from(aiUsageLog)
        .groupBy(aiUsageLog.action_type, aiUsageLog.provider);

        const actionMap: { [action: string]: { action: string, tokens: number, requests: number, cost: number } } = {};
        for (const row of actionStatsRes) {
            const action = row.action;
            const prompt = parseInt(row.promptTokens || '0');
            const completion = parseInt(row.completionTokens || '0');
            const cost = calculateCost(row.provider, prompt, completion);

            if (!actionMap[action]) {
                actionMap[action] = { action, tokens: 0, requests: 0, cost: 0 };
            }
            actionMap[action].tokens += parseInt(row.tokens || '0');
            actionMap[action].requests += row.requests;
            actionMap[action].cost += cost;
        }

        const actions = Object.values(actionMap).map(a => ({
            ...a,
            cost: parseFloat(a.cost.toFixed(6))
        }));

        // Fetch Top 5 most active AI users
        const topUsersRes = await db.select({
            email: aiUsageLog.user_email,
            name: aiUsageLog.user_name,
            tokens: sql<string>`COALESCE(SUM(${aiUsageLog.total_tokens}), 0)`,
            requests: count()
        })
        .from(aiUsageLog)
        .groupBy(aiUsageLog.user_email, aiUsageLog.user_name)
        .orderBy(desc(count()))
        .limit(5);

        const topUsers = topUsersRes.map(row => ({
            email: row.email || 'unknown',
            name: row.name || 'Guest',
            tokens: parseInt(row.tokens || '0'),
            requests: row.requests
        }));

        // Fetch system settings status
        let deepseekBalance: any = null;
        if (process.env.DEEPSEEK_API_KEY) {
            try {
                const balanceRes = await fetch('https://api.deepseek.com/user/balance', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
                    }
                });
                if (balanceRes.ok) {
                    deepseekBalance = await balanceRes.json();
                }
            } catch (e) {
                console.error("[UsageAPI] Failed to fetch DeepSeek balance:", e);
            }
        }

        const systemConfig = {
            defaultProvider: process.env.AI_PROVIDER || 'auto',
            geminiConfigured: !!process.env.GEMINI_API_KEY,
            deepseekConfigured: !!process.env.DEEPSEEK_API_KEY,
            deepseekBalance
        };

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
                logs: logsWithCost,
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
                actions,
                topUsers
            },
            systemConfig
        });

    } catch (error) {
        console.error('Usage Admin API Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
