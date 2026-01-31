// app/blogs/[slug]/page.tsx
import { Metadata } from 'next';
import { BlogClientRoute } from "@/components/pages/BlogClientRoute";
import pool from '@/lib/db';

type Props = {
    params: Promise<{ slug: string }>
}

// Direct DB fetch to avoid 2MB cache limit (likely due to large base64 images)
import { db } from '@/lib/db';
import { blogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const getBlog = async (slug: string) => {
    try {
        // Try fetching by slug first
        const rows = await db.select().from(blogs).where(eq(blogs.slug, slug));

        if (rows.length > 0) {
            const row = rows[0];
            return {
                ...row,
                readTime: row.read_time, // Map snake_case to camelCase
            };
        }
        return undefined;
    } catch (error) {
        console.error("SSR Blog Fetch Error", error);
        return undefined;
    }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (blog) {
        return {
            title: `${blog.title ?? "Blog"} | Blog`,
            description: blog.excerpt || blog.title || "Blog Post",
            openGraph: {
                title: blog.title || "Blog Post",
                description: blog.excerpt || undefined,
                type: 'article',
                publishedTime: blog.date || undefined,
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

    // Ensure all required fields for BlogPost type are present and not null
    const safeBlog = blog ? {
        ...blog,
        // Ensure strictly required fields if any (though BlogPost likely has optionals or we rely on runtime)
        // Drizzle schema allows nulls, but BlogPost interface likely expects strings/undefined.
        // We cast valid fields.
        slug: blog.slug || undefined,
        title: blog.title || "",
        excerpt: blog.excerpt || "",
        date: blog.date || "",
        readTime: blog.readTime || "",
        content: blog.content || "",
        image: blog.image || undefined,
        tags: blog.tags || [],
        is_hidden: blog.is_hidden || false,
    } : undefined;

    return <BlogClientRoute initialBlog={safeBlog} />;
}
