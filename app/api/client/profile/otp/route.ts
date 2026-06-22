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

        if (role !== 'client') {
            return NextResponse.json({ error: 'Forbidden: Only clients can request profile update OTP' }, { status: 403 });
        }

        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

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
                <h2 style="color: #4F46E5; margin-bottom: 20px;">Profile Update Verification Code</h2>
                <p>Hello,</p>
                <p>We received a request to update the profile details for your freelance services account. Please use the following verification code to confirm and apply the changes:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #EEF2F6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #666;">This verification code is valid for 15 minutes. If you did not initiate this profile update, please check your account security settings.</p>
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
            subject: `${otp} is your profile update verification code`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'Verification code sent successfully' });

    } catch (error) {
        console.error('Profile Update OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }
}
