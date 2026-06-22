import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { passwordResetOtp, config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, otp, newPassword } = body;

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Find the latest unverified, unexpired OTP code for this email
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
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }

        const matchedOtp = otpRows[0];

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        let passwordUpdated = false;

        // 1. Update main admin password if it matches
        const adminRows = await db.select().from(configTable).limit(1);
        if (adminRows.length > 0 && adminRows[0].admin_email.toLowerCase() === cleanEmail) {
            await db.update(configTable)
                .set({
                    admin_pass: passwordHash,
                    must_reset_password: false
                })
                .where(eq(configTable.id, adminRows[0].id));
            passwordUpdated = true;
        }

        // 2. Update client password if it matches
        if (!passwordUpdated) {
            const clientRows = await db.select().from(clientTable).where(eq(clientTable.email, cleanEmail)).limit(1);
            if (clientRows.length > 0) {
                await db.update(clientTable)
                    .set({
                        password_hash: passwordHash,
                        must_reset_password: false
                    })
                    .where(eq(clientTable.id, clientRows[0].id));
                passwordUpdated = true;
            }
        }

        // 3. Update view-only admin password if it matches
        if (!passwordUpdated) {
            const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.email, cleanEmail)).limit(1);
            if (viewAdminRows.length > 0) {
                await db.update(viewOnlyAdminTable)
                    .set({
                        password_hash: passwordHash,
                        must_reset_password: false
                    })
                    .where(eq(viewOnlyAdminTable.id, viewAdminRows[0].id));
                passwordUpdated = true;
            }
        }

        if (!passwordUpdated) {
            return NextResponse.json({ error: 'User account not found' }, { status: 404 });
        }

        // Mark OTP as verified
        await db.update(passwordResetOtp)
            .set({ verified: true })
            .where(eq(passwordResetOtp.id, matchedOtp.id));

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Password Reset Verification Error:', error);
        return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
    }
}
