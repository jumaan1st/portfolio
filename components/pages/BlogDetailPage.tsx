"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Coffee, Tag, Edit, Printer } from "lucide-react";
import type { BlogPost } from "@/data/portfolioData";
import { usePortfolio } from "@/components/PortfolioContext";
import { useCodeBlockEnhancer } from "@/hooks/useCodeBlockEnhancer";
import { useReactToPrint } from "react-to-print";
import { BlogEditor } from "./BlogEditor";
import { BlogPlaceholder } from "../BlogPlaceholder";

interface BlogDetailPageProps {
    blog: BlogPost;
}

import { extractFirstImage } from "@/lib/utils";

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ blog: initialBlog }) => {
    const router = useRouter();
    const { isAuthenticated, refreshData } = usePortfolio();
    const [blog, setBlog] = useState(initialBlog);
    const [isEditing, setIsEditing] = useState(false);
    const contentRef = React.useRef<HTMLElement>(null);

    useCodeBlockEnhancer(contentRef, [blog.content, blog.excerpt]);

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: blog.title || "Blog Post",
    });

    // Sync local state with prop when it changes (e.g. after fetching full content)
    React.useEffect(() => {
        setBlog(initialBlog);
    }, [initialBlog]);



    const displayImage = blog.image || extractFirstImage(blog.content);

    const handleSave = async (updatedBlog: BlogPost) => {
        try {
            const res = await fetch(`/api/blogs?id=${blog.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedBlog),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const saved = await res.json();
                setBlog(saved);
                setIsEditing(false);
                if (refreshData) refreshData();
            } else {
                alert('Failed to save changes');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving blog');
        }
    };

    if (isEditing) {
        return (
            <div className="max-w-5xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8">
                <BlogEditor
                    blog={blog}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-3xl w-full mx-auto animate-in fade-in slide-in-from-right-8 duration-500 pb-12 overflow-x-hidden">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button
                    onClick={() => router.push("/blogs")}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                    <ChevronLeft
                        size={20}
                        className="group-hover:-translate-x-1 transition-transform"
                    />
                    Back to Blogs
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePrint()}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all shadow-sm"
                        title="Download as PDF"
                    >
                        <Printer size={20} />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg text-sm font-bold transition-all"
                            title="Edit Post"
                        >
                            <Edit size={20} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Edit Post</span>
                        </button>
                    )}
                </div>
            </div>

            <article ref={contentRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="mb-6">
                    <div className="relative h-64 md:h-96 w-full mb-8 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-md">
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={blog.title}
                                className="w-full h-full object-cover"
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
                        {blog.is_hidden && (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-900 ml-auto">
                                Hidden (Draft)
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    <div
                        className="text-slate-600 dark:text-slate-400 text-lg mb-6 leading-relaxed italic border-l-4 border-blue-500 pl-4 break-words w-full min-w-0 [&_*]:whitespace-normal [&_*]:break-words"
                        dangerouslySetInnerHTML={{ __html: blog.excerpt || '' }}
                    />

                    <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800"
                            >
                                <Tag size={10} /> {tag}
                            </span>
                        ))}
                    </div>
                </header>

                <hr className="border-slate-200 dark:border-slate-800 my-8" />

                <section
                    className="prose prose-lg prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 blog-content break-words overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                />

            </article>
        </div>
    );
};
