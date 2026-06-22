import { NextResponse } from 'next/server';
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

        await db.delete(enquiryTable)
            .where(eq(enquiryTable.id, parseInt(id)));

        return NextResponse.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
