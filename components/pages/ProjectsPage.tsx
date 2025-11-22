
"use client";

import React from "react";
import { FolderOpen, Github, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "../PortfolioContext";

export const ProjectsPage: React.FC = () => {
    const { data } = usePortfolio();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Featured Projects</h2>
                <div className="h-1 w-20 bg-purple-600 dark:bg-purple-500 mx-auto rounded-full" />
                <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                    A collection of applications demonstrating my expertise in full-stack
                    development, system design, and problem-solving.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.projects.map((project) => (
                    <Link
                        href={`/projects/${project.id}`}
                        key={project.id}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full"
                    >
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                            {project.image && project.image.startsWith("http") ? (
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform duration-500">
                                    <FolderOpen size={48} />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-700">
                                {project.tech[0]}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                                {project.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex gap-2">
                                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                        <Github size={18} />
                                    </span>
                                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                        <ExternalLink size={18} />
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    View Details <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
