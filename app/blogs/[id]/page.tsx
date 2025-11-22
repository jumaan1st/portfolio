// app/blogs/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { BlogDetailPage } from "@/components/pages/BlogDetailPage";

export default function BlogDetailRoute() {
    const params = useParams();
    const { data } = usePortfolio();

    const id = Number(params.id);
    const blog = data.blogs.find((b) => b.id === id);

    if (!blog) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center text-slate-300">
                Blog post not found.
            </div>
        );
    }

    return <BlogDetailPage blog={blog} />;
}
