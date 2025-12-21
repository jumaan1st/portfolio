// components/pages/BlogsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Tag, Search, Plus } from "lucide-react";
import { usePortfolio } from "../PortfolioContext";
import { BLOG_TAGS } from "@/data/constants";
import { extractFirstImage } from "@/lib/utils";
import { BlogPlaceholder } from "../BlogPlaceholder";

export const BlogsPage: React.FC = () => {
    const { data: globalData, isAuthenticated, createBlog } = usePortfolio();
    const router = useRouter();

    const handleCreate = async () => {
        if (!confirm("Start a new draft?")) return;
        try {
            // Create a temporary draft object
            const newBlog = {
                title: "New Draft Blog",
                content: "<p>Start writing...</p>",
                date: new Date().toISOString().split('T')[0],
                readTime: "5 min read",
                tags: ["Draft"],
            };

            // We need to know the ID of the created blog to redirect. 
            // The current createBlog returns void and refreshes data.
            // We might need to modify createBlog or just fetch the latest one/reload.
            // However, createProject returns the new object. createBlog does not (in context).
            // Let's call the API directly here to get the ID.

            const res = await fetch('/api/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBlog)
            });

            if (res.ok) {
                const created = await res.json();
                router.push(`/blogs/${created.id}`);
            } else {
                alert("Failed to create draft");
            }
        } catch (e) {
            console.error(e);
            alert("Error creating draft");
        }
    };

    const [blogs, setBlogs] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBlogs(1, search, tag);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, tag]);

    const fetchBlogs = async (p: number, s: string, t: string) => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: "9",
                search: s,
                tag: t
            });
            const res = await fetch(`/api/blogs?${query.toString()}`);
            const json = await res.json();

            if (json.data) {
                setBlogs(json.data);
                setMeta({
                    page: json.meta.page,
                    totalPages: json.meta.totalPages,
                    total: json.meta.total
                });
            } else {
                setBlogs([]); // Fallback
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchBlogs(newPage, search, tag);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 px-4 sm:px-6">
            <header className="text-center mb-10">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                        {globalData.ui.blogTitle}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        {globalData.ui.blogSubtitle}
                    </p>

                    {isAuthenticated && (
                        <button
                            onClick={handleCreate}
                            className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                        >
                            <Plus size={18} /> New Post
                        </button>
                    )}
                </div>

                {/* SEARCH & FILTER BAR */}
                {/* SEARCH & FILTER BAR */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto px-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-blue-500 transition-all shadow-sm group-hover:shadow-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-blue-500 transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                    >
                        <option value="">All Topics</option>
                        {BLOG_TAGS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </header>

            {isLoading ? (
                <div className="grid md:grid-cols-3 gap-6 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
                        {blogs.length > 0 ? blogs.map((blog: any) => {
                            const displayImage = blog.image || extractFirstImage(blog.content);
                            return (
                                <article
                                    key={blog.id}
                                    onClick={() => router.push(`/blogs/${blog.id}`)}
                                    className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group shadow-sm flex flex-col w-full"
                                >
                                    <div className="relative h-48 mb-4 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt={blog.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : (
                                            <BlogPlaceholder title={blog.title} />
                                        )}
                                        <div className="hidden w-full h-full absolute inset-0">
                                            <BlogPlaceholder title={blog.title} />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                                        <span>{blog.date}</span>
                                        <span className="flex items-center gap-1">
                                            <Coffee size={12} /> {blog.readTime}
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {blog.title}
                                    </h2>

                                    <div
                                        className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 prose dark:prose-invert max-w-none break-words [&>*]:m-0 overflow-hidden"
                                        dangerouslySetInnerHTML={{ __html: blog.excerpt || '' }}
                                    />

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {blog.tags && blog.tags.map((t: string) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-full"
                                            >
                                                <Tag size={10} /> {t}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            );
                        }) : (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                No blogs found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {meta.totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => handlePageChange(meta.page - 1)}
                                disabled={meta.page === 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Previous
                            </button>
                            {[...Array(meta.totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${meta.page === i + 1
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(meta.page + 1)}
                                disabled={meta.page === meta.totalPages}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
