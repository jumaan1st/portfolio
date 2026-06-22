import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, UserRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN, UserRole.VIEW_ONLY_ADMIN, UserRole.CLIENT]);

    if (!authResult.success || !authResult.payload) {
        return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    const { email, role, id } = authResult.payload;
    let mustReset = false;

    try {
        if (role === UserRole.ADMIN) {
            const adminRows = await db.select().from(configTable).limit(1);
            if (adminRows.length > 0) {
                mustReset = adminRows[0].must_reset_password || false;
            }
        } else if (role === UserRole.CLIENT && id) {
            const clientRows = await db.select().from(clientTable).where(eq(clientTable.id, id)).limit(1);
            if (clientRows.length > 0) {
                mustReset = clientRows[0].must_reset_password || false;
            }
        } else if (role === UserRole.VIEW_ONLY_ADMIN && id) {
            const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.id, id)).limit(1);
            if (viewAdminRows.length > 0) {
                mustReset = viewAdminRows[0].must_reset_password || false;
            }
        }

        return NextResponse.json({
            isAuthenticated: true,
            user: {
                email,
                role,
                id,
                mustReset
            }
        });
    } catch (error) {
        return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }
}
