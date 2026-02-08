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

        const websiteLink = process.env.WESITE_LINK || 'https://jumaan.me';
        const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outreach/pixel?token=${app.tracking_token}`;

        const linkedIn = myProfile.linkedin || '#';
        const github = myProfile.github || '#';
        const cleanPhone = myProfile.phone ? myProfile.phone.replace(/[^0-9]/g, '') : '';
        const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi, I received your application and would like to chat.")}` : '#';

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
            .pc-font-alt { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important; }
        </style>
        </head>
        <body class="body pc-font-alt" style="width:100% !important;min-height:100% !important;margin:0 !important;padding:0 !important;mso-line-height-rule:exactly;background-color:#f9fafb;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;" bgcolor="#f9fafb">
            <table class="pc-project-body" style="table-layout:fixed;width:100%;min-width:600px;background-color:#f9fafb" bgcolor="#f9fafb" border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                    <td align="center" valign="top">
                        
                        <!-- Spacer -->
                        <div style="height: 40px;"></div>

                        <!-- Main Container -->
                        <table class="pc-component" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow: 0 10px 40px rgba(0,0,0,0.05);" width="600" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                            
                            <!-- Header / Hero (Simplified without broken images) -->
                            <tr>
                                <td style="padding: 40px 40px 30px 40px; background-color: #ffffff; text-align: center; border-bottom: 1px solid #f3f4f6;">
                                    <!-- Name/Logo -->
                                    <h1 style="margin: 0; font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">${myProfile.name || 'Jumaan'}</h1>
                                    <p style="margin: 8px 0 0; font-family: 'Inter', sans-serif; font-size: 15px; color: #6b7280; font-weight: 500;">${myProfile.role}</p>
                                </td>
                            </tr>

                            <!-- Content Body -->
                            <tr>
                                <td style="padding: 40px; background-color: #ffffff; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.7; color: #374151;">
                                    <!-- Content Body -->
                                    <div>
                                        ${body.replace(/\n/g, '<br/>')}
                                    </div>

                                    <!-- Resume Note -->
                                    ${attachResume ? `
                                    <div style="margin-top: 35px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display:flex; align-items:center; gap:12px;">
                                        <div style="background: #eff6ff; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📄</div>
                                        <div>
                                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Resume Attached</p>
                                            <p style="margin: 0; font-size: 12px; color: #64748b;">PDF Document</p>
                                        </div>
                                    </div>` : ''}

                                </td>
                            </tr>
                            
                            <!-- Call to Action / Footer Links -->
                            <tr>
                                <td style="padding: 30px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                                    <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #9ca3af;">
                                        &copy; ${new Date().getFullYear()} ${myProfile.name || 'Jumaan'} • ${myProfile.email}
                                    </p>
                                </td>
                            </tr>

                        </table>

                        <!-- Pixel (Invisible 1x1 GIF) -->
                        <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="height:1px !important;width:1px !important;border:0 !important;margin:0 !important;padding:0 !important;" />
                        
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
            from: `"${myProfile.name}" < ${ process.env.EMAIL_USER }> `,
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
            email_sent_count: sql`${ jobApplications.email_sent_count } + 1`
        }).where(eq(jobApplications.id, app.id));

        // 6. Log Thread History
        await db.insert(outreachThreads).values({
            application_id: app.id,
            content: `Subject: ${ subject } \n\n${ body } `,
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
