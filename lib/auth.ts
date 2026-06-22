import { jwtVerify } from 'jose';
import { db } from './db';
import { client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from './schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const UserRole = {
  ADMIN: 'admin',
  VIEW_ONLY_ADMIN: 'view_only_admin',
  CLIENT: 'client'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface JWTPayload {
  email: string;
  role: UserRoleType;
  id?: string;
}

/**
 * Verifies the authentication JWT cookie and ensures the user has one of the allowed roles.
 * Performs database existence checks for clients and view-only admins to verify account validity.
 */
export async function verifyAuth(request: Request, allowedRoles: UserRoleType[]): Promise<{ success: boolean; payload?: JWTPayload }> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return { success: false };

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    const email = payload.email as string;
    const role = payload.role as UserRoleType;
    const id = payload.id as string | undefined;

    if (!email || !role || !allowedRoles.includes(role)) {
      return { success: false };
    }

    // Additional Database validation checks for clients & view-only admins (JWT Audit compliance)
    if (role === UserRole.CLIENT) {
      if (!id) return { success: false };
      const clientRows = await db.select().from(clientTable).where(eq(clientTable.id, id)).limit(1);
      if (clientRows.length === 0) return { success: false };
    } else if (role === UserRole.VIEW_ONLY_ADMIN) {
      if (!id) return { success: false };
      const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.id, id)).limit(1);
      if (viewAdminRows.length === 0) return { success: false };
    }

    return {
      success: true,
      payload: { email, role, id }
    };
  } catch (error) {
    return { success: false };
  }
}
