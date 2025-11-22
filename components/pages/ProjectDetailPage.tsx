"use client";

import React, { useState } from "react";
import {
    ChevronLeft,
    ExternalLink,
    Loader2,
    Sparkles,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { callGeminiAPI } from "@/lib/gemini";
import type { Project } from "@/data/portfolioData";

interface Props {
    project: Project;
    onBack?: () => void; // optional: falls back to router.back()
}

export const ProjectDetailPage: React.FC<Props> = ({ project, onBack }) => {
    const [activeTab, setActiveTab] = useState<"overview" | "tech" | "outcome" | "ai">("overview");
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const router = useRouter();

    const handleBack = () => {
        if (onBack) onBack();
        else router.push("/projects");
    };

    const generateInsight = async (type: "pitch" | "tech") => {
        setLoadingAi(true);
        const prompt =
            type === "pitch"
                ? `Write a convincing 30-second elevator pitch for this project: ${project.title}. Description: ${project.longDescription}. Key features: ${(project.features || []).join(
                    ", "
                )}. Keep it punchy and exciting.`
                : `Act as a Senior Software Architect. Critique the tech stack (${project.tech.join(
                    ", "
                )}) used for ${project.title}. Explain why these choices are good for this specific use case (${project.description}).`;

        const response = await callGeminiAPI(prompt);
        setAiInsight(response);
        setLoadingAi(false);
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-5xl mx-auto pb-12">
            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
            >
                <ChevronLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Projects
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-12">
                <div
                    className={`h-48 md:h-64 bg-gradient-to-r ${project.color} relative flex items-center justify-center overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-black/10" />
                    <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg relative z-10">
                        {project.title}
                    </h1>
                    <div className="absolute -bottom-10 -right-10 text-white/10 transform rotate-12 scale-150">
                        <Zap size={300} />
                    </div>
                </div>

                <div className="p-6 md:p-10">
                    <div className="flex flex-col md:flex-row gap-12">
                        {/* Left nav */}
                        <div className="md:w-1/4 space-y-2">
                            {[
                                { key: "overview", label: "Overview" },
                                { key: "tech", label: "Tech" },
                                { key: "outcome", label: "Outcome" },
                                { key: "ai", label: "✨ AI Insights" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() =>
                                        setActiveTab(
                                            tab.key as "overview" | "tech" | "outcome" | "ai"
                                        )
                                    }
                                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                        activeTab === tab.key
                                            ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-500"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    } ${tab.key === "ai" ? "text-purple-400" : ""}`}
                                >
                                    {tab.label}
                                </button>
                            ))}

                            <a
                                href={project.link}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center gap-2 px-4 py-3 mt-8 text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-all justify-center"
                            >
                                <ExternalLink size={18} /> Live Demo
                            </a>
                        </div>

                        {/* Right content */}
                        <div className="md:w-3/4 min-h-[300px]">
                            {activeTab === "overview" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-3">
                                            The Challenge
                                        </h3>
                                        <p className="text-slate-400 leading-relaxed">
                                            {project.longDescription || project.description}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-3">
                                            Key Features
                                        </h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(project.features || [
                                                "Robust Architecture",
                                                "Responsive UI",
                                                "Secure Auth",
                                                "Data Analytics",
                                            ]).map((feature, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 text-slate-300"
                                                >
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />{" "}
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === "tech" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <h3 className="text-xl font-bold text-white mb-3">
                                        Technology Stack
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {project.tech.map((t, i) => (
                                            <div
                                                key={i}
                                                className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="font-mono text-sm text-slate-300">
                          {t}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "outcome" && (
                                <div className="animate-in fade-in duration-300">
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        Challenges & Outcomes
                                    </h3>
                                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 mb-6">
                                        <p className="text-slate-300 leading-relaxed italic">
                                            "
                                            {project.challenges ||
                                                "Building this project required careful consideration of scalability and performance. The main challenge was integrating the disparate APIs in real-time."}
                                            "
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                            <h4 className="text-green-400 font-bold mb-1">100%</h4>
                                            <p className="text-xs text-slate-400 uppercase">
                                                Completion
                                            </p>
                                        </div>
                                        <div className="flex-1 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                                            <h4 className="text-purple-400 font-bold mb-1">Best</h4>
                                            <p className="text-xs text-slate-400 uppercase">
                                                Feedback
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "ai" && (
                                <div className="animate-in fade-in duration-300 space-y-6">
                                    <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="text-purple-400" />
                                            <h3 className="text-xl font-bold text-white">
                                                Generate AI Insights
                                            </h3>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-6">
                                            Use Gemini to analyze this project and generate content
                                            dynamically.
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => generateInsight("pitch")}
                                                disabled={loadingAi}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded-xl text-left transition-all group disabled:opacity-50"
                                            >
                                                <div className="font-bold text-white mb-1 group-hover:text-purple-400">
                                                    Elevator Pitch
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Sell this project in 30 seconds.
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => generateInsight("tech")}
                                                disabled={loadingAi}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 p-4 rounded-xl text-left transition-all group disabled:opacity-50"
                                            >
                                                <div className="font-bold text-white mb-1 group-hover:text-purple-400">
                                                    Technical Critique
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Analyze the tech stack choices.
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {loadingAi && (
                                        <div className="flex justify-center py-8 text-purple-400 animate-pulse">
                                            <Loader2 className="animate-spin mr-2" /> Generating
                                            insights with Gemini...
                                        </div>
                                    )}

                                    {aiInsight && !loadingAi && (
                                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 animate-in slide-in-from-bottom-4">
                                            <h4 className="text-purple-400 font-bold text-sm uppercase mb-2">
                                                Gemini Analysis
                                            </h4>
                                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                                {aiInsight}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
