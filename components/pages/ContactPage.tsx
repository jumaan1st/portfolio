"use client";

import React, { useState } from "react";
import { Mail, Phone, Send, Loader2 } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";

export const ContactPage: React.FC = () => {
    const { data } = usePortfolio();
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.type === "email" ? "email" : e.target.type === "text" && e.target.parentElement?.textContent?.includes("NAME") ? "name" : e.target.tagName === "TEXTAREA" ? "message" : "subject"]: e.target.value });
    };

    // Use specific handlers to avoid complex logic in generic handleChange
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

                    {status === "success" && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 rounded-xl flex items-center gap-2">
                            <span className="text-xl">✅</span> Message sent successfully! Check your email for confirmation.
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl">
                            ❌ Something went wrong. Please try again.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={handleEmailChange}
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
                                required
                                type="text"
                                value={formData.subject}
                                onChange={handleSubjectChange}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Project Inquiry"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Message
                            </label>
                            <textarea
                                required
                                rows={5}
                                value={formData.message}
                                onChange={handleMessageChange}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                                placeholder="Tell me about your project goals, timeline, and budget..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 flex justify-center items-center gap-3 text-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {isSubmitting ? "Sending..." : "Send Message"}
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
                                <p className="text-base md:text-lg font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-all">
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
                                <p className="text-base md:text-lg font-medium text-slate-900 dark:text-white break-all">
                                    {data.profile.phone}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <p className="text-slate-600 dark:text-slate-400 text-sm italic">
                            &quot;The only way to do great work is to love what you do.&quot;
                        </p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm mt-2 text-right">— Steve Jobs</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
