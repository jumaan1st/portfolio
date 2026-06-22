import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { passwordResetOtp, config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Check if email matches admin, client, or view-only admin
        let userFound = false;

        // 1. Check admin
        const adminRows = await db.select().from(configTable).limit(1);
        if (adminRows.length > 0 && adminRows[0].admin_email.toLowerCase() === cleanEmail) {
            userFound = true;
        }

        // 2. Check client
        if (!userFound) {
            const clientRows = await db.select().from(clientTable).where(eq(clientTable.email, cleanEmail)).limit(1);
            if (clientRows.length > 0) {
                userFound = true;
            }
        }

        // 3. Check view-only admin
        if (!userFound) {
            const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.email, cleanEmail)).limit(1);
            if (viewAdminRows.length > 0) {
                userFound = true;
            }
        }

        if (!userFound) {
            return NextResponse.json({ error: 'No account registered with this email address.' }, { status: 404 });
        }

        // Generate a 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

        // Store OTP in database
        await db.insert(passwordResetOtp).values({
            email: cleanEmail,
            otp,
            expires_at: expiresAt,
            verified: false,
        });

        // Send the OTP email
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
                <h2 style="color: #4F46E5; margin-bottom: 20px;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your account. Please use the following verification code to proceed:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #EEF2F6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #666;">This verification code is valid for 15 minutes. If you did not make this request, you can safely ignore this email.</p>
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
            subject: `${otp} is your password reset code`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'Password reset code sent successfully' });
    } catch (error) {
        console.error('Password Reset OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send reset code. Please try again.' }, { status: 500 });
    }
}
