import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { path, type, resourceId, browser, referrer, userName, userEmail, userPhone } = body;
        const headersList = await headers();

        // Enrichment
        const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
        const userAgent = browser?.userAgent || headersList.get('user-agent') || '';

        // Geolocation from Vercel headers (or similar)
        const country = headersList.get('x-vercel-ip-country');
        const region = headersList.get('x-vercel-ip-country-region');
        const city = headersList.get('x-vercel-ip-city');
        const timezone = headersList.get('x-vercel-ip-timezone');
        const isp = headersList.get('x-vercel-ip-as-org'); // ISP Name

        // Generate UUID
        const requestId = crypto.randomUUID();

        // Database Insertion
        const client = await pool.connect();
        try {
            // Retention Policy
            await client.query(`
                DELETE FROM request_audit.request_context_log 
                WHERE id IN (
                    SELECT id FROM request_audit.request_context_log 
                    ORDER BY created_at DESC 
                    OFFSET 10000
                )
            `);

            const query = `
                INSERT INTO request_audit.request_context_log (
                    request_id,
                    http_method,
                    request_uri,
                    user_agent,
                    country_code,
                    country_name,
                    region_name,
                    city_name,
                    timezone,
                    isp_name,
                    browser_name,
                    operating_system,
                    device_type,
                    session_id,
                    user_name,
                    user_email,
                    user_phone,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
                )
            `;

            const isMobile = /Mobi|Android/i.test(userAgent);
            const deviceType = isMobile ? 'MOBILE' : 'DESKTOP';

            await client.query(query, [
                requestId,
                "GET",
                path,
                userAgent,
                country || null,
                null, // country_name
                region || null,
                city || null,
                timezone || null,
                isp || null,
                "Unknown", // Browser Name
                "Unknown", // OS
                deviceType,
                ip, // Storing IP in session_id
                userName || null,
                userEmail || null,
                userPhone || null
            ]);

        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Audit Log Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
