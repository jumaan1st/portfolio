import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Only intercept administrative modification requests
    if (pathname.startsWith('/api/')) {
        const method = request.method;
        const isWriteRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

        // Exclude public endpoints that should be allowed to run POSTs / updates
        const isPublicWrite = 
            pathname === '/api/auth/login' ||
            pathname === '/api/auth/logout' ||
            pathname === '/api/auth/check' ||
            pathname === '/api/auth/change-password' ||
            pathname === '/api/client/auth/reset' ||
            pathname.startsWith('/api/auth/forgot-password/') ||
            pathname === '/api/contact' ||
            pathname === '/api/enquiry' ||
            pathname.startsWith('/api/enquiry/otp/');

        if (isWriteRequest && !isPublicWrite) {
            const token = request.cookies.get('portfolio_auth')?.value;
            if (token) {
                try {
                    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
                    const role = payload.role as string;
                    
                    if (role === 'view_only_admin') {
                        return NextResponse.json(
                            { error: 'Permission Denied: View-only admin cannot modify data' },
                            { status: 403 }
                        );
                    }
                } catch (e) {
                    // Let the actual route handler handle invalid tokens (e.g. 401 Unauthorized)
                }
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
