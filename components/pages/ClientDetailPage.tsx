"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    Building, Mail, Phone, Calendar, ArrowLeft, Loader2, Folder, 
    DollarSign, Linkedin, Twitter, Link2, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "@/components/PortfolioContext";
import { useToast } from "@/components/ui/Toast";

export const ClientDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();
    const { isAuthenticated, user } = usePortfolio();

    const [client, setClient] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const clientId = params.id as string;
    const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin');

    const getShareUrl = (projectId?: string) => {
        if (typeof window === "undefined") return "";
        return projectId ? `${window.location.origin}/works/projects/${projectId}` : window.location.href;
    };

    const handleShare = async (platform: 'linkedin' | 'twitter' | 'whatsapp' | 'copy', projectId?: string) => {
        const shareUrl = getShareUrl(projectId);
        const title = client?.company_name || client?.name;
        const text = projectId 
            ? `Check out the project collaboration "${client?.projects?.find((p: any) => p.id === projectId)?.title}" with ${title} on Mohammed Jumaan's portfolio!`
            : `Check out the project collaborations and partnership with ${title} on Mohammed Jumaan's portfolio!`;

        if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + shareUrl)}`, '_blank');
        } else if (platform === 'copy') {
            try {
                await navigator.clipboard.writeText(shareUrl);
                addToast("Link copied to clipboard!", "success");
            } catch (err) {
                console.error(err);
                addToast("Failed to copy link.", "error");
            }
        }
    };

    useEffect(() => {
        const fetchClientDetails = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/works/clients/${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    setClient(data);
                } else {
                    const errData = await res.json();
                    setError(errData.error || "Client details not found");
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load client details");
            } finally {
                setIsLoading(false);
            }
        };

        if (clientId) {
            fetchClientDetails();
        }
    }, [clientId]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={36} />
                <p className="font-semibold text-sm">Loading Client Profile...</p>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                    <Building size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Client Profile Not Found</h3>
                    <p className="text-slate-500 text-sm mt-1">{error || "We couldn't retrieve information for this client."}</p>
                </div>
                <button
                    onClick={() => router.push("/works")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-755 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Back to Works
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12 max-w-5xl mx-auto px-4 sm:px-6">
            {/* Back Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/works")}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Works
                </button>
            </div>

            {/* Profile Header */}
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 sm:gap-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
                
                {/* Logo */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80 shadow-md flex-shrink-0 group hover:border-blue-500/40 dark:hover:border-blue-500/30 transition-all duration-300">
                    {client.company_logo_url ? (
                        <img
                            src={client.company_logo_url}
                            alt={client.company_name || client.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <Building className="text-slate-400 dark:text-slate-500" size={48} />
                    )}
                </div>

                <div className="text-center sm:text-left space-y-3 flex-grow min-w-0">
                    <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100/50 dark:border-blue-900/20">
                        Valued Partner
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                        {client.company_name || client.name}
                    </h2>
                    {client.company_name && (
                        <p className="text-slate-500 text-sm font-semibold">
                            Representative: <span className="text-slate-700 dark:text-slate-300 font-bold">{client.name}</span>
                        </p>
                    )}
                </div>

                {/* Share buttons */}
                <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-0 shrink-0">
                    <button
                        onClick={() => handleShare('linkedin')}
                        className="px-4 py-2.5 bg-white hover:bg-blue-50/50 hover:text-blue-600 dark:bg-slate-950 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200/85 dark:border-slate-800/85 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Share profile on LinkedIn"
                    >
                        <Linkedin size={14} className="text-[#0077b5]" />
                        <span>Share Client</span>
                    </button>
                    <button
                        onClick={() => handleShare('twitter')}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl transition-all border border-slate-200/85 dark:border-slate-800/85 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Share on Twitter/X"
                    >
                        <Twitter size={14} />
                    </button>
                    <button
                        onClick={() => handleShare('whatsapp')}
                        className="p-2.5 bg-white hover:bg-green-50/50 hover:text-green-600 text-slate-600 dark:bg-slate-955 dark:hover:bg-green-950/30 rounded-xl transition-all border border-slate-200/85 dark:border-slate-800/85 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Share on WhatsApp"
                    >
                        <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.578 1.977 14.106.953 11.5.953c-5.441 0-9.865 4.37-9.87 9.8-.002 1.777.467 3.51 1.358 5.052L1.97 21.05l5.348-1.401z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleShare('copy')}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl transition-all border border-slate-200/85 dark:border-slate-800/85 text-slate-600 dark:text-slate-350 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Copy profile URL"
                    >
                        <Link2 size={14} />
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Panel: Client Profile Meta */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex items-center justify-between">
                            <h3 className="font-extrabold text-xs text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                                Partnership Info
                            </h3>
                            {isAdmin && (
                                <span className="text-[8px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200/30">
                                    Admin View
                                </span>
                            )}
                        </div>

                        <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {/* Joined Date */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 shrink-0">
                                    <Calendar size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Partner Since</p>
                                    <p className="text-slate-850 dark:text-slate-200 mt-0.5">
                                        {new Date(client.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>

                            {/* Total Projects */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Folder size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Collaborations</p>
                                    <p className="text-slate-850 dark:text-slate-200 mt-0.5">
                                        {client.projects?.length || 0} {client.projects?.length === 1 ? 'Project' : 'Projects'}
                                    </p>
                                </div>
                            </div>

                            {/* Admin-only contact fields */}
                            {isAdmin && (
                                <>
                                    {client.email && (
                                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shrink-0">
                                                <Mail size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Admin Email</p>
                                                <p className="text-slate-850 dark:text-slate-200 mt-0.5 truncate" title={client.email}>
                                                    {client.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-500 shrink-0">
                                                <Phone size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Admin Phone</p>
                                                <p className="text-slate-850 dark:text-slate-200 mt-0.5">
                                                    {client.phone}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Client Bio */}
                <div className="md:col-span-2">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 h-full min-h-[250px] flex flex-col">
                        <h3 className="font-extrabold text-xs text-slate-450 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-3">
                            Company Overview
                        </h3>
                        <div className="flex-grow pt-2">
                            {client.description ? (
                                <div 
                                    className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-350 text-sm leading-relaxed ql-editor !p-0"
                                    dangerouslySetInnerHTML={{ __html: client.description }}
                                />
                            ) : (
                                <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                                    No profile description provided.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Client Projects */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-2">
                    <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Folder className="text-blue-500" size={24} /> Client Case Studies
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">
                            A detailed look at engineering accomplishments and product solutions from our collaboration.
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-955/40 dark:text-amber-400 px-3 py-1 rounded-full uppercase border border-amber-200/50 dark:border-amber-900/20">
                            Viewing Admin Pricing Milestones
                        </div>
                    )}
                </div>

                {client.projects && client.projects.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {client.projects.map((proj: any) => (
                            <div
                                key={proj.id}
                                id={`project-${proj.id}`}
                                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div className="flex flex-col">
                                    {/* Image banner with scale hover effect */}
                                    {proj.project_image_url ? (
                                        <div className="relative w-full aspect-video overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                                            <img
                                                src={proj.project_image_url}
                                                alt={proj.title}
                                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                                            />
                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full backdrop-blur-md shadow-md border ${
                                                    proj.status === "Completed" ? "bg-emerald-500/90 text-white border-emerald-400/30" :
                                                    proj.status === "In Progress" ? "bg-blue-500/90 text-white border-blue-400/30" :
                                                    proj.status === "Quoted" ? "bg-amber-500/95 text-slate-950 border-amber-400/30" :
                                                    "bg-slate-600/95 text-white border-slate-500/30"
                                                }`}>
                                                    {proj.status}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-video bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-600 gap-2 relative">
                                            <Folder size={44} strokeWidth={1.2} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Project Showcase Mockup</span>
                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                                                    proj.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                                                    proj.status === "In Progress" ? "bg-blue-105 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                                                    proj.status === "Quoted" ? "bg-yellow-105 text-yellow-850 dark:bg-yellow-950/30 dark:text-yellow-400" :
                                                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                }`}>
                                                    {proj.status}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text content details */}
                                    <div className="p-6 sm:p-8 space-y-4">
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
                                            {proj.title}
                                        </h4>
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap">
                                            {proj.description || <p className="italic text-slate-400">No project details provided.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Private details */}
                                <div className="p-6 sm:p-8 pt-0 flex flex-col gap-4">
                                    {/* Admin View pricing on the card itself */}
                                    {isAdmin && proj.cost !== undefined && proj.cost !== null && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border dark:border-slate-850 flex items-center justify-between text-xs mt-2">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Admin Financial Status</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                                        ₹{(proj.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {proj.discount > 0 && (
                                                        <span className="text-[10px] text-rose-500 font-bold">
                                                            (-₹{(proj.discount / 100).toLocaleString()} disc)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {proj.deadline && (
                                                <div className="text-right">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Date</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {new Date(proj.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Primary card action buttons */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/works/projects/${proj.id}`}
                                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group/btn"
                                            >
                                                <span>View Full Details</span>
                                                <span className="transform translate-x-0 group-hover/btn:translate-x-1 transition-transform">→</span>
                                            </Link>
                                            
                                            {proj.live_url && (
                                                <>
                                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                                    <a
                                                        href={proj.live_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        <span>Live Demo</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </>
                                            )}
                                        </div>

                                        {/* Project share menu */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleShare('linkedin', proj.id)}
                                                className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 dark:bg-slate-950 dark:hover:bg-blue-900/30 rounded-lg transition-colors border dark:border-slate-800"
                                                title="Share Project on LinkedIn"
                                            >
                                                <Linkedin size={12} className="text-[#0077b5]" />
                                            </button>
                                            <button
                                                onClick={() => handleShare('whatsapp', proj.id)}
                                                className="p-2 bg-slate-50 hover:bg-green-50/50 text-slate-400 hover:text-green-600 dark:bg-slate-950 dark:hover:bg-green-950/20 rounded-lg transition-colors border dark:border-slate-800"
                                                title="Share Project on WhatsApp"
                                            >
                                                <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.578 1.977 14.106.953 11.5.953c-5.441 0-9.865 4.37-9.87 9.8-.002 1.777.467 3.51 1.358 5.052L1.97 21.05l5.348-1.401z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleShare('copy', proj.id)}
                                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-lg transition-colors border dark:border-slate-800"
                                                title="Copy Project Link"
                                            >
                                                <Link2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-400 dark:text-slate-500 italic">
                        No projects registered for this client.
                    </div>
                )}
            </div>
        </div>
    );
};
