"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    Building, ArrowLeft, Loader2, Folder, DollarSign, Calendar, ExternalLink, 
    Linkedin, Twitter, Link2, CheckCircle, CheckCircle2 
} from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useToast } from "@/components/ui/Toast";

export const ClientProjectDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();
    const { isAuthenticated, user } = usePortfolio();

    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const projectId = params.id as string;

    const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin');

    const fetchProjectDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/works/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                const errData = await res.json();
                setError(errData.error || "Project details not found");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load project details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId, isAuthenticated]);

    const getShareUrl = () => {
        if (typeof window === "undefined") return "";
        return window.location.href;
    };

    const handleShare = async (platform: 'linkedin' | 'twitter' | 'whatsapp' | 'copy') => {
        const shareUrl = getShareUrl();
        const clientName = project?.client?.company_name || project?.client?.name || "Client";
        const text = `Check out the project collaboration "${project?.title}" with ${clientName} on Mohammed Jumaan's portfolio!`;

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
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-505 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={36} />
                <p className="font-semibold text-sm">Loading Project Details...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-455 rounded-full flex items-center justify-center">
                    <Folder size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Project Not Found</h3>
                    <p className="text-slate-500 text-sm mt-1">{error || "We couldn't retrieve the project details."}</p>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12 max-w-4xl mx-auto px-4 sm:px-6">
            {/* Back Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => {
                        if (project.client_id) {
                            router.push(`/works/clients/${project.client_id}`);
                        } else {
                            router.push("/works");
                        }
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Client Profile
                </button>
            </div>

            {/* Showcase Image or Placeholder Header */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                {project.project_image_url ? (
                    <div className="w-full h-64 sm:h-[400px] relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                        <img
                            src={project.project_image_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 gap-2">
                        <Folder size={48} strokeWidth={1.5} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Project Showcase Mockup</span>
                    </div>
                )}

                {/* Project Header Info */}
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full inline-block tracking-wider ${
                                project.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                                project.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                                project.status === "Quoted" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400" :
                                "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400"
                            }`}>
                                {project.status}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
                                {project.title}
                            </h2>
                        </div>

                        {/* Social sharing bar */}
                        <div className="flex gap-1.5 shrink-0 sm:self-center">
                            <button
                                onClick={() => handleShare('linkedin')}
                                className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 dark:bg-slate-850 dark:hover:bg-blue-900/30 rounded-xl transition-all border dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold"
                                title="Share on LinkedIn"
                            >
                                <Linkedin size={14} className="text-[#0077b5]" />
                                <span>Share</span>
                            </button>
                            <button
                                onClick={() => handleShare('twitter')}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl transition-all border dark:border-slate-800"
                                title="Share on Twitter"
                            >
                                <Twitter size={14} />
                            </button>
                            <button
                                onClick={() => handleShare('whatsapp')}
                                className="p-2 bg-slate-50 hover:bg-green-50 text-slate-500 hover:text-green-600 dark:bg-slate-850 dark:hover:bg-green-900/30 rounded-xl transition-all border dark:border-slate-800"
                                title="Share on WhatsApp"
                            >
                                <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.578 1.977 14.106.953 11.5.953c-5.441 0-9.865 4.37-9.87 9.8-.002 1.777.467 3.51 1.358 5.052L1.97 21.05l5.348-1.401z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleShare('copy')}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl transition-all border dark:border-slate-800"
                                title="Copy Link"
                            >
                                <Link2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-655 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap">
                        {project.description || <p className="italic text-slate-400">No project description provided.</p>}
                    </div>

                    {project.live_url && (
                        <div className="pt-2">
                            <a
                                href={project.live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                            >
                                Visit Live Website <ExternalLink size={14} />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Grid: Left Client brand info, Right Pricing / Milestones (conditional) */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Client Company Info Card */}
                {project.client && (
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-wider border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
                                <Building size={14} /> Client Identity
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shadow-sm shrink-0">
                                    {project.client.company_logo_url ? (
                                        <img src={project.client.company_logo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building size={20} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{project.client.company_name || project.client.name}</h4>
                                    <p className="text-[10px] text-slate-450 truncate">Project Partnership Partner</p>
                                </div>
                            </div>
                            {project.client.description && (
                                <div 
                                    className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-4 mt-2"
                                    dangerouslySetInnerHTML={{ __html: project.client.description }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Conditional Pricing & Installments (Admin Only) */}
                <div className={project.client ? "md:col-span-2" : "md:col-span-3"}>
                    {isAdmin ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-wider border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
                                <DollarSign size={14} /> Financial Installments (Admin view)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-850">
                                    <span className="text-[9px] font-bold text-slate-450 uppercase">Base Price</span>
                                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">₹{(project.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-2xl border dark:border-slate-850">
                                    <span className="text-[9px] font-bold text-slate-450 uppercase">Discount</span>
                                    <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-1">-₹{(project.discount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-950/20">
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Net Cost</span>
                                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">₹{((project.cost - project.discount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Installment Milestones</span>
                                {!project.payments || project.payments.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No milestones defined. Net price settled as single completion payment.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {project.payments.map((pay: any) => {
                                            const isPaid = pay.status === "Paid";
                                            return (
                                                <div key={pay.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-850 text-xs">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                                            isPaid ? "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-yellow-105 text-yellow-750 dark:bg-yellow-950/30 dark:text-yellow-400"
                                                        }`}>
                                                            {isPaid ? <CheckCircle size={14} /> : <Loader2 size={12} className="animate-spin text-yellow-600" />}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-205">{pay.title}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-extrabold text-slate-900 dark:text-white">₹{(pay.amount / 100).toLocaleString()}</p>
                                                        <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                            isPaid ? "bg-green-105 text-green-700 dark:bg-green-950/30" : "bg-yellow-105 text-yellow-805 dark:bg-yellow-950/20"
                                                        }`}>{pay.status}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {project.deadline && (
                                <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 border-t dark:border-slate-800">
                                    <Calendar size={14} />
                                    <span>Target Completion Deadline: <strong className="text-slate-800 dark:text-slate-200">{new Date(project.deadline).toLocaleDateString()}</strong></span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[160px]">
                            <Building className="text-slate-350 dark:text-slate-600 mb-1" size={28} />
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Commercial Client Profile</h4>
                            <p className="text-xs text-slate-450 max-w-sm">Collaboration pricing logs and deadline timelines are private agreements and visible only to portfolio administrators.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
