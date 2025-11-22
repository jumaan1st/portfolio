// components/pages/BlogDetailPage.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Coffee, Tag } from "lucide-react";
import type { BlogPost } from "@/data/portfolioData";

interface BlogDetailPageProps {
    blog: BlogPost;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ blog }) => {
    const router = useRouter();

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 pb-12">
            <button
                onClick={() => router.push("/blogs")}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors group"
            >
                <ChevronLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Blogs
            </button>

            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="mb-6">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                        <span>{blog.date}</span>
                        <span className="flex items-center gap-1">
                            <Coffee size={12} /> {blog.readTime}
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        {blog.title}
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{blog.excerpt}</p>

                    <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-full"
                            >
                                <Tag size={10} /> {tag}
                            </span>
                        ))}
                    </div>
                </header>

                <hr className="border-slate-200 dark:border-slate-800 my-6" />

                <section className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-200">
                    {blog.content
                        ? blog.content.split("\n\n").map((para, idx) => (
                            <p key={idx} className="mb-4 leading-relaxed">
                                {para}
                            </p>
                        ))
                        : (
                            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                {blog.excerpt}
                            </p>
                        )
                    }
                </section>

            </article>
        </div>
    );
};
