import { ClientDetailPage } from "@/components/pages/ClientDetailPage";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { client as clientTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: { id: string } | Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const resolvedParams = 'then' in params ? await params : params;
        const id = resolvedParams.id;
        if (!id) return {};

        const clientRows = await db.select()
            .from(clientTable)
            .where(eq(clientTable.id, id))
            .limit(1);

        if (clientRows.length > 0) {
            const client = clientRows[0];
            const title = `${client.company_name || client.name} - Mohammed Jumaan Collaboration`;
            const description = client.description
                ? client.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
                : `View the project collaboration details with ${client.company_name || client.name}.`;
            const image = client.company_logo_url || "";

            return {
                title,
                description,
                openGraph: {
                    title,
                    description,
                    images: image ? [{ url: image }] : undefined,
                    type: "profile",
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
        console.error("Error generating metadata:", e);
    }

    return {
        title: "Client Profile | Mohammed Jumaan",
        description: "Detailed view of project collaborations and client partnerships.",
    };
}

export default function Page() {
    return <ClientDetailPage />;
}
