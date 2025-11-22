// components/pages/ProjectsPage.tsx
"use client";

import React from "react";
import { Cpu, Layout } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "../PortfolioContext";

export const ProjectsPage: React.FC = () => {
    const { data } = usePortfolio();
    const router = useRouter();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">All Projects</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    A complete archive of my development work.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full cursor-pointer transform hover:-translate-y-1"
                    >
                        <div
                            className={`h-32 bg-gradient-to-r ${project.color} flex items-center justify-center`}
                        >
                            {project.category.includes("AI") ? (
                                <Cpu size={48} className="text-white/40" />
                            ) : (
                                <Layout size={48} className="text-white/40" />
                            )}
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 border border-slate-800 px-2 py-1 rounded bg-slate-950">
                  {project.category}
                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                {project.title}
                            </h3>

                            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                                {project.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800">
                                {project.tech.slice(0, 3).map((t, i) => (
                                    <span
                                        key={i}
                                        className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded"
                                    >
                    {t}
                  </span>
                                ))}
                                {project.tech.length > 3 && (
                                    <span className="text-xs text-slate-500 pt-1">
                    +{project.tech.length - 3} more
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
