import { NextResponse } from 'next/server';
import pool from '@/lib/db';
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

        if (!sessionId || !events || !Array.isArray(events)) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
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
        // Map device type: console, mobile, tablet, smarttv, wearable, embedded. Default to 'desktop' if undefined.
        const deviceType = result.device.type || 'desktop';

        // User Identity Extraction
        const userName = identity?.name || null;
        const userEmail = identity?.email || null;
        const userPhone = identity?.phone || null;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            console.log(`[Audit] Processing session ${sessionId} - Events: ${events.length}`);

            // 1. Fetch existing history to ensure uniqueness
            // We lock the row to avoid race conditions during the read-modify-write cycle
            const existingRes = await client.query(
                `SELECT visit_history FROM request_audit.sessions WHERE session_id = $1 FOR UPDATE`,
                [sessionId]
            );

            let finalHistory: LogEvent[] = events;

            if (existingRes.rows.length > 0) {
                const currentHistory: LogEvent[] = existingRes.rows[0].visit_history || [];
                const existingPaths = new Set(currentHistory.map(e => e.path));

                // Filter new events: Only add if path hasn't been visited in this session
                const uniqueNewEvents = events.filter(e => !existingPaths.has(e.path));

                if (uniqueNewEvents.length > 0) {
                    finalHistory = [...currentHistory, ...uniqueNewEvents];
                } else {
                    finalHistory = currentHistory; // No new unique pages
                }
            } else {
                // New session: Ensure uniqueness within the batch itself
                const seen = new Set<string>();
                finalHistory = events.filter(e => {
                    if (seen.has(e.path)) return false;
                    seen.add(e.path);
                    return true;
                });
            }

            // 2. Upsert Session with FINAL history
            // We use EXCLUDED.visit_history to set the new computed full history
            const query = `
                WITH upsert AS (
                    INSERT INTO request_audit.sessions (
                        session_id, 
                        ip_address, 
                        user_identity, 
                        visit_history, 
                        device_info, 
                        geo_info, 
                        last_active_at,
                        browser_name,
                        operating_system,
                        device_type,
                        country_name,
                        city_name,
                        user_name,
                        user_email,
                        user_phone
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (session_id) 
                    DO UPDATE SET 
                        visit_history = EXCLUDED.visit_history, -- REPLACE with our pre-calculated unique list
                        last_active_at = NOW(),
                        user_identity = COALESCE(EXCLUDED.user_identity, request_audit.sessions.user_identity),
                        ip_address = EXCLUDED.ip_address,
                        device_info = COALESCE(EXCLUDED.device_info, request_audit.sessions.device_info),
                        geo_info = COALESCE(EXCLUDED.geo_info, request_audit.sessions.geo_info),
                        browser_name = COALESCE(EXCLUDED.browser_name, request_audit.sessions.browser_name),
                        operating_system = COALESCE(EXCLUDED.operating_system, request_audit.sessions.operating_system),
                        device_type = COALESCE(EXCLUDED.device_type, request_audit.sessions.device_type),
                        country_name = COALESCE(EXCLUDED.country_name, request_audit.sessions.country_name),
                        city_name = COALESCE(EXCLUDED.city_name, request_audit.sessions.city_name),
                        user_name = COALESCE(EXCLUDED.user_name, request_audit.sessions.user_name),
                        user_email = COALESCE(EXCLUDED.user_email, request_audit.sessions.user_email),
                        user_phone = COALESCE(EXCLUDED.user_phone, request_audit.sessions.user_phone)
                    RETURNING session_id
                )
                DELETE FROM request_audit.sessions
                WHERE session_id IN (
                    SELECT session_id 
                    FROM request_audit.sessions 
                    ORDER BY last_active_at DESC 
                    OFFSET 1000
                )
                AND session_id != $1;
            `;

            await client.query(query, [
                sessionId,
                ip,
                JSON.stringify(identity || {}),
                JSON.stringify(finalHistory), // Pass the DUPLICATE-FREE list
                JSON.stringify(deviceInfo || {}),
                JSON.stringify(geoInfo),
                browserName,
                osName,
                deviceType,
                countryName,
                cityName,
                userName,
                userEmail,
                userPhone
            ]);

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error("Transaction Error", e);
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session Log Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
