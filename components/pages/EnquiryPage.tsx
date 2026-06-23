"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
    Mail, User, BookOpen, MessageSquare, Send, CheckCircle2, Lock, 
    ArrowRight, MapPin, Phone, Github, Linkedin, Twitter 
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
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
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
        <div className="max-w-5xl mx-auto my-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    Let's Build Together
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-indigo-650 mx-auto rounded-full" />
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                    Have an application concept or need freelance developer support? Submit your project requirements below to request access to the client portal.
                </p>
                <div className="flex justify-center pt-1 animate-in fade-in slide-in-from-top-2 duration-700 delay-200">
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.02] hover:shadow-md hover:bg-slate-100 dark:hover:bg-slate-850"
                    >
                        <span>Only want to get in touch or give a suggestion?</span>
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
                            Contact / Suggest <ArrowRight size={13} />
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
                                <span>Project Requirements Form</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Please verify your email first to submit the form securely.
                            </p>
                        </div>

                        <form onSubmit={otpSent ? handleSubmitEnquiry : handleSendOtp} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 ml-1">
                                        <User size={13} className="text-slate-400" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={otpSent}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 text-slate-900 dark:text-white"
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-355 flex items-center gap-1.5 ml-1">
                                        <Mail size={13} className="text-slate-400" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        disabled={otpSent}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 text-slate-900 dark:text-white"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                                    disabled={otpSent}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 text-slate-900 dark:text-white"
                                    placeholder="e.g., Web App Development"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 ml-1">
                                    <MessageSquare size={13} className="text-slate-400" /> Message
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    disabled={otpSent}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 text-slate-900 dark:text-white resize-none"
                                    placeholder="Briefly describe project requirements, estimate budget, or timeline..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                />
                            </div>

                            {otpSent && (
                                <div className="p-4 bg-blue-50/30 dark:bg-slate-950/40 border border-blue-100 dark:border-slate-800/80 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Lock size={13} className="text-blue-500" /> Enter 6-Digit Verification Code
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                required
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-2.5 outline-none focus:ring-2 ring-blue-500/50 text-center tracking-[6px] text-lg font-bold w-36 text-slate-900 dark:text-white"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            />
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                                Code sent to <strong className="text-slate-700 dark:text-slate-350">{form.email}</strong>. Check inbox or spam folder.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 flex justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800/60">
                                {otpSent && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp("");
                                        }}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
                                    >
                                        Edit Form
                                    </button>
                                )}

                                {!otpSent ? (
                                    <button
                                        type="submit"
                                        disabled={isSendingOtp}
                                        className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-98 text-xs uppercase tracking-wider"
                                    >
                                        {isSendingOtp ? "Sending..." : "Verify Email"}
                                        <ArrowRight size={13} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || otp.length !== 6}
                                        className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-98 text-xs uppercase tracking-wider"
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                                        <Send size={13} />
                                    </button>
                                )}
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
                            Specializing in building robust and scalable backend systems, secure API gateways, and custom database integrations. Contact me directly to discuss freelance opportunities or software architect collaborations.
                        </p>

                        {/* Structured Contact Details */}
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
                                    className="p-2 bg-white hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
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
                                    className="p-2 bg-white hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-950 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
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
