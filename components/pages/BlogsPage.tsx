// components/pages/BlogsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Tag, Search } from "lucide-react";
import { usePortfolio } from "../PortfolioContext";
import { BLOG_TAGS } from "@/data/constants";

export const BlogsPage: React.FC = () => {
    const { data: globalData } = usePortfolio(); // Use global data mainly for UI strings
    const router = useRouter();

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
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                    {globalData.ui.blogTitle}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                    {globalData.ui.blogSubtitle}
                </p>

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
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {blogs.length > 0 ? blogs.map((blog: any) => (
                            <article
                                key={blog.id}
                                onClick={() => router.push(`/blogs/${blog.id}`)}
                                className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group shadow-sm flex flex-col"
                            >
                                <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                                    <span>{blog.date}</span>
                                    <span className="flex items-center gap-1">
                                        <Coffee size={12} /> {blog.readTime}
                                    </span>
                                </div>

                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {blog.title}
                                </h2>

                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                                    {blog.excerpt}
                                </p>

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
                        )) : (
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
