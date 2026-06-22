import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { client as clientTable, clientProject as clientProjectTable } from '@/lib/schema';
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
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Fetch client details
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
        .where(eq(clientTable.id, id))
        .limit(1);

        if (clientRows.length === 0) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const client: any = { ...clientRows[0] };

        // Only reveal contact details to authorized admins / view-only admins
        const authorized = await isAuthorizedAdmin(request);
        if (!authorized) {
            client.email = null;
            client.phone = null;
        }

        // Fetch projects for this client
        let projects = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.client_id, id));

        if (!authorized) {
            projects = projects.map(p => {
                const { cost, discount, deadline, ...rest } = p;
                return rest as any;
            });
        }

        return NextResponse.json({
            ...client,
            projects: projects || []
        });

    } catch (error) {
        console.error('Error fetching client details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
