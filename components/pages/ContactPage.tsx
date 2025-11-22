"use client";

import React from "react";
import { Mail, Phone, Send } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";

export const ContactPage: React.FC = () => {
    const { data } = usePortfolio();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Let&apos;s Build Together
                        </h2>
                        <p className="text-slate-400">
                            I&apos;m always open to discussing backend development, system
                            design, or partnership opportunities.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <a
                            href={`mailto:${data.profile.email}`}
                            className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 text-blue-400">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm text-slate-500 font-bold uppercase">
                                    Email
                                </h4>
                                <p className="text-white">{data.profile.email}</p>
                            </div>
                        </a>

                        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm text-slate-500 font-bold uppercase">
                                    Phone
                                </h4>
                                <p className="text-white">{data.profile.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                                Message
                            </label>
                            <textarea
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Tell me about your project..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 transform hover:-translate-y-1"
                        >
                            <Send size={18} /> Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
