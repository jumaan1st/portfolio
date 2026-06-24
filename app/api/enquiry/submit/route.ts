import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { enquiry, enquiryOtp, config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { name, email, subject, message, otp } = await request.json();

        if (!name || !email || !subject || !message || !otp) {
            return NextResponse.json({ error: 'All fields, including the OTP, are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // 1. Check if email matches main admin
        const adminRows = await db.select({ email: configTable.admin_email }).from(configTable).limit(1);
        if (adminRows.length > 0 && adminRows[0].email.toLowerCase() === cleanEmail) {
            return NextResponse.json({ error: 'This email is registered to the administrator. Please log in.' }, { status: 400 });
        }

        // 2. Check if email matches client
        const clientRows = await db.select().from(clientTable).where(eq(clientTable.email, cleanEmail)).limit(1);
        if (clientRows.length > 0) {
            return NextResponse.json({ error: 'An account is already associated with this email. Please log in to your Client Portal to request a project.' }, { status: 400 });
        }

        // 3. Check if email matches view-only admin
        const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.email, cleanEmail)).limit(1);
        if (viewAdminRows.length > 0) {
            return NextResponse.json({ error: 'This email is registered to a view-only administrator. Please log in.' }, { status: 400 });
        }
        const cleanOtp = otp.trim();

        // 1. Verify OTP
        const now = new Date();
        const matchingOtps = await db.select()
            .from(enquiryOtp)
            .where(
                and(
                    eq(enquiryOtp.email, cleanEmail),
                    eq(enquiryOtp.otp, cleanOtp),
                    gt(enquiryOtp.expires_at, now),
                    eq(enquiryOtp.verified, false)
                )
            )
            .orderBy(desc(enquiryOtp.expires_at))
            .limit(1);

        if (matchingOtps.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }

        const otpRecord = matchingOtps[0];

        // 2. Mark OTP as verified to prevent reuse
        await db.update(enquiryOtp)
            .set({ verified: true })
            .where(eq(enquiryOtp.id, otpRecord.id));

        // 3. Create the Enquiry
        await db.insert(enquiry).values({
            name: name.trim(),
            email: cleanEmail,
            subject: subject.trim(),
            message: message.trim(),
            status: 'Pending',
        });

        // 4. Send Confirmation Email to Client (CC Admin)
        try {
            const adminEmail = adminRows.length > 0 ? adminRows[0].email : process.env.EMAIL_USER;
            if (adminEmail) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const emailHtml = `
                <!DOCTYPE html>
                <html>
                <body style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #4F46E5; margin-bottom: 20px;">We Received Your Enquiry</h2>
                        <p>Hi ${name.trim()},</p>
                        <p>Thank you for reaching out! We have received your collaboration enquiry regarding <strong>"${subject.trim()}"</strong>.</p>
                        <p>We will get back to you and will typically respond in 24 hours.</p>
                        
                        <div style="background-color: #EEF2F6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Copy of Your Request:</strong></p>
                            <p style="margin: 0 0 5px 0;"><strong>Name:</strong> ${name.trim()}</p>
                            <p style="margin: 0 0 5px 0;"><strong>Email:</strong> ${cleanEmail}</p>
                            <p style="margin: 0 0 5px 0;"><strong>Subject:</strong> ${subject.trim()}</p>
                            <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
                            <p style="margin: 0; white-space: pre-wrap; background: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px;">${message.trim()}</p>
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Freelance Engineering Portal</p>
                    </div>
                </body>
                </html>
                `;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: cleanEmail,
                    cc: adminEmail,
                    subject: `Enquiry Received: ${subject.trim()}`,
                    html: emailHtml,
                });
            }
        } catch (emailError) {
            console.error('Failed to send enquiry confirmation email:', emailError);
        }

        return NextResponse.json({ success: true, message: 'Enquiry submitted successfully' });
    } catch (error) {
        console.error('Enquiry Submission Error:', error);
        return NextResponse.json({ error: 'Failed to submit enquiry. Please try again.' }, { status: 500 });
    }
}
