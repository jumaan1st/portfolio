import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobApplications } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const { company_name, role, job_description, contact_name, contact_email, contact_role, is_referral, user_context } = await req.json();

        if (!company_name || !contact_email) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const [newApp] = await db.insert(jobApplications).values({
            company_name,
            role,
            job_description,
            contact_name,
            contact_email,
            contact_role, // NEW
            is_referral: is_referral || false,
            user_context, // NEW
            status: 'Pending'
        }).returning();

        return NextResponse.json({ success: true, application: newApp });

    } catch (error) {
        console.error('Create Lead Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create lead' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const apps = await db.select()
            .from(jobApplications)
            .orderBy(desc(jobApplications.created_at));

        return NextResponse.json({ success: true, applications: apps });
    } catch (error) {
        console.error('Fetch Leads Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
    }
}


export async function PUT(req: Request) {
    try {
        const { id, company_name, role, job_description, contact_name, contact_email, contact_role, is_referral, user_context } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        const [updatedApp] = await db.update(jobApplications).set({
            company_name,
            role,
            job_description,
            contact_name,
            contact_email,
            contact_role,
            is_referral,
            user_context,
            updated_at: new Date()
        }).where(eq(jobApplications.id, id)).returning();

        return NextResponse.json({ success: true, application: updatedApp });

    } catch (error) {
        console.error('Update Lead Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update lead' }, { status: 500 });
    }
}
