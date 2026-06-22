import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { client as clientTable, clientProject as clientProjectTable, projectPayment as projectPaymentTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function isAuthorizedAdmin(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/portfolio_auth=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return false;
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const role = verified.payload.role;
        return role === 'admin' || role === 'view_only_admin';
    } catch {
        return false;
    }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        const resolvedParams = 'then' in params ? await params : params;
        const id = resolvedParams.id;

        if (!id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Query the project
        const projectRows = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.id, id))
            .limit(1);

        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRows[0];

        // Query the client details
        const clientRows = await db.select({
            id: clientTable.id,
            name: clientTable.name,
            company_name: clientTable.company_name,
            company_logo_url: clientTable.company_logo_url,
            description: clientTable.description
        })
        .from(clientTable)
        .where(eq(clientTable.id, project.client_id))
        .limit(1);

        const clientInfo = clientRows.length > 0 ? clientRows[0] : null;

        const authorized = await isAuthorizedAdmin(request);

        if (!authorized) {
            // Public view: Redact cost, discount, deadline
            const { cost, discount, deadline, ...publicProject } = project;
            return NextResponse.json({
                ...publicProject,
                client: clientInfo,
                payments: null
            });
        }

        // Admin view: fetch associated payment milestones as well
        const payments = await db.select()
            .from(projectPaymentTable)
            .where(eq(projectPaymentTable.project_id, id));

        return NextResponse.json({
            ...project,
            client: clientInfo,
            payments: payments || []
        });

    } catch (error) {
        console.error('Error fetching client project details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
