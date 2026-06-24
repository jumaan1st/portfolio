import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { client as clientTable, clientProject as clientProjectTable, enquiry as enquiryTable, passwordResetOtp, projectMessage, projectPayment as projectPaymentTable, config as configTable } from '@/lib/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { verifyAuth, UserRole } from '@/lib/auth';

export async function GET(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN, UserRole.VIEW_ONLY_ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clients = await db.select().from(clientTable);
        const projects = await db.select().from(clientProjectTable);
        const payments = await db.select().from(projectPaymentTable);
        const unreadMessages = await db.select()
            .from(projectMessage)
            .where(
                and(
                    eq(projectMessage.sender_role, 'client'),
                    eq(projectMessage.is_read, false)
                )
            );

        const clientsWithProjects = clients.map(c => ({
            ...c,
            projects: projects.filter(p => p.client_id === c.id).map(p => ({
                ...p,
                payments: payments.filter(pay => pay.project_id === p.id),
                unreadCount: unreadMessages.filter(m => m.project_id === p.id).length
            }))
        }));

        return NextResponse.json(clientsWithProjects);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            name,
            email,
            companyName,
            companyLogoUrl,
            phone,
            projectTitle,
            projectDescription,
            cost,
            deadline,
            enquiryId,
            description
        } = body;

        if (!name || !email || !projectTitle) {
            return NextResponse.json({ error: 'Name, email, and project title are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Check if client already exists
        const existingClients = await db.select()
            .from(clientTable)
            .where(eq(clientTable.email, cleanEmail))
            .limit(1);

        let clientId: string;
        let tempPassword = '';

        if (existingClients.length > 0) {
            clientId = existingClients[0].id;
        } else {
            // Generate temp password
            tempPassword = `Temp-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const inserted = await db.insert(clientTable).values({
                name: name.trim(),
                email: cleanEmail,
                password_hash: passwordHash,
                company_name: companyName ? companyName.trim() : null,
                company_logo_url: companyLogoUrl || null,
                phone: phone || null,
                must_reset_password: true,
                description: description || null
            }).returning({ id: clientTable.id });

            clientId = inserted[0].id;
        }

        // Insert client project
        const projectDeadline = deadline ? new Date(deadline) : null;
        const insertedProject = await db.insert(clientProjectTable).values({
            client_id: clientId,
            title: projectTitle.trim(),
            description: projectDescription || '',
            status: 'Inquiry', // Default status
            cost: cost ? parseInt(cost) : 0,
            deadline: projectDeadline,
        }).returning({ id: clientProjectTable.id });

        // Update enquiry status if onboarding from enquiry
        if (enquiryId) {
            await db.update(enquiryTable)
                .set({ status: 'Approved' })
                .where(eq(enquiryTable.id, parseInt(enquiryId)));
        }

        // Send email if a new client was created
        if (tempPassword) {
            try {
                const adminRows = await db.select({ email: configTable.admin_email }).from(configTable).limit(1);
                const adminEmail = adminRows.length > 0 ? adminRows[0].email : process.env.EMAIL_USER;

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const loginUrl = `${new URL(request.url).origin}/admin`;
                const htmlTemplate = `
                <!DOCTYPE html>
                <html>
                <body style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #4F46E5; margin-bottom: 20px;">Welcome to Your Client Portal</h2>
                        <p>Hi ${name},</p>
                        <p>Your enquiry for <strong>${projectTitle}</strong> has been approved! We have set up a client portal for you to manage your project, review quotations, and chat directly with us.</p>
                        
                        <div style="background-color: #EEF2F6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
                            <p style="margin: 0 0 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                            <p style="margin: 0 0 5px 0;"><strong>Username/Email:</strong> ${cleanEmail}</p>
                            <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="font-size: 16px; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold;">${tempPassword}</code></p>
                        </div>
                        
                        <p style="font-size: 14px; color: #E11D48; font-weight: 500;">Note: You will be required to change your password immediately upon your first login for security purposes.</p>
                        <br>
                        <hr style="border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Freelance Engineering Portal</p>
                    </div>
                </body>
                </html>
                `;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: cleanEmail,
                    cc: adminEmail || undefined,
                    subject: `Welcome to Your Project Portal - ${projectTitle}`,
                    html: htmlTemplate,
                });
            } catch (emailError) {
                console.error('Failed to send onboarding email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            clientId,
            projectId: insertedProject[0].id,
            tempPassword: tempPassword || null
        });
    } catch (error) {
        console.error('Error onboarding client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            id,
            name,
            email,
            companyName,
            companyLogoUrl,
            phone,
            description
        } = body;

        if (!id || !name || !email) {
            return NextResponse.json({ error: 'Client ID, name, and email are required' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Check if email is already taken by another client
        const emailCheck = await db.select()
            .from(clientTable)
            .where(eq(clientTable.email, cleanEmail))
            .limit(2);

        const otherClientWithEmail = emailCheck.find(c => c.id !== id);
        if (otherClientWithEmail) {
            return NextResponse.json({ error: 'Email address is already in use by another client' }, { status: 400 });
        }

        // Update client
        await db.update(clientTable)
            .set({
                name: name.trim(),
                email: cleanEmail,
                company_name: companyName ? companyName.trim() : null,
                company_logo_url: companyLogoUrl || null,
                phone: phone || null,
                description: description || null
            })
            .where(eq(clientTable.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authResult = await verifyAuth(request, [UserRole.ADMIN]);
        if (!authResult.success || !authResult.payload) {
            return NextResponse.json({ error: 'Forbidden: Only the main administrator can delete clients' }, { status: 403 });
        }
        const adminEmail = authResult.payload.email;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const otp = searchParams.get('otp');

        if (!id || !otp) {
            return NextResponse.json({ error: 'Client ID and verification OTP are required' }, { status: 400 });
        }

        const cleanEmail = adminEmail.toLowerCase().trim();

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
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }

        const matchedOtp = otpRows[0];

        // 2. Fetch projects to clear messages
        const clientProjects = await db.select({ id: clientProjectTable.id })
            .from(clientProjectTable)
            .where(eq(clientProjectTable.client_id, id));

        // 3. Cascade Delete inside transaction
        await db.transaction(async (tx) => {
            // Delete messages for all projects
            for (const p of clientProjects) {
                await tx.delete(projectMessage)
                    .where(eq(projectMessage.project_id, p.id));
            }

            // Delete projects
            await tx.delete(clientProjectTable)
                .where(eq(clientProjectTable.client_id, id));

            // Delete client
            await tx.delete(clientTable)
                .where(eq(clientTable.id, id));

            // Mark OTP verified
            await tx.update(passwordResetOtp)
                .set({ verified: true })
                .where(eq(passwordResetOtp.id, matchedOtp.id));
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
