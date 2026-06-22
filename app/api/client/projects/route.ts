import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientProject as clientProjectTable, projectMessage as projectMessageTable, projectPayment as projectPaymentTable } from '@/lib/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getClientSession(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return null;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        if (verified.payload.role !== 'client') return null;
        return verified.payload as { role: 'client', email: string, id: string };
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const session = await getClientSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const projects = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.client_id, session.id))
            .orderBy(desc(clientProjectTable.created_at));

        const projectIds = projects.map(p => p.id);
        
        let payments: any[] = [];
        let unreadMessages: any[] = [];
        if (projectIds.length > 0) {
            payments = await db.select()
                .from(projectPaymentTable)
                .where(inArray(projectPaymentTable.project_id, projectIds));
                
            unreadMessages = await db.select()
                .from(projectMessageTable)
                .where(
                    and(
                        inArray(projectMessageTable.project_id, projectIds),
                        eq(projectMessageTable.sender_role, 'admin'),
                        eq(projectMessageTable.is_read, false)
                    )
                );
        }

        const projectsWithDetails = projects.map(p => ({
            ...p,
            payments: payments.filter(pay => pay.project_id === p.id),
            unreadCount: unreadMessages.filter(m => m.project_id === p.id).length
        }));

        return NextResponse.json(projectsWithDetails);
    } catch (error) {
        console.error('Error fetching client projects:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getClientSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { projectId, action } = body; // action: 'approve' or 'decline'

        if (!projectId || !action) {
            return NextResponse.json({ error: 'Project ID and action are required' }, { status: 400 });
        }

        const projectRows = await db.select()
            .from(clientProjectTable)
            .where(and(eq(clientProjectTable.id, projectId), eq(clientProjectTable.client_id, session.id)))
            .limit(1);

        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRows[0];

        if (project.status !== 'Quoted') {
            return NextResponse.json({ error: 'Only quoted projects can be approved or declined' }, { status: 400 });
        }

        const newStatus = action === 'approve' ? 'In Progress' : 'Declined';

        await db.update(clientProjectTable)
            .set({ status: newStatus })
            .where(eq(clientProjectTable.id, projectId));

        return NextResponse.json({ success: true, status: newStatus });
    } catch (error) {
        console.error('Error updating client project status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getClientSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description } = body;

        if (!title) {
            return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
        }

        const inserted = await db.insert(clientProjectTable).values({
            client_id: session.id,
            title: title.trim(),
            description: description || '',
            status: 'Inquiry',
            cost: 0,
            deadline: null,
        }).returning();

        return NextResponse.json(inserted[0]);
    } catch (error) {
        console.error('Error creating client project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
