"use client";

import React, { useState } from "react";
import { 
    Mail, User, BookOpen, MessageSquare, Send, CheckCircle2, 
    ArrowRight, MapPin, Github, Linkedin, Twitter, Loader2 
} from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";
import Link from "next/link";

export const ContactPage: React.FC = () => {
    const { data } = usePortfolio();
    const profile = data.profile;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    // Auto-fill identity from localStorage
    React.useEffect(() => {
        const stored = localStorage.getItem("portfolio_user_identity");
        if (stored) {
            try {
                const { name, email } = JSON.parse(stored);
                setFormData(prev => ({ ...prev, name: name || "", email: email || "" }));
            } catch (e) {
                // ignore check
            }
        }
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value });
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value });
    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, subject: e.target.value });
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus("idle");

        try {
            // Save identity for future use
            localStorage.setItem("portfolio_user_identity", JSON.stringify({ name: formData.name, email: formData.email }));

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, type: "Contact" })
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ name: formData.name, email: formData.email, subject: "", message: "" }); // Keep identity, clear message
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto my-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    Let's Connect
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-indigo-650 mx-auto rounded-full" />
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                    Have a suggestion, feedback, or a general question? Drop me a line below and let's get talking!
                </p>
                <div className="flex justify-center pt-1 animate-in fade-in slide-in-from-top-2 duration-700 delay-200">
                    <Link
                        href="/enquiry"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-350 transition-all hover:scale-[1.02] hover:shadow-md hover:bg-slate-100 dark:hover:bg-slate-850"
                    >
                        <span>Need full app development or freelance estimates?</span>
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
                            Request Portal Access <ArrowRight size={13} />
                        </span>
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Column - Rendered FIRST on mobile */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send className="text-blue-500" size={18} /> 
                                <span>Send a Message</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Fill out the details below and I'll get back to you within 24 hours.
                            </p>
                        </div>

                        {status === "success" && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
                                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                                <span>Message sent successfully! Check your email for confirmation.</span>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-xs font-semibold animate-in fade-in duration-300">
                                <span>❌ Something went wrong. Please try again.</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 ml-1">
                                        <User size={13} className="text-slate-400" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={handleNameChange}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-355 flex items-center gap-1.5 ml-1">
                                        <Mail size={13} className="text-slate-400" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleEmailChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 ml-1">
                                    <BookOpen size={13} className="text-slate-400" /> Subject
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="e.g., Feedback or general inquiry"
                                    value={formData.subject}
                                    onChange={handleSubjectChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 ml-1">
                                    <MessageSquare size={13} className="text-slate-400" /> Message
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-202 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white resize-none"
                                    placeholder="Tell me what's on your mind..."
                                    value={formData.message}
                                    onChange={handleMessageChange}
                                />
                            </div>

                            <div className="pt-3 flex justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800/60">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-98 text-xs uppercase tracking-wider"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin mr-1" size={13} /> : <Send size={13} />}
                                    {isSubmitting ? "Sending..." : "Send Message"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Profile Column - Rendered SECOND on mobile */}
                <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left space-y-5">
                        
                        {/* Avatar & Title Row */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white dark:bg-slate-955 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                                {profile.photoLightUrl || profile.photoDarkUrl ? (
                                    <img
                                        src={profile.photoLightUrl || profile.photoDarkUrl}
                                        alt={profile.name || "Mohammed Jumaan"}
                                        className="w-full h-full object-cover object-top"
                                    />
                                ) : (
                                    <User size={36} className="text-slate-400" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    {profile.name || "Mohammed Jumaan"}
                                </h3>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                                    {profile.roles && profile.roles.length > 0 ? profile.roles.join(" | ") : "Full Stack Developer"}
                                </p>
                            </div>
                        </div>

                        {/* Description (Shorter, cleaner summary) */}
                        <p className="text-slate-650 dark:text-slate-400 text-xs leading-relaxed font-medium">
                            Specializing in building robust and scalable backend systems, secure API gateways, and custom database integrations. Feel free to contact me or send suggestions.
                        </p>

                        {/* Structured Contact Details (WITHOUT PHONE NUMBER) */}
                        <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-450 w-full pt-4 border-t border-slate-200 dark:border-slate-800/80">
                            {profile.email && (
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <Mail size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                    <a href={`mailto:${profile.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                                        {profile.email}
                                    </a>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <MapPin size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">{profile.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Social Buttons */}
                        <div className="flex justify-center sm:justify-start gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80 w-full">
                            {profile.github && (
                                <a 
                                    href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-955 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                                    title="GitHub"
                                >
                                    <Github size={15} />
                                </a>
                            )}
                            {profile.linkedin && (
                                <a 
                                    href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-955 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                                    title="LinkedIn"
                                >
                                    <Linkedin size={15} />
                                </a>
                            )}
                            {profile.twitter && (
                                <a 
                                    href={profile.twitter.startsWith("http") ? profile.twitter : `https://twitter.com/${profile.twitter}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-955 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                                    title="Twitter"
                                >
                                    <Twitter size={15} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
