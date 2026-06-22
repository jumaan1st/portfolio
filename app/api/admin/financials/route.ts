import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientProject as clientProjectTable, client as clientTable } from '@/lib/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { verifyAuth, UserRole } from '@/lib/auth';

export async function GET(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN, UserRole.VIEW_ONLY_ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Fetch all completed projects
        const completedProjects = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.status, 'Completed'));

        // 2. Fetch all clients and projects
        const allClients = await db.select().from(clientTable);
        const allProjects = await db.select().from(clientProjectTable);

        // Calculate lifetime revenue
        const lifetimeRevenue = completedProjects.reduce((sum, p) => sum + p.cost, 0);

        // Calculate yearly revenue
        const yearlyRevenue = completedProjects
            .filter(p => p.created_at && new Date(p.created_at) >= startOfYear)
            .reduce((sum, p) => sum + p.cost, 0);

        // Calculate monthly revenue
        const monthlyRevenue = completedProjects
            .filter(p => p.created_at && new Date(p.created_at) >= startOfMonth)
            .reduce((sum, p) => sum + p.cost, 0);

        // Calculate custom range revenue
        let customRevenue = 0;
        if (customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
            customRevenue = completedProjects
                .filter(p => {
                    if (!p.created_at) return false;
                    const pDate = new Date(p.created_at);
                    return pDate >= start && pDate <= end;
                })
                .reduce((sum, p) => sum + p.cost, 0);
        }

        // KPI: Most valuable clients
        const clientCompletedRevenue: Record<string, { name: string; company: string; revenue: number; projectCount: number }> = {};
        
        allClients.forEach(c => {
            clientCompletedRevenue[c.id] = {
                name: c.name,
                company: c.company_name || c.name,
                revenue: 0,
                projectCount: 0
            };
        });

        allProjects.forEach(p => {
            const clientData = clientCompletedRevenue[p.client_id];
            if (clientData) {
                clientData.projectCount += 1;
                if (p.status === 'Completed') {
                    clientData.revenue += p.cost;
                }
            }
        });

        const mostValuableClients = Object.values(clientCompletedRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const totalClientsCount = allClients.length;
        const totalProjectsCount = allProjects.length;

        const averageProjectsPerClient = totalClientsCount > 0 
            ? parseFloat((totalProjectsCount / totalClientsCount).toFixed(2)) 
            : 0;

        const averageProjectCost = totalProjectsCount > 0
            ? Math.round(allProjects.reduce((sum, p) => sum + p.cost, 0) / totalProjectsCount)
            : 0;

        return NextResponse.json({
            success: true,
            lifetimeRevenue,
            yearlyRevenue,
            monthlyRevenue,
            customRevenue,
            mostValuableClients,
            stats: {
                totalClients: totalClientsCount,
                totalProjects: totalProjectsCount,
                averageProjectsPerClient,
                averageProjectCost
            }
        });
    } catch (error) {
        console.error('Error generating financial reports:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
