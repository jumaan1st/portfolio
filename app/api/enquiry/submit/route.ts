import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enquiry, enquiryOtp, config as configTable, client as clientTable, viewOnlyAdmin as viewOnlyAdminTable } from '@/lib/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { name, email, subject, message, otp } = await request.json();

        if (!name || !email || !subject || !message || !otp) {
            return NextResponse.json({ error: 'All fields, including the OTP, are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // 1. Check if email matches main admin
        const adminRows = await db.select({ email: configTable.admin_email }).from(configTable).limit(1);
        if (adminRows.length > 0 && adminRows[0].email.toLowerCase() === cleanEmail) {
            return NextResponse.json({ error: 'This email is registered to the administrator. Please log in.' }, { status: 400 });
        }

        // 2. Check if email matches client
        const clientRows = await db.select().from(clientTable).where(eq(clientTable.email, cleanEmail)).limit(1);
        if (clientRows.length > 0) {
            return NextResponse.json({ error: 'An account is already associated with this email. Please log in to your Client Portal to request a project.' }, { status: 400 });
        }

        // 3. Check if email matches view-only admin
        const viewAdminRows = await db.select().from(viewOnlyAdminTable).where(eq(viewOnlyAdminTable.email, cleanEmail)).limit(1);
        if (viewAdminRows.length > 0) {
            return NextResponse.json({ error: 'This email is registered to a view-only administrator. Please log in.' }, { status: 400 });
        }
        const cleanOtp = otp.trim();

        // 1. Verify OTP
        const now = new Date();
        const matchingOtps = await db.select()
            .from(enquiryOtp)
            .where(
                and(
                    eq(enquiryOtp.email, cleanEmail),
                    eq(enquiryOtp.otp, cleanOtp),
                    gt(enquiryOtp.expires_at, now),
                    eq(enquiryOtp.verified, false)
                )
            )
            .orderBy(desc(enquiryOtp.expires_at))
            .limit(1);

        if (matchingOtps.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }

        const otpRecord = matchingOtps[0];

        // 2. Mark OTP as verified to prevent reuse
        await db.update(enquiryOtp)
            .set({ verified: true })
            .where(eq(enquiryOtp.id, otpRecord.id));

        // 3. Create the Enquiry
        await db.insert(enquiry).values({
            name: name.trim(),
            email: cleanEmail,
            subject: subject.trim(),
            message: message.trim(),
            status: 'Pending',
        });

        return NextResponse.json({ success: true, message: 'Enquiry submitted successfully' });
    } catch (error) {
        console.error('Enquiry Submission Error:', error);
        return NextResponse.json({ error: 'Failed to submit enquiry. Please try again.' }, { status: 500 });
    }
}
