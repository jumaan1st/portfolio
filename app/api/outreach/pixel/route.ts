import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobApplications, sessions } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';

// Transparent 1x1 GIF
const TRANSPARENT_GIF = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Always return the image eventually to avoid broken image icons
    try {
        if (token) {
            // 1. Find the application
            const apps = await db.select().from(jobApplications).where(eq(jobApplications.tracking_token, token));

            if (apps.length > 0) {
                const app = apps[0];

                // 2. Update stats (Critical update)
                try {
                    await db.update(jobApplications).set({
                        email_opens: sql`${jobApplications.email_opens} + 1`,
                        last_opened_at: new Date()
                    }).where(eq(jobApplications.id, app.id));
                    console.log(`[Outreach] Pixel open registered for ${app.company_name} (${app.contact_email})`);
                } catch (updateErr) {
                    console.error("Failed to update email open count:", updateErr);
                }

                // 3. Log detailed session info (Non-critical, wrap separately to prevent failures from blocking open count)
                try {
                    const sessionId = uuidv4();
                    const headersList = await headers();
                    let ip = headersList.get('x-forwarded-for') || '127.0.0.1';
                    
                    // Clean x-forwarded-for by taking first IP and truncating to fit 45 chars
                    if (ip.includes(',')) {
                        ip = ip.split(',')[0].trim();
                    }
                    ip = ip.substring(0, 45);

                    const userAgent = headersList.get('user-agent') || 'Unknown';

                    // Basic Geo
                    const geoInfo = {
                        country: headersList.get('x-vercel-ip-country'),
                        city: headersList.get('x-vercel-ip-city'),
                        region: headersList.get('x-vercel-ip-country-region')
                    };

                    const parser = new UAParser(userAgent);
                    const result = parser.getResult();

                    // Log as a "Recruiter Encounter" in the main session log
                    await db.insert(sessions).values({
                        session_id: sessionId,
                        ip_address: ip,
                        user_identity: {
                            name: `[Recruiter] ${app.contact_name}`,
                            email: app.contact_email,
                            company: app.company_name,
                            role: 'Recruiter'
                        },
                        visit_history: [{
                            path: '/email/open',
                            timestamp: new Date().toISOString(),
                            meta: 'Email Tracking Pixel'
                        }],
                        device_info: {
                            userAgent,
                            screen: 'Email Client',
                        },
                        geo_info: geoInfo,
                        started_at: new Date(),
                        last_active_at: new Date(),
                        browser_name: result.browser.name,
                        operating_system: result.os.name,
                        device_type: result.device.type || 'desktop'
                    });
                    console.log(`[Outreach] Created session log for recruiter visit of ${app.company_name}`);
                } catch (sessionErr) {
                    console.error("Failed to log tracking session:", sessionErr);
                }
            }
        }
    } catch (e) {
        console.error("General pixel tracking error:", e);
    }

    return new NextResponse(TRANSPARENT_GIF, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
}

