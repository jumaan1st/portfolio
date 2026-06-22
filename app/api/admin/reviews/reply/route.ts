import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function checkAuth(req: Request) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return false;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        return role === 'admin';
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { email, subject, message } = await req.json();

        if (!email || !subject || !message) {
            return NextResponse.json({ error: 'Missing email, subject, or message' }, { status: 400 });
        }

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
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eeeeee; border-radius: 8px; }
                .content { margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            cc: process.env.EMAIL_USER,
            subject: subject,
            html: htmlTemplate,
        });

        console.log(`[Admin Reply API] Email response sent to ${email}`);

        return NextResponse.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Reply API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
