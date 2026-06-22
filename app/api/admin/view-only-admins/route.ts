import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { viewOnlyAdmin } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function verifyMainAdmin(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return false;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        return verified.payload.role === 'admin';
    } catch {
        return false;
    }
}

export async function GET(request: Request) {
    if (!await verifyMainAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const list = await db.select({
            id: viewOnlyAdmin.id,
            name: viewOnlyAdmin.name,
            email: viewOnlyAdmin.email,
            must_reset_password: viewOnlyAdmin.must_reset_password,
            created_at: viewOnlyAdmin.created_at
        }).from(viewOnlyAdmin);

        return NextResponse.json(list);
    } catch (error) {
        console.error('Error fetching view-only admins:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await verifyMainAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Check if already exists in view_only_admin
        const existing = await db.select()
            .from(viewOnlyAdmin)
            .where(eq(viewOnlyAdmin.email, cleanEmail))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
        }

        // Generate temp password
        const tempPassword = `Admin-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const inserted = await db.insert(viewOnlyAdmin).values({
            name: name.trim(),
            email: cleanEmail,
            password_hash: passwordHash,
            must_reset_password: true,
        }).returning({ id: viewOnlyAdmin.id });

        // Email credentials to the new view-only admin
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const loginUrl = `${new URL(request.url).origin}/admin`;
            const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #4F46E5; margin-bottom: 20px;">Welcome to the Admin Portal</h2>
                    <p>Hi ${name},</p>
                    <p>You have been added as a <strong>View-Only Admin</strong> on Mohammed Jumaan's portfolio admin system. You have permissions to view the dashboards, reports, and client directories, but cannot make edits or modifications.</p>
                    
                    <div style="background-color: #EEF2F6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
                        <p style="margin: 0 0 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                        <p style="margin: 0 0 5px 0;"><strong>Username/Email:</strong> ${cleanEmail}</p>
                        <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="font-size: 16px; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold;">${tempPassword}</code></p>
                    </div>
                    
                    <p style="font-size: 14px; color: #E11D48; font-weight: 500;">Note: You will be required to change your password immediately upon your first login for security purposes.</p>
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
                subject: `Admin Invitation - View-Only Role`,
                html: htmlTemplate,
            });
        } catch (emailError) {
            console.error('Failed to send view-only admin invitation email:', emailError);
        }

        return NextResponse.json({
            success: true,
            id: inserted[0].id,
            tempPassword
        });

    } catch (error) {
        console.error('Error creating view-only admin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await verifyMainAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.delete(viewOnlyAdmin).where(eq(viewOnlyAdmin.id, id));

        return NextResponse.json({ success: true, message: 'View-only admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting view-only admin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
