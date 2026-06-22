import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { passwordResetOtp } from '@/lib/schema';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        const adminEmail = verified.payload.email as string;

        if (role !== 'admin' || !adminEmail) {
            return NextResponse.json({ error: 'Forbidden: Only the main administrator can delete clients' }, { status: 403 });
        }

        // Generate a 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

        // Store OTP in database
        await db.insert(passwordResetOtp).values({
            email: adminEmail.toLowerCase().trim(),
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
                <h2 style="color: #DC2626; margin-bottom: 20px;">Client Deletion Request Verification Code</h2>
                <p>Hello Administrator,</p>
                <p>We received a request to permanently delete a client and all their projects from the freelance engineering portal. Please use the following verification code to confirm and finalize this action:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #DC2626; background-color: #FEF2F2; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0; border: 1px solid #FEE2E2;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #E11D48; font-weight: 500;">Warning: This action is irreversible. All client projects, statistics, and chat discussions will be permanently deleted.</p>
                <p style="font-size: 13px; color: #666; margin-top: 10px;">This code is valid for 15 minutes. If you did not initiate this client deletion request, please secure your administrative account credentials immediately.</p>
                <br>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999; text-align: center;">Freelance Engineering Portal</p>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: `Action Required: Client Deletion Verification Code (${otp})`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'Verification code sent successfully' });

    } catch (error) {
        console.error('Client Deletion OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }
}
