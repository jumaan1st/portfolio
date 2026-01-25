import { MetadataRoute } from 'next';
import pool from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getSiteData = unstable_cache(
    async () => {
        const [projects, blogs] = await Promise.all([
            pool.query('SELECT id, date FROM portfolio.projects'),
            pool.query('SELECT id, date FROM portfolio.blogs WHERE is_hidden = FALSE')
        ]);
        return {
            projects: projects.rows,
            blogs: blogs.rows
        };
    },
    ['sitemap-data'],
    { tags: ['projects', 'blogs'], revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.jumaan.me';
    const { projects, blogs } = await getSiteData();

    const routes = [
        '',
        '/about',
        '/projects',
        '/blogs',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    const projectRoutes = projects.map((project: any) => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: project.date ? new Date(project.date) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const blogRoutes = blogs.map((blog: any) => ({
        url: `${baseUrl}/blogs/${blog.id}`,
        lastModified: blog.date ? new Date(blog.date) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...projectRoutes, ...blogRoutes];
}
