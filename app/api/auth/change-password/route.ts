import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
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

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
        }

        const role = payload.role as string;
        let passwordHash = '';

        if (role === 'admin') {
            const rows = await db.select().from(configTable).limit(1);
            if (rows.length === 0) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            const admin = rows[0];
            const match = await bcrypt.compare(currentPassword, admin.admin_pass);
            if (!match) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            passwordHash = await bcrypt.hash(newPassword, 10);
            await db.update(configTable)
                .set({
                    admin_pass: passwordHash,
                    must_reset_password: false
                })
                .where(eq(configTable.id, admin.id));

        } else if (role === 'client') {
            const clientId = payload.id as string;
            const rows = await db.select().from(clientTable).where(eq(clientTable.id, clientId)).limit(1);
            if (rows.length === 0) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            const client = rows[0];
            const match = await bcrypt.compare(currentPassword, client.password_hash);
            if (!match) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            passwordHash = await bcrypt.hash(newPassword, 10);
            await db.update(clientTable)
                .set({
                    password_hash: passwordHash,
                    must_reset_password: false
                })
                .where(eq(clientTable.id, client.id));

        } else if (role === 'view_only_admin') {
            const staffId = payload.id as string;
            const rows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.id, staffId)).limit(1);
            if (rows.length === 0) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            const staff = rows[0];
            const match = await bcrypt.compare(currentPassword, staff.password_hash);
            if (!match) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            passwordHash = await bcrypt.hash(newPassword, 10);
            await db.update(viewOnlyAdminTable)
                .set({
                    password_hash: passwordHash,
                    must_reset_password: false
                })
                .where(eq(viewOnlyAdminTable.id, staff.id));
        } else {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 401 });
        }

        return NextResponse.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change Password Error:', error);
        return NextResponse.json({ error: 'Failed to change password. Please try again.' }, { status: 500 });
    }
}
