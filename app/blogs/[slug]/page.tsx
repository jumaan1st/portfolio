// app/blogs/[slug]/page.tsx
import { Metadata } from 'next';
import { BlogClientRoute } from "@/components/pages/BlogClientRoute";
import pool from '@/lib/db';

type Props = {
    params: Promise<{ slug: string }>
}

// Direct DB fetch to avoid 2MB cache limit (likely due to large base64 images)
const getBlog = async (slug: string) => {
    try {
        // Try fetching by slug first
        let res = await pool.query('SELECT * FROM portfolio.blogs WHERE slug = $1', [slug]);

        if (res.rows.length > 0) {
            const row = res.rows[0];
            return {
                ...row,
                readTime: row.read_time, // Map snake_case to camelCase
            };
        }
        return null;
    } catch (error) {
        console.error("SSR Blog Fetch Error", error);
        return null;
    }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (blog) {
        return {
            title: `${blog.title} | Blog`,
            description: blog.excerpt || blog.title,
            openGraph: {
                title: blog.title,
                description: blog.excerpt,
                type: 'article',
                publishedTime: blog.date,
                images: blog.image ? [blog.image] : [],
            }
        };
    }

    return {
        title: 'Blog Not Found | Mohammed Jumaan',
        description: 'The requested blog post could not be found.',
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const blog = await getBlog(slug);
    return <BlogClientRoute initialBlog={blog} />;
}
