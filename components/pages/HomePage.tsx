"use client";

import React, { useState } from "react";
import {
    ArrowRight,
    Coffee,
    Cpu,
    ExternalLink,
    Layout,
    Terminal,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { EditableField } from "../EditableField";
import { Typewriter } from "@/components/Typewriter";
import { Marquee } from "../Marquee";
import { usePortfolio } from "../PortfolioContext";

export const HomePage: React.FC = () => {
    const { data, setData, isAuthenticated } = usePortfolio();
    const { theme } = useTheme();
    const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
    const router = useRouter();

    const nextProject = () => {
        setCurrentProjectIndex(
            (prev) => (prev + 1) % data.projects.length
        );
    };

    const prevProject = () => {
        setCurrentProjectIndex(
            (prev) => (prev - 1 + data.projects.length) % data.projects.length
        );
    };

    const onUpdateProfile = (fields: Partial<typeof data.profile>) => {
        setData((prev) => ({ ...prev, profile: { ...prev.profile, ...fields } }));
    };

    const project = data.projects[currentProjectIndex];

    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Hero */}
            <section className="flex flex-col items-center justify-start pt-0 pb-12 text-center relative gap-4">
                <div className="relative flex flex-col items-center justify-center">

                    {/* STATUS BADGE */}
                    <div
                        className="mb-6 bg-slate-100 dark:bg-slate-800/80 backdrop-blur border border-green-500/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-green-900/20">
                        <span className="relative flex h-3 w-3">
                            <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                        </span>
                        <span
                            className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                            {data.ui.statusLabel}{" "}
                            <span
                                className="text-green-600 dark:text-green-400">{data.profile.currentCompany}</span>
                        </span>
                    </div>

                    {/* AVATAR */}
                    {/* AVATAR */}
                    <div className="relative -mt-2 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 animate-gradient-x" />
                        <div className="relative w-40 h-40 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_0_50px_8px_rgba(105,48,255,0.35)]">
                            {(() => {
                                // Determine which URL to use
                                const currentTheme = theme === "system" ? "dark" : theme; // Simplified system check
                                const photoUrl = currentTheme === "dark"
                                    ? (data.profile.photoDarkUrl || data.profile.photoLightUrl)
                                    : (data.profile.photoLightUrl || data.profile.photoDarkUrl);

                                if (photoUrl) {
                                    return (
                                        <img
                                            src={photoUrl}
                                            alt={data.profile.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    );
                                }
                                return <UserIcon size={80} className="text-slate-400 dark:text-slate-600" />;
                            })()}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 max-w-3xl">
                    <h2 className="text-blue-600 dark:text-blue-400 font-mono text-sm tracking-[0.3em] uppercase">
                        {data.ui.heroTagline}
                    </h2>

                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight">
                        <EditableField
                            value={data.profile.name}
                            isEditing={isAuthenticated}
                            onSave={(val) => onUpdateProfile({ name: val })}
                        />
                    </h1>

                    <div className="h-12 text-2xl md:text-3xl ...">
                        I am a <Typewriter words={data.profile.roles} />
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg max-w-2xl mx-auto">
                        <EditableField
                            value={data.profile.summary}
                            isEditing={isAuthenticated}
                            type="textarea"
                            onSave={(val) => onUpdateProfile({ summary: val })}
                        />
                    </div>
                </div>

                {/* ACTION BUTTONS (updated for mobile) */}
                <div className="flex flex-col md:flex-row gap-4 mt-12 w-full justify-center items-center">
                    <button
                        onClick={() => router.push("/projects")}
                        className="w-full md:w-auto group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all flex items-center gap-2 justify-center"
                    >
                        See My Work <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={() => router.push("/contact")}
                        className="w-full md:w-auto bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold border border-slate-200 dark:border-slate-700 transition-all justify-center"
                    >
                        Contact Me
                    </button>

                    {data.profile.resumeUrl && (
                        <a
                            href="/api/resume"
                            download="Mohammed_Jumaan_Resume.pdf"
                            className="w-full md:w-auto bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 justify-center"
                        >
                            <Download size={18} /> Resume
                        </a>
                    )}
                </div>
            </section>

            <Marquee items={data.skills} />

            {/* Featured projects carousel */}
            {project && (
                <section className="max-w-5xl mx-auto w-full">
                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {data.ui.projectTitle}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-500">{data.ui.projectSubtitle}</p>
                    </div>

                    <div
                        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />

                        <div className="grid md:grid-cols-2 min-h-[400px]">
                            <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
                                <div
                                    className={`inline-block self-start px-3 py-1 rounded-lg text-xs font-bold uppercase mb-4 bg-gradient-to-r ${project.color} bg-opacity-10 text-slate-900 dark:text-white`}
                                >
                                    {project.category}
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                                    {project.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    {project.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {project.tech.map((t) => (
                                        <span
                                            key={t}
                                            className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => router.push(`/projects/${project.id}`)}
                                    className="self-start flex items-center gap-2 text-slate-900 dark:text-white font-bold border-b-2 border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors pb-1"
                                >
                                    View Case Study <ExternalLink size={16} />
                                </button>
                            </div>

                            <div
                                className={`relative overflow-hidden flex items-center justify-center ${project.image && project.image.startsWith("http")
                                    ? ""
                                    : `bg-gradient-to-br ${project.color}`
                                    }`}
                            >
                                {project.image && project.image.startsWith("http") ? (
                                    <>
                                        <img
                                            src={project.image}
                                            alt={project.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </>
                                ) : (
                                    <div className="text-white/20 transform scale-150 rotate-12">
                                        {project.category.includes("AI") ? (
                                            <Cpu size={120} />
                                        ) : (
                                            <Layout size={120} />
                                        )}
                                    </div>
                                )}
                                <div className="absolute bottom-6 right-6 flex gap-3 z-10">
                                    <button
                                        onClick={prevProject}
                                        className="p-3 bg-white/20 dark:bg-black/20 backdrop-blur hover:bg-white/40 dark:hover:bg-black/40 rounded-full text-white transition-all"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={nextProject}
                                        className="p-3 bg-white/20 dark:bg-black/20 backdrop-blur hover:bg-white/40 dark:hover:bg-black/40 rounded-full text-white transition-all"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Blog cards */}
            <section className="max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end mb-10 px-4">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {data.ui.blogTitle}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-500">{data.ui.blogSubtitle}</p>
                    </div>
                    <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold text-sm hidden md:block"
                        onClick={() => router.push("/blogs")}
                    >
                        View All Posts
                    </button>

                </div>

                <div className="grid md:grid-cols-3 gap-6 px-4">
                    {data.blogs.map((blog) => (
                        <article
                            key={blog.id}
                            onClick={() => router.push(`/blogs/${blog.id}`)}
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer shadow-sm"
                        >
                            <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                                <span>{blog.date}</span>
                                <span className="flex items-center gap-1">
                                    <Coffee size={12} /> {blog.readTime}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {blog.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                                {blog.excerpt}
                            </p>
                            <div className="flex gap-2 mt-auto">
                                {blog.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
};
