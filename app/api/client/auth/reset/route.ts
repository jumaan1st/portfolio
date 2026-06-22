import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { client as clientTable, viewOnlyAdmin as viewOnlyAdminTable, config as configTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let payload;
        try {
            const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
            payload = verified.payload;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (payload.role !== 'client' && payload.role !== 'view_only_admin' && payload.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        if (payload.role === 'client' && payload.id) {
            await db.update(clientTable)
                .set({
                    password_hash: passwordHash,
                    must_reset_password: false,
                })
                .where(eq(clientTable.id, payload.id as string));
        } else if (payload.role === 'view_only_admin' && payload.id) {
            await db.update(viewOnlyAdminTable)
                .set({
                    password_hash: passwordHash,
                    must_reset_password: false,
                })
                .where(eq(viewOnlyAdminTable.id, payload.id as string));
        } else if (payload.role === 'admin') {
            const adminRows = await db.select().from(configTable).limit(1);
            if (adminRows.length > 0) {
                await db.update(configTable)
                    .set({
                        admin_pass: passwordHash,
                        must_reset_password: false,
                    })
                    .where(eq(configTable.id, adminRows[0].id));
            }
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password Reset Error:', error);
        return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
    }
}
