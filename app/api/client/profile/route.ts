import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { client as clientTable, passwordResetOtp } from '@/lib/schema';
import { eq, and, desc, gt } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        const clientId = verified.payload.id as string;

        if (role !== 'client' || !clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const clientRows = await db.select({
            id: clientTable.id,
            name: clientTable.name,
            email: clientTable.email,
            phone: clientTable.phone,
            company_name: clientTable.company_name,
            company_logo_url: clientTable.company_logo_url,
            description: clientTable.description,
            created_at: clientTable.created_at
        })
        .from(clientTable)
        .where(eq(clientTable.id, clientId))
        .limit(1);

        if (clientRows.length === 0) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(clientRows[0]);

    } catch (error) {
        console.error('Error fetching client profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        const clientId = verified.payload.id as string;

        if (role !== 'client' || !clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            email,
            companyName,
            companyLogoUrl,
            phone,
            description,
            otp
        } = body;

        if (!name || !email || !otp) {
            return NextResponse.json({ error: 'Name, email, and OTP verification code are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // 1. Verify OTP
        const otpRows = await db.select()
            .from(passwordResetOtp)
            .where(
                and(
                    eq(passwordResetOtp.email, cleanEmail),
                    eq(passwordResetOtp.otp, otp.trim()),
                    eq(passwordResetOtp.verified, false),
                    gt(passwordResetOtp.expires_at, new Date())
                )
            )
            .orderBy(desc(passwordResetOtp.expires_at))
            .limit(1);

        if (otpRows.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired OTP verification code' }, { status: 400 });
        }

        const matchedOtp = otpRows[0];

        // 2. Check if email is taken by another client
        const emailCheck = await db.select()
            .from(clientTable)
            .where(eq(clientTable.email, cleanEmail))
            .limit(2);

        const otherClientWithEmail = emailCheck.find(c => c.id !== clientId);
        if (otherClientWithEmail) {
            return NextResponse.json({ error: 'Email address is already in use by another client' }, { status: 400 });
        }

        // 3. Update OTP status
        await db.update(passwordResetOtp)
            .set({ verified: true })
            .where(eq(passwordResetOtp.id, matchedOtp.id));

        // 4. Update Profile
        await db.update(clientTable)
            .set({
                name: name.trim(),
                email: cleanEmail,
                company_name: companyName ? companyName.trim() : null,
                company_logo_url: companyLogoUrl || null,
                phone: phone || null,
                description: description || null
            })
            .where(eq(clientTable.id, clientId));

        return NextResponse.json({ success: true, email: cleanEmail });

    } catch (error) {
        console.error('Error updating client profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
