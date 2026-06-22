"use client";

import React, { useState } from "react";
import { 
    Mail, User, BookOpen, MessageSquare, Send, CheckCircle2, Lock, 
    ArrowRight, MapPin, Phone, Github, Linkedin, Twitter, Globe 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { usePortfolio } from "@/components/PortfolioContext";

export const EnquiryPage: React.FC = () => {
    const { addToast } = useToast();
    const { data } = usePortfolio();
    const profile = data.profile;

    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.name) {
            addToast("Name and email are required to request code", "error");
            return;
        }

        setIsSendingOtp(true);
        try {
            const res = await fetch("/api/enquiry/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email })
            });

            const json = await res.json();
            if (res.ok) {
                setOtpSent(true);
                addToast("Verification code sent to your email!", "success");
            } else {
                addToast(json.error || "Failed to send verification code", "error");
            }
        } catch (error) {
            console.error(error);
            addToast("An error occurred. Please try again.", "error");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleSubmitEnquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) {
            addToast("Please enter the verification code", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/enquiry/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    otp
                })
            });

            const json = await res.json();
            if (res.ok) {
                setSubmitted(true);
                addToast("Enquiry submitted successfully!", "success");
            } else {
                addToast(json.error || "Failed to verify or submit enquiry", "error");
            }
        } catch (error) {
            console.error(error);
            addToast("An error occurred during submission.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-6 shadow-xl animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto">
                    <CheckCircle2 size={44} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Enquiry Received!</h3>
                    <p className="text-slate-650 dark:text-slate-400 font-medium text-sm leading-relaxed">
                        Thank you for reaching out. We have verified your email and logged your project requirements.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                        If approved, we will onboard you and email your login details for the Client Portal to <strong className="text-slate-700 dark:text-slate-300">{form.email}</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto my-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Let's Build Together
                </h2>
                <div className="h-1.5 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Have a project in mind or need freelancing support? Submit your request below, or connect directly through other channels.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Direct Profile Contact info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center sm:items-start text-center sm:text-left space-y-6">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-650 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300" />
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center border-2 border-slate-200 dark:border-slate-800">
                                {profile.photoLightUrl || profile.photoDarkUrl ? (
                                    <img
                                        src={profile.photoLightUrl || profile.photoDarkUrl}
                                        alt={profile.name || "Mohammed Jumaan"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={44} className="text-slate-400" />
                                )}
                            </div>
                        </div>

                        {/* Name & Title */}
                        <div className="space-y-1">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                {profile.name || "Mohammed Jumaan"}
                            </h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                                {profile.roles && profile.roles.length > 0 ? profile.roles.join(" | ") : "Full Stack Developer"}
                            </p>
                        </div>

                        {/* Brief Intro */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                            {profile.summary || "Get in touch to collaborate on custom web applications, database architectures, and production-ready tech solutions."}
                        </p>

                        {/* Contact details */}
                        <div className="space-y-4 text-xs font-bold text-slate-605 text-slate-600 dark:text-slate-400 w-full pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            {profile.email && (
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <Mail size={16} className="text-slate-400" />
                                    <a href={`mailto:${profile.email}`} className="hover:text-blue-600 dark:hover:text-blue-450 transition-colors truncate">
                                        {profile.email}
                                    </a>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <Phone size={16} className="text-slate-400" />
                                    <a href={`tel:${profile.phone}`} className="hover:text-blue-600 dark:hover:text-blue-450 transition-colors">
                                        {profile.phone}
                                    </a>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        <div className="flex justify-center sm:justify-start gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 w-full">
                            {profile.github && (
                                <a 
                                    href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors border dark:border-slate-800"
                                    title="GitHub"
                                >
                                    <Github size={16} />
                                </a>
                            )}
                            {profile.linkedin && (
                                <a 
                                    href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-650 dark:bg-slate-955 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 rounded-lg transition-colors border dark:border-slate-800"
                                    title="LinkedIn"
                                >
                                    <Linkedin size={16} />
                                </a>
                            )}
                            {profile.twitter && (
                                <a 
                                    href={profile.twitter.startsWith("http") ? profile.twitter : `https://twitter.com/${profile.twitter}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-955 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors border dark:border-slate-800"
                                    title="Twitter"
                                >
                                    <Twitter size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Secure Enquiry Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send className="text-blue-500" size={18} /> Project Requirements Form
                            </h3>
                            <p className="text-xs text-slate-450">
                                Submit your outline project requirements securely. Email verification is required to restrict spam.
                            </p>
                        </div>

                        <form onSubmit={otpSent ? handleSubmitEnquiry : handleSendOtp} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <User size={14} className="text-slate-400" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={otpSent}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500 transition-all disabled:opacity-60"
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Mail size={14} className="text-slate-400" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        disabled={otpSent}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500 transition-all disabled:opacity-60"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <BookOpen size={14} className="text-slate-400" /> Subject
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled={otpSent}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500 transition-all disabled:opacity-60"
                                    placeholder="e.g., E-commerce app development"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <MessageSquare size={14} className="text-slate-400" /> Project Requirements / Message
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    disabled={otpSent}
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500 transition-all disabled:opacity-60"
                                    placeholder="Provide details about features, budget, and estimated timeline..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                />
                            </div>

                            {otpSent && (
                                <div className="p-5 bg-blue-50/50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800/80 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Lock size={14} className="text-blue-500" /> Enter 6-Digit Verification Code
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                required
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-center tracking-[8px] text-lg font-bold w-40"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            />
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                                Code sent to <strong className="text-slate-700 dark:text-slate-300">{form.email}</strong>. Check your inbox/spam folder.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800/60">
                                {otpSent && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp("");
                                        }}
                                        className="text-xs font-bold text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Modify Details
                                    </button>
                                )}

                                {!otpSent ? (
                                    <button
                                        type="submit"
                                        disabled={isSendingOtp}
                                        className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-650 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-98 text-xs uppercase tracking-wider"
                                    >
                                        {isSendingOtp ? "Sending Code..." : "Verify Email"}
                                        <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || otp.length !== 6}
                                        className="ml-auto flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-98 text-xs uppercase tracking-wider"
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                                        <Send size={14} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
