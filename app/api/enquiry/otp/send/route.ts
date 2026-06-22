import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enquiryOtp, config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

        // Generate a 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Store OTP in database
        await db.insert(enquiryOtp).values({
            email: cleanEmail,
            otp,
            expires_at: expiresAt,
            verified: false,
        });

        // Send the OTP email via nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h2 style="color: #4F46E5; margin-bottom: 20px;">Email Verification</h2>
                <p>Hello,</p>
                <p>You requested an OTP verification for submitting an enquiry on the portfolio. Please use the following code to verify your email address:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #EEF2F6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #666;">This verification code is valid for 15 minutes. Please do not share this code with anyone.</p>
                <br>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999; text-align: center;">Freelance Engineering Portal</p>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: `${otp} is your verification code`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }
}
