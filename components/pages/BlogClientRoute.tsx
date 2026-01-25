"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { BlogDetailPage } from "@/components/pages/BlogDetailPage";

import { BlogPost } from "@/data/portfolioData";

interface Props {
    initialBlog?: BlogPost;
}

export function BlogClientRoute({ initialBlog }: Props) {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const { data } = usePortfolio();

    // Priority: initialBlog (SSR) -> Context (Client Cache) -> undefined
    const [blog, setBlog] = React.useState<BlogPost | undefined>(
        initialBlog || data.blogs.find((b) => b.id === id)
    );

    // If we have full content, we are good.
    const hasContent = blog && blog.content;
    const [loading, setLoading] = React.useState(!hasContent);

    React.useEffect(() => {
        const currentId = Number(params.id);
        // If we switched IDs or have valid data, skip or stop loading
        if (blog && blog.id === currentId && hasContent) {
            setLoading(false);
            return;
        }

        async function fetchBlog() {
            setLoading(true);
            try {
                const res = await fetch(`/api/blogs?id=${currentId}`);
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
    }, [params.id, blog, hasContent]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-slate-500 animate-pulse">Loading post...</div>
        </div>
    );

    if (!blog) {
        return (
            <div className="max-w-4xl mx-auto py-24 text-center">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">Post Not Found</h2>
                <p className="text-slate-500 mb-8">The blog post you're looking for doesn't exist.</p>
                <button
                    onClick={() => router.push("/blogs")}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Back to Blog
                </button>
            </div>
        );
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
