// components/pages/BlogsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Tag, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { usePortfolio } from "../PortfolioContext";
import { BLOG_TAGS } from "@/data/constants";
import { extractFirstImage } from "@/lib/utils";
import { BlogPlaceholder } from "../BlogPlaceholder";

export const BlogsPage: React.FC = () => {
    const { data: globalData, isAuthenticated, createBlog } = usePortfolio();
    const router = useRouter();

    const handleCreate = () => {
        router.push('/blogs/new');
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm("Are you sure you want to delete this blog?")) return;

        try {
            const res = await fetch(`/api/blogs?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from local state to avoid refetch
                setBlogs(prev => prev.filter(b => b.id !== id));
            } else {
                alert("Failed to delete blog");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting blog");
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
    }, [search, tag, isAuthenticated]); // Re-fetch when auth status changes

    const fetchBlogs = async (p: number, s: string, t: string) => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: "24",
                search: s,
                tag: t,
                summary: "true"
            });
            if (isAuthenticated) {
                query.append('include_hidden', 'true');
            }

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
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                            >
                                <Plus size={18} /> New Post
                            </button>
                            <button
                                onClick={() => router.push('/admin/reorder-blogs')}
                                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-900 transition-all border border-slate-700"
                            >
                                Reorder Blogs
                            </button>
                        </div>
                    )}
                </div>

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
                                    className={`bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group shadow-sm flex flex-col w-full relative ${blog.is_hidden ? 'opacity-75' : ''}`}
                                >
                                    {isAuthenticated && blog.is_hidden && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md animate-pulse">
                                                Hidden
                                            </span>
                                        </div>
                                    )}

                                    {isAuthenticated && (
                                        <div className="absolute top-14 right-4 z-10 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/blogs/${blog.id}/edit`); }}
                                                className="p-2 bg-white dark:bg-slate-800 text-blue-500 rounded-lg shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, blog.id)}
                                                className="p-2 bg-white dark:bg-slate-800 text-red-500 rounded-lg shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

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
                                        className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 break-words [&>*]:m-0 overflow-hidden w-full min-w-0 [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!max-w-full [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:bg-slate-50 [&_blockquote]:dark:bg-slate-800/50 [&_blockquote]:rounded-r"
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
