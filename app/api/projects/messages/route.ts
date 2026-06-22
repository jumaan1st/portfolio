import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectMessage as projectMessageTable, clientProject as clientProjectTable } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getAuthSession(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return null;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        return verified.payload as { role: 'admin' | 'client', email: string, id?: string };
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const session = await getAuthSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Verify ownership/authorization
        const projectRows = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.id, projectId))
            .limit(1);

        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRows[0];

        if (session.role === 'client' && project.client_id !== session.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Mark messages as read
        if (session.role === 'client') {
            await db.update(projectMessageTable)
                .set({ is_read: true })
                .where(
                    and(
                        eq(projectMessageTable.project_id, projectId),
                        eq(projectMessageTable.sender_role, 'admin'),
                        eq(projectMessageTable.is_read, false)
                    )
                );
        } else if (session.role === 'admin' || session.role === 'view_only_admin') {
            await db.update(projectMessageTable)
                .set({ is_read: true })
                .where(
                    and(
                        eq(projectMessageTable.project_id, projectId),
                        eq(projectMessageTable.sender_role, 'client'),
                        eq(projectMessageTable.is_read, false)
                    )
                );
        }

        // Fetch messages
        const messages = await db.select()
            .from(projectMessageTable)
            .where(eq(projectMessageTable.project_id, projectId))
            .orderBy(asc(projectMessageTable.created_at));

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching project messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getAuthSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { projectId, message } = body;

        if (!projectId || !message) {
            return NextResponse.json({ error: 'Project ID and message are required' }, { status: 400 });
        }

        // Verify ownership/authorization
        const projectRows = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.id, projectId))
            .limit(1);

        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRows[0];

        if (session.role === 'client' && project.client_id !== session.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If the project is Completed, do not allow sending new messages
        if (project.status === 'Completed') {
            return NextResponse.json({ error: 'Project is completed, messaging is disabled' }, { status: 400 });
        }

        // Insert message
        const inserted = await db.insert(projectMessageTable).values({
            project_id: projectId,
            sender_role: session.role,
            message: message.trim(),
        }).returning();

        return NextResponse.json(inserted[0]);
    } catch (error) {
        console.error('Error sending project message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
