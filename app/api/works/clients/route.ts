import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { client as clientTable } from '@/lib/schema';

export async function GET() {
    try {
        const clients = await db.select({
            id: clientTable.id,
            name: clientTable.name,
            company_name: clientTable.company_name,
            company_logo_url: clientTable.company_logo_url,
        }).from(clientTable);

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching public clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
