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

async function getProject(id: string) {
    try {
        const res = await pool.query(`
            SELECT 
                id, title, category, tech, description, 
                long_description AS "longDescription", 
                features, challenges, link, github_link AS "githubLink", color, image
            FROM portfolio.projects
            WHERE id = $1
        `, [id]);
        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) {
        console.error("SSR Project Fetch Error", error);
        return null;
    }
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const project = await getProject(id);

    return <ProjectClientRoute initialProject={project} />;
}

