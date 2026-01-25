// app/projects/[slug]/page.tsx
import { Metadata } from 'next';
import { ProjectClientRoute } from "@/components/pages/ProjectClientRoute";
import pool from '@/lib/db';

type Props = {
    params: Promise<{ slug: string }>
}

import { unstable_cache } from 'next/cache';

// Cache the project fetch for 1 hour, revalidate on 'projects' tag update
const getProject = unstable_cache(
    async (slug: string) => {
        try {
            // Try fetching by slug
            let res = await pool.query(`
                SELECT 
                    id, title, category, tech, description, 
                    long_description AS "longDescription", 
                    features, challenges, link, github_link AS "githubLink", color, image, slug
                FROM portfolio.projects
                WHERE slug = $1
            `, [slug]);

            return res.rows.length > 0 ? res.rows[0] : null;
        } catch (error) {
            console.error("SSR Project Fetch Error", error);
            return null;
        }
    },
    ['project-details'], // cache key prefix
    { tags: ['projects'], revalidate: 3600 } // revalidate every hour or when 'projects' tag is invalidated
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    // Efficient Metadata Fetch (could optimize specific query but reusing getProject is fine and cached)
    const project = await getProject(slug);

    if (project) {
        return {
            title: `${project.title} | Projects`,
            description: project.description.substring(0, 160),
        };
    }

    return {
        title: 'Project Details | Mohammed Jumaan',
        description: 'Detailed view of a portfolio project.',
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const project = await getProject(slug);

    return <ProjectClientRoute initialProject={project} />;
}

