"use client";

import React from "react";
import { Briefcase, GraduationCap, Zap, Github, Linkedin } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";
import { IconRenderer } from "@/components/IconRenderer";

export const AboutPage: React.FC = () => {
    const { data: globalData, isLoading: globalLoading } = usePortfolio();
    const [experience, setExperience] = React.useState<any[]>([]);
    const [education, setEducation] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAboutData = async () => {
            try {
                const [expRes, eduRes] = await Promise.all([
                    fetch('/api/experience'),
                    fetch('/api/education')
                ]);
                setExperience(await expRes.json());
                setEducation(await eduRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAboutData();
    }, []);

    const showLoading = globalLoading || isLoading;

    // Loading Skeleton Component
    const LoadingSkeleton = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-12 pb-12">
            <div className="text-center mb-12 space-y-4">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto animate-pulse" />
                <div className="h-1 w-20 bg-blue-600 dark:bg-blue-500 mx-auto rounded-full" />
                <div className="flex justify-center gap-4">
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
            </div>

            <div className="space-y-8">
                <h3 className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-12 pl-8 relative">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (showLoading) return <LoadingSkeleton />;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-12 pb-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
                <div className="h-1 w-20 bg-blue-600 dark:bg-blue-500 mx-auto rounded-full mb-6" />

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                    {globalData.profile.github && (
                        <a
                            href={`https://${globalData.profile.github.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Github size={20} />
                            <span className="font-medium">GitHub</span>
                        </a>
                    )}
                    {globalData.profile.linkedin && (
                        <a
                            href={`https://${globalData.profile.linkedin.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <Linkedin size={20} />
                            <span className="font-medium">LinkedIn</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Experience */}
            <div className="space-y-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="text-blue-600 dark:text-blue-400" /> Experience
                </h3>
                <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-12 pl-8 relative">
                    {experience.map((exp) => (
                        <div key={exp.id} className="relative group">
                            <div className="absolute -left-[41px] top-0 w-6 h-6 bg-white dark:bg-slate-900 border-4 border-blue-600 dark:border-blue-500 rounded-full group-hover:scale-125 transition-transform duration-300" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{exp.role}</h4>
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                    {exp.period}
                                </span>
                            </div>
                            <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">{exp.company}</p>
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm">
                                {exp.description}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Education + Skills */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="text-purple-600 dark:text-purple-400" /> Education
                    </h3>
                    <div className="space-y-4">
                        {education.map((edu) => (
                            <div
                                key={edu.id}
                                className="bg-white dark:bg-slate-800/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm"
                            >
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{edu.degree}</h4>
                                <p className="text-slate-500 dark:text-slate-400 mb-2">{edu.school}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-500">{edu.year}</span>
                                    <span className="text-green-600 dark:text-green-400 font-mono bg-green-100 dark:bg-green-400/10 px-2 py-1 rounded">
                                        {edu.grade}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                        <Zap className="text-yellow-500 dark:text-yellow-400" /> Technical Arsenal
                    </h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {globalData.skills.map((skill, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg shadow-sm"
                            >
                                <IconRenderer iconName={skill.icon} size={16} className="text-slate-500 dark:text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-200 font-medium">
                                    {skill.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Currently Learning</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Explaining High Level System Design Architecture, Advanced
                            Kubernetes Patterns, and Generative AI Model Fine-Tuning.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
