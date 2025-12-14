import { Metadata } from 'next';
import { ProjectClientRoute } from "@/components/pages/ProjectClientRoute";
import pool from '@/lib/db';

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    try {
        // Fetch minimal data for metadata
        const res = await pool.query('SELECT title, description FROM portfolio.projects WHERE id = $1', [id]);

        if (res.rows.length > 0) {
            const project = res.rows[0];
            return {
                title: `${project.title} | Projects`,
                description: project.description.substring(0, 160), // Truncate for SEO
            };
        }
    } catch (error) {
        console.error("Error fetching project metadata:", error);
    }

    return {
        title: 'Project Details | Mohammed Jumaan',
        description: 'Detailed view of a portfolio project.',
    };
}

export default function Page() {
    return <ProjectClientRoute />;
}

