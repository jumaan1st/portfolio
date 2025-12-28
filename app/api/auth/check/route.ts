import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request: NextRequest) {
    const token = request.cookies.get('portfolio_auth')?.value;

    if (!token) {
        return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        return NextResponse.json({ isAuthenticated: true, user: payload });
    } catch (error) {
        return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }
}
