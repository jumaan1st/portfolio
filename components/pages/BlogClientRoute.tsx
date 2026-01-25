"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { BlogDetailPage } from "@/components/pages/BlogDetailPage";
import { ItemNotFound } from "@/components/ItemNotFound";

import { BlogPost } from "@/data/portfolioData";

interface Props {
    initialBlog?: BlogPost;
}

export function BlogClientRoute({ initialBlog }: Props) {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { data } = usePortfolio();

    // Priority: initialBlog (SSR) -> Context (Client Cache) -> undefined
    const [blog, setBlog] = React.useState<BlogPost | undefined>(
        initialBlog || data.blogs.find((b) => b.slug === slug || String(b.id) === slug)
    );

    // If we have full content, we are good.
    const hasContent = blog && blog.content;
    const [loading, setLoading] = React.useState(!hasContent);

    React.useEffect(() => {
        const currentSlug = params.slug as string;
        // If we switched Slugs or have valid data, skip or stop loading
        if (blog && (blog.slug === currentSlug || String(blog.id) === currentSlug) && hasContent) {
            setLoading(false);
            return;
        }

        async function fetchBlog() {
            setLoading(true);
            try {
                const res = await fetch(`/api/blogs?slug=${currentSlug}`);
                if (res.ok) {
                    const b = await res.json();
                    setBlog(b);
                } else {
                    setBlog(undefined);
                }
            } catch (e) {
                console.error("Failed to fetch blog post", e);
            } finally {
                setLoading(false);
            }
        }
        fetchBlog();
    }, [params.slug, blog, hasContent]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-slate-500 animate-pulse">Loading post...</div>
        </div>
    );

    if (!blog) {
        return <ItemNotFound type="blog" />;
    }

    return (
        <BlogDetailPage
            blog={blog}
        // BlogDetailPage might not have an onBack prop, but let's assume or add it if needed.
        // Based on view_file earlier, it took 'blog' prop. 
        // If it takes onBack, we can add it. If not, it's fine.
        />
    );
}
