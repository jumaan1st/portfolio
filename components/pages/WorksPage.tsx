"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Github, ExternalLink, ArrowRight, Search, Briefcase, Building, Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "../PortfolioContext";
import { PROJECT_CATEGORIES } from "@/data/constants";
import { ProjectLink } from "../ProjectLink";

export const WorksPage: React.FC = () => {
    const { isAuthenticated, user, deleteProject } = usePortfolio();
    const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin');
    const isFullAdmin = isAuthenticated && user?.role === 'admin';

    const [activeTab, setActiveTab] = useState<"works" | "clients">("works");
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    // Debounce search
    useEffect(() => {
        if (activeTab === "works") {
            const timer = setTimeout(() => {
                fetchProjects(1, search, category);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [search, category, activeTab]);

    useEffect(() => {
        if (activeTab === "clients") {
            fetchClients();
        }
    }, [activeTab]);

    const fetchProjects = async (p: number, s: string, c: string) => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: "12",
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

    const fetchClients = async () => {
        setIsLoadingClients(true);
        try {
            const res = await fetch("/api/works/clients");
            if (res.ok) {
                const json = await res.json();
                setClients(json || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingClients(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchProjects(newPage, search, category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDeleteProject = async (id: number) => {
        if (confirm("Are you sure you want to delete this project?")) {
            setProjects(prev => prev.filter(p => p.id !== id));
            await deleteProject(id);
            fetchProjects(meta.page, search, category);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12 px-4 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-8 mb-4">
                    My Works
                </h2>
                <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full" />
                <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto mb-8 font-medium">
                    A comprehensive showcase of commercial software developments and personal engineering systems.
                </p>

                {/* TAB SWITCHER */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <button
                            onClick={() => setActiveTab("works")}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                                activeTab === "works"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            }`}
                        >
                            <Briefcase size={18} />
                            <span>Works Showcase</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("clients")}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                                activeTab === "clients"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            }`}
                        >
                            <Building size={18} />
                            <span>Clients Served</span>
                        </button>
                    </div>
                </div>

                {activeTab === "works" && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto px-4 mt-8">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search works..."
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-blue-500 transition-all shadow-sm group-hover:shadow-md"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-blue-500 transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {PROJECT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {isFullAdmin && (
                            <Link
                                href="/works/new"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>Add Work</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {activeTab === "works" ? (
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
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full"
                                >
                                    {/* Client Badge */}
                                    {project.isClient && (
                                        <div className="absolute top-4 left-4 z-25 flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400 shadow-md">
                                            <Building size={10} />
                                            <span>Commercial Client</span>
                                        </div>
                                    )}

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
                                            {isFullAdmin && (
                                                <div className="flex gap-1">
                                                    <Link
                                                        href={`/works/${project.slug || project.id}/edit`}
                                                        className="bg-blue-500/80 hover:bg-blue-600 backdrop-blur-sm p-1.5 rounded-full text-white transition-colors flex items-center justify-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDeleteProject(project.id);
                                                        }}
                                                        className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm p-1.5 rounded-full text-white transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            <Link href={`/projects/${project.slug || project.id}`} className="focus:outline-none">
                                                <span aria-hidden="true" className="absolute inset-0" />
                                                {project.title}
                                            </Link>
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                                            {project.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex gap-2 relative z-10">
                                                {project.githubLink && (
                                                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                        <Github size={18} />
                                                    </span>
                                                )}
                                                {project.link && (
                                                    <ProjectLink
                                                        href={project.link}
                                                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </ProjectLink>
                                                )}
                                            </div>
                                            <Link
                                                href={`/projects/${project.slug || project.id}`}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10"
                                            >
                                                View Details <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-20 text-slate-500 font-medium">
                                    No works found matching your criteria.
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
                )
            ) : (
                /* CLIENTS TAB */
                isLoadingClients ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 animate-in fade-in duration-300">
                        {clients.length > 0 ? clients.map((client: any, idx: number) => (
                            <Link
                                href={`/works/clients/${client.id}`}
                                key={idx}
                                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 text-center group cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-300">
                                    {client.company_logo_url ? (
                                        <img src={client.company_logo_url} alt={client.company_name || client.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building className="text-slate-400 dark:text-slate-500" size={28} />
                                    )}
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {client.company_name || client.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Valued Client
                                </p>
                            </Link>
                        )) : (
                            <div className="col-span-full text-center py-20 text-slate-500 font-medium">
                                No clients listed yet.
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};
