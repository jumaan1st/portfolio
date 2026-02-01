import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobApplications, profile, outreachThreads } from '@/lib/schema';
import { eq, sql, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { applicationId, subject, body, attachResume } = await req.json();

        if (!applicationId || !subject || !body) {
            return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });
        }

        const [app] = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId));
        if (!app) return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });

        // 1. Fetch Profile for Resume & Template Data
        const [myProfile] = await db.select().from(profile).limit(1);

        // 2. Prepare Attachments
        const attachments = [];
        // Only attach if requested AND url exists. 
        if (attachResume && myProfile.resume_url) {
            // Nodemailer supports URL paths for attachments
            attachments.push({
                filename: `${(myProfile.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`,
                path: myProfile.resume_url
            });
        }

        // 3. Construct HTML Template
        const websiteLink = process.env.WESITE_LINK || 'https://jumaan.me';
        const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outreach/pixel?token=${app.tracking_token}`;

        const linkedIn = myProfile.linkedin || '#';
        const github = myProfile.github || '#';

        // Adapted from User's "Postcards" Template
        const htmlTemplate = `
        <!DOCTYPE html>
        <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400;0,500;0,600;0,700" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css?family=Poppins:ital,wght@0,400;0,600" rel="stylesheet" />
        <style>
            html,body{margin:0 !important;padding:0 !important;min-height:100% !important;width:100% !important;-webkit-font-smoothing:antialiased;}
            *{-ms-text-size-adjust:100%;}
            .ExternalClass{width:100%;}
            div, p, a, li, td { -webkit-text-size-adjust:none; }
            .pc-font-alt { font-family: 'Inter', Arial, Helvetica, sans-serif !important; }
        </style>
        </head>
        <body class="body pc-font-alt" style="width:100% !important;min-height:100% !important;margin:0 !important;padding:0 !important;mso-line-height-rule:exactly;background-color:#b49dd7;font-family:'Inter',sans-serif;" bgcolor="#b49dd7">
            <table class="pc-project-body" style="table-layout:fixed;width:100%;min-width:600px;background-color:#b49dd7" bgcolor="#b49dd7" border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                    <td align="center" valign="top">
                        
                        <!-- Spacer -->
                        <div style="height: 40px;"></div>

                        <!-- Main Container -->
                        <table class="pc-component" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow: 0 10px 20px rgba(0,0,0,0.1);" width="600" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                            
                            <!-- Header / Hero (Simplified without broken images) -->
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; background-color: #321a59; text-align: center;">
                                    <!-- Name/Logo -->
                                    <h1 style="margin: 0; font-family: 'Poppins', sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">${myProfile.name || 'Jumaan'}</h1>
                                    <p style="margin: 5px 0 0; font-family: 'Inter', sans-serif; font-size: 16px; color: #b49dd7; font-weight: 500;">${myProfile.role}</p>
                                </td>
                            </tr>

                            <!-- Content Body -->
                            <tr>
                                    <!-- Content Body -->
                                    <!-- Greeting Removed (AI handles it) -->
                                    <div style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; color: #565558;">
                                        ${body}
                                    </div>

                                    <!-- Portfolio CTA -->
                                    <div style="margin-top: 25px; text-align: center;">
                                        <a href="${websiteLink}" style="background-color: #321a59; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View My Portfolio</a>
                                    </div>

                                    <!-- Resume Note -->
                                    ${attachResume ? `
                                    <div style="margin-top: 30px; padding: 15px; background-color: #f3f0f9; border-left: 4px solid #321a59; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 14px; color: #321a59; font-weight: 600;">📎 Resume attached for your review.</p>
                                    </div>` : ''}

                                </td>
                            </tr>
                            
                            <!-- Call to Action / Footer Links -->
                            <tr>
                                <td style="padding: 0 40px 40px 40px; background-color: #ffffff;">
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                        <tr>
                                            <td align="center" style="padding-top: 20px; border-top: 1px solid #eee;">
                                                <a href="${websiteLink}" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">Portfolio</a>
                                                <a href="${linkedIn}" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">LinkedIn</a>
                                                <a href="${github}" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">GitHub</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>

                        <!-- Bottom Signature -->
                        <table width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                                <td align="center" style="padding: 20px; font-family: 'Inter', sans-serif; font-size: 12px; color: #321a59;">
                                    <p style="margin: 0; opacity: 0.7;">&copy; ${new Date().getFullYear()} ${myProfile.name}. All rights reserved.</p>
                                    <p style="margin: 5px 0 0; opacity: 0.5;">
                                        ${myProfile.email} ${myProfile.phone ? `• ${myProfile.phone}` : ''}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Pixel -->
                        <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />
                        
                        <!-- Spacer -->
                        <div style="height: 40px;"></div>

                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        // 4. Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"${myProfile.name}" <${process.env.EMAIL_USER}>`,
            to: app.contact_email,
            cc: process.env.EMAIL_USER,
            subject: subject,
            html: htmlTemplate,
            attachments: attachments
        });

        // 5. Update DB
        await db.update(jobApplications).set({
            status: 'Sent',
            last_contacted_at: new Date(),
            email_sent_count: sql`${jobApplications.email_sent_count} + 1`
        }).where(eq(jobApplications.id, app.id));

        // 6. Log Thread History
        await db.insert(outreachThreads).values({
            application_id: app.id,
            content: `Subject: ${subject}\n\n${body}`,
            direction: 'outbound'
        });

        // 7. Enforce Storage Limit (Keep only last 5 messages per application)
        const threads = await db.select({ id: outreachThreads.id })
            .from(outreachThreads)
            .where(eq(outreachThreads.application_id, app.id))
            .orderBy(desc(outreachThreads.sent_at));

        if (threads.length > 5) {
            const threadsToDelete = threads.slice(5).map(t => t.id);
            // Delete oldest messages
            // Note: Drizzle's delete with 'inArray' needs the operator import, 
            // but we can loop or use a raw query if specific imports are missing.
            // Let's assume we can map promises for simplicity if 'inArray' isn't available,
            // or better yet, verify imports. We have 'eq' and 'sql'.
            // Let's use loop for safety if 'inArray' is not imported, or just import it.
            // Re-checking imports at top of file... Only 'eq' and 'sql' are imported.
            // I'll stick to a loop for now or fetch IDs and delete.
            for (const thread of threadsToDelete) {
                await db.delete(outreachThreads).where(eq(outreachThreads.id, thread));
            }
        }

        return NextResponse.json({ success: true, message: 'Sent successfully' });

    } catch (error) {
        console.error('Email Send Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
