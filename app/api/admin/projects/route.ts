import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientProject as clientProjectTable, projectMessage as projectMessageTable, projectPayment as projectPaymentTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, UserRole } from '@/lib/auth';

export async function PUT(request: Request) {
    const authResult = await verifyAuth(request, [UserRole.ADMIN]);
    if (!authResult.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, status, cost, deadline, title, description, discount, payments, project_image_url, live_url } = body;

        if (!id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (cost !== undefined) updateData.cost = parseInt(cost);
        if (discount !== undefined) updateData.discount = parseInt(discount) || 0;
        if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (project_image_url !== undefined) updateData.project_image_url = project_image_url;
        if (live_url !== undefined) updateData.live_url = live_url;

        await db.transaction(async (tx) => {
            // Update project details
            await tx.update(clientProjectTable)
                .set(updateData)
                .where(eq(clientProjectTable.id, id));

            // Sync payment milestones if provided
            if (payments !== undefined) {
                // Delete old payments
                await tx.delete(projectPaymentTable)
                    .where(eq(projectPaymentTable.project_id, id));

                // Insert new ones
                if (payments && payments.length > 0) {
                    await tx.insert(projectPaymentTable).values(
                        payments.map((p: any) => ({
                            project_id: id,
                            title: p.title.trim(),
                            amount: parseInt(p.amount) || 0,
                            status: p.status || 'Pending'
                        }))
                    );
                }
            }
        });

        // Security check: if status is changed to Completed, delete all project messages
        if (status === 'Completed') {
            await db.delete(projectMessageTable)
                .where(eq(projectMessageTable.project_id, id));
            console.log(`[Admin Projects API] Purged all messages for completed project ${id}`);
        }

        return NextResponse.json({ success: true, message: 'Project updated successfully' });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
