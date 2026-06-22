
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { UserRole } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // 1. Fetch admin credentials from DB
        const adminRows = await db.select({
            admin_email: configTable.admin_email,
            admin_pass: configTable.admin_pass,
            must_reset_password: configTable.must_reset_password
        }).from(configTable).limit(1);

        const adminConfig = adminRows[0];

        // Check if admin matches
        if (adminConfig && adminConfig.admin_email.toLowerCase() === cleanEmail) {
            const match = await bcrypt.compare(password, adminConfig.admin_pass);
            if (!match) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // Generate JWT for admin
            const token = await new SignJWT({ email: adminConfig.admin_email, role: UserRole.ADMIN })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('7d')
                .sign(new TextEncoder().encode(JWT_SECRET));

            const response = NextResponse.json({
                success: true,
                role: UserRole.ADMIN,
                mustReset: adminConfig.must_reset_password || false
            });
            response.cookies.set('portfolio_auth', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        // 2. Check view-only admin credentials from DB
        const viewAdminRows = await db.select()
            .from(viewOnlyAdminTable)
            .where(eq(viewOnlyAdminTable.email, cleanEmail))
            .limit(1);

        if (viewAdminRows.length > 0) {
            const vAdmin = viewAdminRows[0];
            const match = await bcrypt.compare(password, vAdmin.password_hash);
            if (!match) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // Generate JWT for view-only admin
            const token = await new SignJWT({ email: vAdmin.email, role: UserRole.VIEW_ONLY_ADMIN, id: vAdmin.id })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('7d')
                .sign(new TextEncoder().encode(JWT_SECRET));

            const response = NextResponse.json({
                success: true,
                role: UserRole.VIEW_ONLY_ADMIN,
                mustReset: vAdmin.must_reset_password
            });

            response.cookies.set('portfolio_auth', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        // 3. Check client credentials from DB
        const clientRows = await db.select()
            .from(clientTable)
            .where(eq(clientTable.email, cleanEmail))
            .limit(1);

        if (clientRows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const client = clientRows[0];

        // Compare client password
        const match = await bcrypt.compare(password, client.password_hash);
        if (!match) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT for client
        const token = await new SignJWT({ email: client.email, role: UserRole.CLIENT, id: client.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(JWT_SECRET));

        const response = NextResponse.json({
            success: true,
            role: UserRole.CLIENT,
            mustReset: client.must_reset_password
        });

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
