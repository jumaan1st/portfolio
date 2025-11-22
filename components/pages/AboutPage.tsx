"use client";

import React from "react";
import { Briefcase, GraduationCap, Zap } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";

export const AboutPage: React.FC = () => {
    const { data } = usePortfolio();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
                <div className="h-1 w-20 bg-blue-600 dark:bg-blue-500 mx-auto rounded-full" />
            </div>

            {/* Experience */}
            <div className="space-y-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="text-blue-600 dark:text-blue-400" /> Experience
                </h3>
                <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-12 pl-8 relative">
                    {data.experience.map((exp) => (
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
                        {data.education.map((edu) => (
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-yellow-500 dark:text-yellow-400" /> Technical Arsenal
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {data.skills.map((skill, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg shadow-sm"
                            >
                                <skill.icon size={16} className="text-slate-500 dark:text-slate-400" />
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
