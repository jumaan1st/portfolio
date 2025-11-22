// components/pages/BlogsPage.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Coffee, Tag } from "lucide-react";
import { usePortfolio } from "../PortfolioContext";

export const BlogsPage: React.FC = () => {
    const { data } = usePortfolio();
    const router = useRouter();

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    {data.ui.blogTitle}
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    {data.ui.blogSubtitle}
                </p>
            </header>

            <div className="grid gap-6">
                {data.blogs.map((blog) => (
                    <article
                        key={blog.id}
                        onClick={() => router.push(`/blogs/${blog.id}`)}
                        className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 hover:bg-slate-900 hover:border-slate-600 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                            <span>{blog.date}</span>
                            <span className="flex items-center gap-1">
                <Coffee size={12} /> {blog.readTime}
              </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {blog.title}
                        </h2>

                        <p className="text-slate-400 text-sm md:text-base mb-4">
                            {blog.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {blog.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950 px-2 py-1 rounded-full"
                                >
                  <Tag size={10} /> {tag}
                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};
