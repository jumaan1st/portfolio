
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { config as configTable } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Fetch admin credentials from DB
        const rows = await db.select({
            admin_email: configTable.admin_email,
            admin_pass: configTable.admin_pass
        }).from(configTable).limit(1);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
        }

        const config = rows[0];

        // 1. Check email
        if (config.admin_email !== email) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. Check password hash
        const match = await bcrypt.compare(password, config.admin_pass);
        if (!match) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 3. Generate JWT
        const token = await new SignJWT({ email: config.admin_email, role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(JWT_SECRET));

        // 4. Set Cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('portfolio_auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
