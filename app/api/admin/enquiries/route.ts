import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { enquiry as enquiryTable } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, UserRole } from '@/lib/auth';

export async function GET(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN, UserRole.VIEW_ONLY_ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const enquiries = await db.select()
            .from(enquiryTable)
            .orderBy(desc(enquiryTable.created_at));

        return NextResponse.json(enquiries);
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 });
        }

        const enquiryId = parseInt(id);
        const enquiryRows = await db.select().from(enquiryTable).where(eq(enquiryTable.id, enquiryId)).limit(1);
        if (enquiryRows.length === 0) {
            return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
        }
        const targetEnquiry = enquiryRows[0];

        await db.delete(enquiryTable)
            .where(eq(enquiryTable.id, enquiryId));

        // Send a polite workload rejection email containing their subject and desc
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #DC2626; margin-bottom: 20px;">Update Regarding Your Enquiry</h2>
                    <p>Hi ${targetEnquiry.name},</p>
                    <p>Thank you for reaching out and submitting your collaboration request regarding <strong>"${targetEnquiry.subject}"</strong>.</p>
                    <p>Unfortunately, due to current workload constraints or alignment, we cannot take up your project at this time.</p>
                    <p>We appreciate your interest in our services and wish you the best of luck with your project development.</p>
                    
                    <div style="background-color: #EEF2F6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Enquiry Reference:</strong></p>
                        <p style="margin: 0 0 5px 0;"><strong>Subject:</strong> ${targetEnquiry.subject}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Description:</strong></p>
                        <p style="margin: 0; white-space: pre-wrap; background: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px;">${targetEnquiry.message}</p>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Freelance Engineering Portal</p>
                </div>
            </body>
            </html>
            `;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: targetEnquiry.email,
                subject: `Update regarding your collaboration request: ${targetEnquiry.subject}`,
                html: emailHtml,
            });
        } catch (emailError) {
            console.error('Failed to send enquiry rejection email:', emailError);
        }

        return NextResponse.json({ success: true, message: 'Enquiry deleted and notification email sent successfully' });
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
