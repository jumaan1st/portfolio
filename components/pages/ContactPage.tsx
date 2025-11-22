"use client";

import React from "react";
import { Mail, Phone, Send } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";

export const ContactPage: React.FC = () => {
    const { data } = usePortfolio();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto px-4 pb-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Form Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden group order-2 lg:order-1">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500" />

                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Send me a message</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10">
                        Got a project in mind? Fill out the form below and I'll get back to you within 24 hours.
                    </p>

                    <form className="space-y-5 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Subject
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Project Inquiry"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Message
                            </label>
                            <textarea
                                rows={5}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                                placeholder="Tell me about your project goals, timeline, and budget..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 flex justify-center items-center gap-3 text-lg transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <Send size={20} /> Send Message
                        </button>
                    </form>
                </div>

                {/* Info Section */}
                <div className="space-y-8 order-1 lg:order-2">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                            Let&apos;s Build Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Amazing</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            I&apos;m currently available for freelance work and open to full-time opportunities. If you have a project that needs some creative injection, let&apos;s chat.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <a
                            href={`mailto:${data.profile.email}`}
                            className="flex items-center gap-5 p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md overflow-hidden"
                        >
                            <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors shrink-0">
                                <Mail size={28} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                    Email Me
                                </h4>
                                <p className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {data.profile.email}
                                </p>
                            </div>
                        </a>

                        <div className="flex items-center gap-5 p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 bg-purple-500/10 rounded-full text-purple-600 dark:text-purple-400 shrink-0">
                                <Phone size={28} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                    Call Me
                                </h4>
                                <p className="text-lg font-medium text-slate-900 dark:text-white truncate">
                                    {data.profile.phone}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <p className="text-slate-600 dark:text-slate-400 text-sm italic">
                            "The only way to do great work is to love what you do."
                        </p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm mt-2 text-right">— Steve Jobs</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
