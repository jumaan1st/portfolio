
"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Github, ExternalLink, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "../PortfolioContext";
import { PROJECT_CATEGORIES } from "@/data/constants";
import { ProjectLink } from "../ProjectLink";
import { Trash2, Plus } from "lucide-react";

export const ProjectsPage: React.FC = () => {
    const { isAuthenticated, deleteProject } = usePortfolio();

    const [projects, setProjects] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProjects(1, search, category);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, category]);

    const fetchProjects = async (p: number, s: string, c: string) => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: "9",
                search: s,
                category: c,
                summary: "true"
            });
            const res = await fetch(`/api/projects?${query.toString()}`);
            const json = await res.json();

            if (json.data) {
                setProjects(json.data);
                setMeta({
                    page: json.meta.page,
                    totalPages: json.meta.totalPages,
                    total: json.meta.total
                });
            } else {
                setProjects([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchProjects(newPage, search, category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Optimistic / Manual update after creation
    // Although ProjectsPage doesn't have the "Create" modal anymore (it's a Link),
    // we need to make sure that if we come back here, the data is fresh.
    // Actually, since we navigate to /projects/new, when we come back, this component remounts.
    // If it remounts, it fetches. If fetch is stale, we have a problem.
    // So for creation, the issue is likely STALE COMPONENT MOUNT or STALE API.

    // BUT, for Deletion, we stay on this page.
    const handleDeleteProject = async (id: number) => {
        if (confirm("Are you sure you want to delete this project?")) {
            // Optimistic local update
            setProjects(prev => prev.filter(p => p.id !== id));

            await deleteProject(id);
            // We can still fetch in background to be safe
            fetchProjects(meta.page, search, category);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Featured Projects</h2>
                <div className="h-1 w-20 bg-purple-600 dark:bg-purple-500 mx-auto rounded-full" />
                <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto mb-8">
                    A collection of applications demonstrating my expertise in full-stack
                    development, system design, and problem-solving.
                </p>

                {isAuthenticated && (
                    <Link
                        href="/projects/new"
                        className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                        <Plus size={18} /> Add New Project
                    </Link>
                )}

                {/* SEARCH & FILTER BAR */}

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto px-4 mt-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-purple-500 transition-all shadow-sm group-hover:shadow-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-purple-500 transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {PROJECT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {
                isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                            {projects.length > 0 ? projects.map((project: any) => (
                                <div
                                    key={project.id}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full"
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
                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            {project.tech && project.tech.length > 0 && (
                                                <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-700">
                                                    {project.tech[0]}
                                                </div>
                                            )}
                                            {isAuthenticated && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleDeleteProject(project.id);
                                                    }}
                                                    className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm p-1.5 rounded-full text-white transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            <Link href={`/projects/${project.id}`} className="focus:outline-none">
                                                <span aria-hidden="true" className="absolute inset-0" />
                                                {project.title}
                                            </Link>
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                                            {project.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex gap-2 relative z-10">
                                                <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                                    <Github size={18} />
                                                </span>
                                                <ProjectLink
                                                    href={project.link}
                                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors block"
                                                >
                                                    <ExternalLink size={18} />
                                                </ProjectLink>
                                            </div>
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10"
                                            >
                                                View Details <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-20 text-slate-500">
                                    No projects found matching your criteria.
                                </div>
                            )}
                        </div>

                        {/* PAGINATION */}
                        {meta.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-12">
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
                                            ? "bg-purple-600 text-white"
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
                )
            }
        </div >
    );
};
