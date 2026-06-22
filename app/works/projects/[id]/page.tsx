import { ClientProjectDetailPage } from "@/components/pages/ClientProjectDetailPage";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { clientProject as clientProjectTable, client as clientTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: { id: string } | Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const resolvedParams = 'then' in params ? await params : params;
        const id = resolvedParams.id;
        if (!id) return {};

        const projectRows = await db.select()
            .from(clientProjectTable)
            .where(eq(clientProjectTable.id, id))
            .limit(1);

        if (projectRows.length > 0) {
            const project = projectRows[0];
            const clientRows = await db.select()
                .from(clientTable)
                .where(eq(clientTable.id, project.client_id))
                .limit(1);

            const companyName = clientRows.length > 0 ? (clientRows[0].company_name || clientRows[0].name) : "Valued Customer";
            const title = `${project.title} - Collaboration with ${companyName}`;
            const description = project.description
                ? project.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
                : `Check out the details for the commercial project ${project.title} on Mohammed Jumaan's portfolio!`;
            
            const image = project.project_image_url || (clientRows.length > 0 ? clientRows[0].company_logo_url : "") || "";

            return {
                title,
                description,
                openGraph: {
                    title,
                    description,
                    images: image ? [{ url: image }] : undefined,
                    type: "website",
                },
                twitter: {
                    card: "summary_large_image",
                    title,
                    description,
                    images: image ? [image] : undefined,
                }
            };
        }
    } catch (e) {
        console.error("Error generating client project metadata:", e);
    }

    return {
        title: "Project Showcase | Mohammed Jumaan Collaboration",
        description: "Viewing commercial collaboration detail showcase on Mohammed Jumaan's portfolio.",
    };
}

export default function Page() {
    return <ClientProjectDetailPage />;
}
