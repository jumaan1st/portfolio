import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

// Define interfaces for better type safety
interface LogEvent {
    path: string;
    timestamp: string;
}

interface UserIdentity {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
}

interface SessionPayload {
    sessionId: string;
    events: LogEvent[];
    identity?: UserIdentity;
    deviceInfo?: {
        userAgent?: string;
        screen?: string;
        language?: string;
    };
}

export async function POST(req: Request) {
    try {
        const body: SessionPayload = await req.json();
        const { sessionId, events, identity, deviceInfo } = body;

        // Basic validation including UUID format check
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!sessionId || !uuidRegex.test(sessionId) || !events || !Array.isArray(events)) {
            return NextResponse.json({ success: false, error: 'Invalid payload or UUID' }, { status: 400 });
        }

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

        // Geo info from headers (Vercel specific)
        const countryName = headersList.get('x-vercel-ip-country') || null;
        const cityName = headersList.get('x-vercel-ip-city') || null;

        const geoInfo = {
            country: countryName,
            region: headersList.get('x-vercel-ip-country-region'),
            city: cityName,
            isp: headersList.get('x-vercel-ip-as-org'),
            latitude: headersList.get('x-vercel-ip-latitude'),
            longitude: headersList.get('x-vercel-ip-longitude')
        };

        // Parse User Agent
        const userAgent = headersList.get('user-agent') || deviceInfo?.userAgent || '';
        const parser = new UAParser(userAgent);
        const result = parser.getResult();

        const browserName = result.browser.name || null;
        const osName = result.os.name || null;
        const deviceType = result.device.type || 'desktop';

        // User Identity Extraction
        const userName = identity?.name || null;
        const userEmail = identity?.email || null;
        const userPhone = identity?.phone || null;

        let returnNextResponse: NextResponse | null = null;

        // Drizzle Transaction
        await db.transaction(async (tx) => {
            console.log(`[Audit] Processing session ${sessionId} - Events: ${events.length}`);

            // 1. Fetch existing session
            const existing = await tx.select().from(sessions).where(eq(sessions.session_id, sessionId));

            let currentHistory: LogEvent[] = [];
            let isNewSession = true;
            let activeSessionId = sessionId; // The ID we will actually write to (might change if rotated)
            let sessionRotated = false;

            if (existing.length > 0) {
                const row = existing[0];
                const lastActive = row.last_active_at ? new Date(row.last_active_at).getTime() : 0;
                const now = new Date().getTime();

                // TIMEOUT CHECK (30 mins)
                if ((now - lastActive) > 30 * 60 * 1000) {
                    // Session Expired -> Rotate
                    console.log(`[Audit] Session ${sessionId} expired (Last active: ${row.last_active_at}). Rotating.`);

                    // Generate NEW Session ID
                    const crypto = require('crypto');
                    activeSessionId = crypto.randomUUID();
                    sessionRotated = true;
                    isNewSession = true; // Treat as new insertion
                    currentHistory = []; // Start fresh
                } else {
                    // Continue existing
                    isNewSession = false;
                    currentHistory = (row.visit_history as LogEvent[]) || [];
                }
            }

            // Calculate History
            // We filter new events to avoid duplicates if client retries
            const existingPaths = new Set(currentHistory.map(e => e.path + e.timestamp)); // Composite key for better dedup
            const uniqueNewEvents = events.filter(e => !existingPaths.has(e.path + e.timestamp));

            // If it's a new session (or rotated), we just take the new events.
            // If continuing, we append.
            const finalHistory = isNewSession ? uniqueNewEvents : [...currentHistory, ...uniqueNewEvents];

            const nowTime = new Date();

            if (isNewSession) {
                await tx.insert(sessions).values({
                    session_id: activeSessionId,
                    ip_address: ip,
                    user_identity: identity || {},
                    visit_history: finalHistory,
                    device_info: deviceInfo || {},
                    geo_info: geoInfo,
                    last_active_at: nowTime,
                    browser_name: browserName,
                    operating_system: osName,
                    device_type: deviceType,
                    country_name: countryName,
                    city_name: cityName,
                    user_name: userName,
                    user_email: userEmail,
                    user_phone: userPhone,
                    started_at: nowTime
                });
            } else {
                await tx.update(sessions).set({
                    visit_history: finalHistory,
                    last_active_at: nowTime,
                    // Merge identity if provided, otherwise keep existing
                    user_identity: identity && Object.keys(identity).length > 0 ? identity : undefined,
                    ip_address: ip, // Update IP if changed
                    device_info: deviceInfo ? deviceInfo : undefined,
                    geo_info: geoInfo,
                }).where(eq(sessions.session_id, activeSessionId));
            }

            // Retention cleanup
            // Using raw SQL for complex deletion logic, ensuring UUID type safety
            await tx.execute(sql`
                DELETE FROM request_audit.sessions
                WHERE session_id IN (
                    SELECT session_id 
                    FROM request_audit.sessions 
                    ORDER BY last_active_at DESC 
                    OFFSET 1000
                )
                AND session_id <> ${activeSessionId}::uuid
            `);

            // If we rotated, we MUST tell the client the new ID
            if (sessionRotated) {
                returnNextResponse = NextResponse.json({ success: true, newSessionId: activeSessionId });
            }
        });

        if (returnNextResponse) return returnNextResponse;


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session Log Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
