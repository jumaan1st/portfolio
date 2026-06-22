"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
    Database, HardDrive, FileText, FolderOpen, CheckCircle, 
    AlertTriangle, RefreshCw, ShieldAlert, Eye, X, 
    ChevronLeft, ChevronRight, Trash2, Star, MessageSquare, 
    Zap, BarChart3, Mail, Send, Sparkles, User, UserCheck
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// --- INTERFACES ---

interface VisitEvent {
    path: string;
    timestamp: string;
}

interface SessionLog {
    session_id: string;
    ip_address: string;
    user_identity: { name?: string; email?: string; phone?: string };
    geo_info: { city?: string; country?: string; isp?: string };
    device_info: { browser?: string; os?: string; device?: string; userAgent?: string; screen?: string; trafficSource?: string; };
    visit_history: VisitEvent[];
    started_at: string;
    last_active_at: string;
    browser_name?: string;
    operating_system?: string;
    device_type?: string;
    country_name?: string;
    city_name?: string;
}

interface Review {
    review_id: number;
    name: string;
    email: string;
    phone: string | null;
    stars: number;
    feedback: string | null;
    created_at: string;
    updated_at: string;
}

interface AiLog {
    id: number;
    user_name: string | null;
    user_email: string | null;
    action_type: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    provider: string | null;
    created_at: string;
}

interface OutreachLog {
    id: string;
    company_name: string;
    role: string;
    status: string;
    email_sent_count: number;
    email_opens: number;
    last_opened_at: string | null;
    last_contacted_at: string | null;
    created_at: string;
}

// --- USAGE STATS COMPONENTS ---

interface StatsData {
    database: { sizeBytes: number; blogsCount: number; projectsCount: number; };
    storage: { sizeBytes: number; fileCount: number; };
    limits: { dbMaxBytes: number; storageMaxBytes: number; };
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UsageStatsTab = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error("Failed to fetch statistics");
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error(e);
            setError("Could not load usage data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const getPercent = (used: number, total: number) => Math.min(100, Math.max(0, (used / total) * 100));

    const getColor = (percent: number) => {
        if (percent > 90) return 'text-red-500 bg-red-500';
        if (percent > 75) return 'text-yellow-500 bg-yellow-500';
        return 'text-green-500 bg-green-500';
    };

    if (loading && !stats) return <div className="p-12 text-center text-slate-400">Loading resource stats...</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
    if (!stats) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-end">
                <button onClick={fetchStats} className="text-sm flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stats
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* DATABASE CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Database size={120} />
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Database className="text-blue-500" /> Database (Postgres)
                    </h2>

                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                            <span>Storage Used</span>
                            <span>{formatBytes(stats.database.sizeBytes)} / {formatBytes(stats.limits.dbMaxBytes)}</span>
                        </div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${getColor(getPercent(stats.database.sizeBytes, stats.limits.dbMaxBytes)).split(' ')[1]}`}
                                style={{ width: `${getPercent(stats.database.sizeBytes, stats.limits.dbMaxBytes)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">
                            {getPercent(stats.database.sizeBytes, stats.limits.dbMaxBytes).toFixed(1)}% Used
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
                                <FileText size={14} /> Blog Posts
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {stats.database.blogsCount}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
                                <FolderOpen size={14} /> Projects
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {stats.database.projectsCount}
                            </div>
                        </div>
                    </div>
                </div>

                {/* STORAGE CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <HardDrive size={120} />
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <HardDrive className="text-orange-500" /> Cloudflare R2 Storage
                    </h2>

                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                            <span>Bucket Size</span>
                            <span>{formatBytes(stats.storage.sizeBytes)} / {formatBytes(stats.limits.storageMaxBytes)}</span>
                        </div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${getColor(getPercent(stats.storage.sizeBytes, stats.limits.storageMaxBytes)).split(' ')[1]}`}
                                style={{ width: `${getPercent(stats.storage.sizeBytes, stats.limits.storageMaxBytes)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">
                            {getPercent(stats.storage.sizeBytes, stats.limits.storageMaxBytes).toFixed(1)}% Used
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
                                <FileText size={14} /> Total Files
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {stats.storage.fileCount}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
                                <CheckCircle size={14} /> Health
                            </div>
                            <div className="text-sm font-bold text-green-500 mt-1">
                                Active
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ReportsPage() {
    const { isAuthenticated, isLoading: authLoading, user } = usePortfolio();
    const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin');
    const router = useRouter();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'audit' | 'usage' | 'reviews' | 'ai_usage'>('audit');

    // --- Tab 1: User Audit Log State ---
    const [sessions, setSessions] = useState<SessionLog[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<SessionLog | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [auditFilters, setAuditFilters] = useState({ startDate: "", endDate: "", ip: "" });
    const [deleteSessionConfirm, setDeleteSessionConfirm] = useState<{ show: boolean, sessionId: string | null }>({ show: false, sessionId: null });
    const [sessionsPagination, setSessionsPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

    // --- Tab 3: Reviews State ---
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [reviewsFilter, setReviewsFilter] = useState({ type: 'all', stars: '', search: '', userEmail: 'all' });
    const [uniqueUsers, setUniqueUsers] = useState<{ name: string; email: string }[]>([]);
    const [groupByUser, setGroupByUser] = useState(false);
    const [replySubject, setReplySubject] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
    const [isDrafting, setIsDrafting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [deleteReviewConfirm, setDeleteReviewConfirm] = useState<{ show: boolean, reviewId: number | null }>({ show: false, reviewId: null });
    const [reviewsStats, setReviewsStats] = useState({
        totalReviews: 0,
        averageRating: 0.0,
        starBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviewsCount: 0,
        contactsCount: 0
    });

    // --- Tab 4: AI & Outreach Logs State ---
    const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
    const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
    const [usageLoading, setUsageLoading] = useState(true);
    const [aiPagination, setAiPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [outreachPagination, setOutreachPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [aiFilter, setAiFilter] = useState({ search: '', provider: 'all', actionType: 'all' });
    const [usageStats, setUsageStats] = useState({
        aggregates: { totalTokens: 0, promptTokens: 0, completionTokens: 0, totalRequests: 0 },
        providers: [] as { provider: string, tokens: number, requests: number }[],
        actions: [] as { action: string, tokens: number, requests: number }[]
    });

    // Helper to group reviews by user email when grouping toggle is enabled
    const groupedReviews = React.useMemo(() => {
        if (!groupByUser) return null;
        const groups: { [email: string]: { name: string; email: string; phone: string | null; reviews: Review[] } } = {};
        reviews.forEach(rev => {
            if (!groups[rev.email]) {
                groups[rev.email] = {
                    name: rev.name,
                    email: rev.email,
                    phone: rev.phone,
                    reviews: []
                };
            }
            groups[rev.email].reviews.push(rev);
        });
        return Object.values(groups);
    }, [reviews, groupByUser]);

    // --- FETCH CALLS ---

    // Audit sessions
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const query = new URLSearchParams({
                page: sessionsPagination.page.toString(),
                limit: sessionsPagination.limit.toString(),
                ...auditFilters
            });

            const res = await fetch(`/api/admin/audit/logs?${query.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setSessions(data.logs);
                setSessionsPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            } else {
                addToast("Failed to load sessions", "error");
            }
        } catch (error) {
            console.error("Fetch sessions error", error);
            addToast("Error loading sessions", "error");
        } finally {
            setSessionsLoading(false);
        }
    }, [sessionsPagination.page, sessionsPagination.limit, auditFilters, addToast]);

    // Reviews & feedback
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        try {
            const query = new URLSearchParams({
                page: reviewsPagination.page.toString(),
                limit: reviewsPagination.limit.toString(),
                type: reviewsFilter.type,
                stars: reviewsFilter.stars,
                search: reviewsFilter.search,
                userEmail: reviewsFilter.userEmail
            });

            const res = await fetch(`/api/admin/reviews?${query.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setReviews(data.reviews);
                setReviewsStats(data.stats);
                setUniqueUsers(
                    Array.from(
                        new Map((data.users || []).map((u: { name: string; email: string }) => [u.email, u])).values()
                    ) as { name: string; email: string }[]
                );
                setReviewsPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            } else {
                addToast(data.error || "Failed to load feedback", "error");
            }
        } catch (error) {
            console.error("Fetch reviews error", error);
            addToast("Error loading feedback", "error");
        } finally {
            setReviewsLoading(false);
        }
    }, [reviewsPagination.page, reviewsPagination.limit, reviewsFilter, addToast]);

    // AI Usage and Outreach Logs
    const fetchUsageStats = useCallback(async () => {
        setUsageLoading(true);
        try {
            const query = new URLSearchParams({
                page: aiPagination.page.toString(),
                limit: aiPagination.limit.toString(),
                outreachPage: outreachPagination.page.toString(),
                outreachLimit: outreachPagination.limit.toString(),
                search: aiFilter.search,
                provider: aiFilter.provider,
                actionType: aiFilter.actionType
            });

            const res = await fetch(`/api/admin/usage?${query.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setAiLogs(data.aiLogs.logs);
                setAiPagination(prev => ({
                    ...prev,
                    total: data.aiLogs.pagination.total,
                    totalPages: data.aiLogs.pagination.totalPages
                }));
                setOutreachLogs(data.outreachLogs.applications);
                setOutreachPagination(prev => ({
                    ...prev,
                    total: data.outreachLogs.pagination.total,
                    totalPages: data.outreachLogs.pagination.totalPages
                }));
                setUsageStats(data.stats);
            } else {
                addToast(data.error || "Failed to load usage statistics", "error");
            }
        } catch (error) {
            console.error("Fetch usage error", error);
            addToast("Error loading usage stats", "error");
        } finally {
            setUsageLoading(false);
        }
    }, [aiPagination.page, aiPagination.limit, outreachPagination.page, outreachPagination.limit, aiFilter, addToast]);

    // Initial Trigger on Auth & Page change
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/admin");
        } else if (isAuthenticated && user && user.role !== 'admin' && user.role !== 'view_only_admin') {
            router.push("/admin");
        } else if (isAuthenticated) {
            if (activeTab === 'audit') {
                fetchSessions();
            } else if (activeTab === 'reviews') {
                fetchReviews();
            } else if (activeTab === 'ai_usage') {
                fetchUsageStats();
            }
        }
    }, [
        isAuthenticated, authLoading, user,
        sessionsPagination.page, 
        reviewsPagination.page, 
        aiPagination.page, 
        outreachPagination.page,
        router, activeTab, 
        fetchSessions, fetchReviews, fetchUsageStats
    ]);

    // Sync reply fields when a review is selected
    useEffect(() => {
        if (selectedReview) {
            const isProjectReview = selectedReview.feedback?.startsWith('[Project Review]');
            setReplySubject(isProjectReview ? "Re: Your review on my portfolio" : "Re: Your message to Mohammed Jumaan");
            setReplyMessage("");
        }
    }, [selectedReview]);

    // --- ACTION HANDLERS ---

    const handleExport = async (type: 'summary' | 'detailed' | 'ip' = 'detailed') => {
        if (type === 'ip' && !auditFilters.ip) {
            addToast("Please enter an IP address in filters first", "error");
            return;
        }

        setGeneratingReport(true);
        setShowReportOptions(false);
        try {
            const res = await fetch('/api/admin/audit/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters: auditFilters, type })
            });
            const data = await res.json();
            if (data.success) {
                addToast("Report sent to your email!", "success");
            } else {
                addToast(data.message || "Failed to generate report", "error");
            }
        } catch (error) {
            addToast("Error sending report", "error");
        } finally {
            setGeneratingReport(false);
        }
    };

    const getDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const renderStars = (count: number) => {
        return (
            <div className="flex gap-0.5 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < count ? 'fill-yellow-400' : 'text-slate-300 dark:text-slate-700'} />
                ))}
            </div>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-slate-950">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 relative text-slate-700 dark:text-slate-300 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-blue-650 dark:text-blue-400 hover:underline mb-3 font-bold transition-all">
                            <ChevronLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="text-blue-600 dark:text-blue-500" />
                            System Reports
                        </h1>
                        <p className="text-slate-505 dark:text-slate-400 mt-1">
                            Monitor audit logs, resource limits, customer feedback, and AI token metrics.
                        </p>
                    </div>
                </div>

                {/* TABS HEADER */}
                <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`pb-3 px-1 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${activeTab === 'audit'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <UserCheck size={16} /> User Audit Log
                    </button>
                    <button
                        onClick={() => setActiveTab('usage')}
                        className={`pb-3 px-1 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${activeTab === 'usage'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <HardDrive size={16} /> Resource Usage
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-3 px-1 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${activeTab === 'reviews'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <MessageSquare size={16} /> Reviews & Feedback
                    </button>
                    <button
                        onClick={() => setActiveTab('ai_usage')}
                        className={`pb-3 px-1 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${activeTab === 'ai_usage'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Zap size={16} /> AI & Outreach Logs
                    </button>
                </div>

                {/* --- TAB CONTENT: AUDIT LOG --- */}
                {activeTab === 'audit' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Header Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowReportOptions(true)}
                                disabled={generatingReport}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-blue-500/20 text-sm"
                            >
                                {generatingReport ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={16} />
                                        Email PDF Report
                                    </>
                                )}
                            </button>
                            <button onClick={fetchSessions} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                                <RefreshCw size={18} className={sessionsLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">From</label>
                                <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={auditFilters.startDate} onChange={e => setAuditFilters(p => ({ ...p, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">To</label>
                                <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={auditFilters.endDate} onChange={e => setAuditFilters(p => ({ ...p, endDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Search IP</label>
                                <input type="text" placeholder="IP..." className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={auditFilters.ip} onChange={e => setAuditFilters(p => ({ ...p, ip: e.target.value }))} />
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => { setSessionsPagination(p => ({ ...p, page: 1 })); fetchSessions(); }} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Apply Filters</button>
                            </div>
                        </div>

                        {/* Sessions Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">User / Identity</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Location</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Source</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Timing</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Activity</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-10 text-center">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sessionsLoading ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading audit sessions...</td></tr>
                                        ) : sessions.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No sessions recorded yet.</td></tr>
                                        ) : (
                                            sessions.map((log, i) => {
                                                const now = new Date().getTime();
                                                const lastActive = new Date(log.last_active_at).getTime();
                                                const isActive = (now - lastActive) < 30 * 60 * 1000;

                                                return (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {log.user_identity?.name || 'Guest User'}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-mono">{log.ip_address}</span>
                                                                {log.user_identity?.email && <span className="text-xs text-blue-500">{log.user_identity.email}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900 dark:text-white">{log.geo_info?.country || 'Unknown'}</span>
                                                                <span className="text-xs">{log.geo_info?.city}</span>
                                                                <span className="text-xs text-slate-400 truncate max-w-[150px]">{log.geo_info?.isp}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.device_info?.trafficSource ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                {log.device_info?.trafficSource || 'Direct'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-350 dark:bg-slate-700'}`}></div>
                                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                        {isActive ? 'Active Now' : 'Offline'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(log.started_at).toLocaleTimeString()}
                                                                </span>
                                                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                                                                    {getDuration(log.started_at, log.last_active_at)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {new Set(log.visit_history?.map(v => v.path)).size || 0} Unique Pages
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-mono">
                                                                    (Total: {log.visit_history?.length || 0})
                                                                </span>
                                                                <span className="text-xs text-slate-500 truncate max-w-[150px]" title={log.visit_history?.[log.visit_history.length - 1]?.path}>
                                                                    Latest: {log.visit_history?.[log.visit_history.length - 1]?.path}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => setSelectedSession(log)}
                                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-600 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                {user?.role !== 'view_only_admin' && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteSessionConfirm({ show: true, sessionId: log.session_id });
                                                                        }}
                                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                                                        title="Delete Log"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Page {sessionsPagination.page} of {sessionsPagination.totalPages} ({sessionsPagination.total} total)</p>
                                <div className="flex gap-2">
                                    <button disabled={sessionsPagination.page <= 1} onClick={() => setSessionsPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                    <button disabled={sessionsPagination.page >= sessionsPagination.totalPages} onClick={() => setSessionsPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: USAGE STATS --- */}
                {activeTab === 'usage' && (
                    <UsageStatsTab />
                )}

                {/* --- TAB CONTENT: REVIEWS & FEEDBACK --- */}
                {activeTab === 'reviews' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* KPI Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Avg Rating Card */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Rating</span>
                                        <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500 rounded-lg">
                                            <Star className="fill-yellow-500 text-yellow-500" size={20} />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{reviewsStats.averageRating}</span>
                                        <span className="text-slate-400 text-sm">/ 5.0</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        {renderStars(Math.round(reviewsStats.averageRating))}
                                        <span className="text-xs text-slate-500 dark:text-slate-400">({reviewsStats.totalReviews} reviews)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stars Progress Breakdown */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2 flex flex-col justify-center gap-2.5">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rating Distribution</span>
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = reviewsStats.starBreakdown[star as 1|2|3|4|5] || 0;
                                    const percent = reviewsStats.totalReviews > 0 ? (count / reviewsStats.totalReviews) * 100 : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-3 text-xs">
                                            <span className="font-semibold w-12 flex items-center gap-1 text-slate-650 dark:text-slate-350">{star} <Star size={10} className="fill-yellow-500 text-yellow-500" /></span>
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <span className="font-mono text-slate-500 dark:text-slate-400 w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-205 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Feedback Type</label>
                                <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500 text-slate-750 dark:text-slate-300" value={reviewsFilter.type} onChange={e => setReviewsFilter(p => ({ ...p, type: e.target.value }))}>
                                    <option value="all">All Feedback ({reviewsStats.reviewsCount + reviewsStats.contactsCount})</option>
                                    <option value="review">Portfolio Reviews ({reviewsStats.reviewsCount})</option>
                                    <option value="contact">Contact Inquiries ({reviewsStats.contactsCount})</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Stars Rating</label>
                                <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500 text-slate-750 dark:text-slate-300" value={reviewsFilter.stars} onChange={e => setReviewsFilter(p => ({ ...p, stars: e.target.value }))}>
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Filter By User</label>
                                <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500 text-slate-750 dark:text-slate-300" value={reviewsFilter.userEmail} onChange={e => setReviewsFilter(p => ({ ...p, userEmail: e.target.value }))}>
                                    <option value="all">All Users</option>
                                    {uniqueUsers.map(u => (
                                        <option key={u.email} value={u.email}>
                                            {u.name || u.email} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Search Sender</label>
                                <input type="text" placeholder="Name or Email..." className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500 text-slate-750 dark:text-slate-300" value={reviewsFilter.search} onChange={e => setReviewsFilter(p => ({ ...p, search: e.target.value }))} />
                            </div>
                            <div className="flex flex-col justify-end gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                                    <input type="checkbox" checked={groupByUser} onChange={e => setGroupByUser(e.target.checked)} className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                    Group by User
                                </label>
                                <button onClick={() => { setReviewsPagination(p => ({ ...p, page: 1 })); fetchReviews(); }} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Search & Filter</button>
                            </div>
                        </div>

                        {/* Reviews Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Sender</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Rating</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Message</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {reviewsLoading ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading feedback entries...</td></tr>
                                        ) : reviews.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No feedback matching current filters.</td></tr>
                                        ) : groupByUser ? (
                                            groupedReviews?.map((group) => (
                                                <React.Fragment key={group.email}>
                                                    {/* User Header Row */}
                                                    <tr className="bg-slate-105/85 dark:bg-slate-800/85 font-bold text-slate-800 dark:text-slate-200 border-y border-slate-200 dark:border-slate-800">
                                                        <td colSpan={6} className="px-6 py-3">
                                                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                                                <span>{group.name} ({group.email}) {group.phone ? `| ${group.phone}` : ''}</span>
                                                                <span className="text-[10px] bg-blue-105 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                                                                    {group.reviews.length} entries
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* Reviews for this User */}
                                                    {group.reviews.map((rev) => {
                                                        const isProjectReview = rev.feedback?.startsWith('[Project Review]');
                                                        const cleanMessage = rev.feedback ? rev.feedback.replace(/^\[(Project Review|Contact)\]\s*/, '') : '';
                                                        return (
                                                            <tr key={rev.review_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-6 py-4 text-xs font-mono text-slate-500 pl-10">
                                                                    {new Date(rev.created_at).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-slate-400 text-xs italic">— Grouped User Review</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isProjectReview 
                                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                                                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'}`}>
                                                                        {isProjectReview ? 'Review' : 'Contact'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {renderStars(rev.stars)}
                                                                </td>
                                                                <td className="px-6 py-4 max-w-[200px] truncate" title={cleanMessage}>
                                                                    {cleanMessage}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            onClick={() => setSelectedReview(rev)}
                                                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-600 transition-colors"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        {user?.role !== 'view_only_admin' && (
                                                                            <button
                                                                                onClick={async (e) => {
                                                                                    e.stopPropagation();
                                                                                    setDeleteReviewConfirm({ show: true, reviewId: rev.review_id });
                                                                                }}
                                                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                                                                title="Delete Review"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            reviews.map((rev) => {
                                                const isProjectReview = rev.feedback?.startsWith('[Project Review]');
                                                const cleanMessage = rev.feedback ? rev.feedback.replace(/^\[(Project Review|Contact)\]\s*/, '') : '';

                                                return (
                                                    <tr key={rev.review_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                            {new Date(rev.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-white">{rev.name}</span>
                                                                <span className="text-xs text-slate-550 dark:text-slate-400 font-mono">{rev.email}</span>
                                                                {rev.phone && <span className="text-xs text-slate-400">{rev.phone}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isProjectReview 
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'}`}>
                                                                {isProjectReview ? 'Review' : 'Contact'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {renderStars(rev.stars)}
                                                        </td>
                                                        <td className="px-6 py-4 max-w-[200px] truncate" title={cleanMessage}>
                                                            {cleanMessage}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => setSelectedReview(rev)}
                                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-600 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                {user?.role !== 'view_only_admin' && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteReviewConfirm({ show: true, reviewId: rev.review_id });
                                                                        }}
                                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                                                        title="Delete Review"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Page {reviewsPagination.page} of {reviewsPagination.totalPages} ({reviewsPagination.total} total)</p>
                                <div className="flex gap-2">
                                    <button disabled={reviewsPagination.page <= 1} onClick={() => setReviewsPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                    <button disabled={reviewsPagination.page >= reviewsPagination.totalPages} onClick={() => setReviewsPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: AI & OUTREACH LOGS --- */}
                {activeTab === 'ai_usage' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Token usage Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Total Tokens Card */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tokens</span>
                                    <Zap className="text-yellow-500" size={16} />
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {usageStats.aggregates.totalTokens.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Prompt: {usageStats.aggregates.promptTokens.toLocaleString()} | Resp: {usageStats.aggregates.completionTokens.toLocaleString()}</p>
                            </div>

                            {/* Total Requests Card */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Calls</span>
                                    <BarChart3 className="text-indigo-500" size={16} />
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {usageStats.aggregates.totalRequests}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Chatbot & Auto-replies</p>
                            </div>

                            {/* Providers Split Card */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2 flex flex-col justify-center gap-1.5">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Provider Splits</span>
                                {usageStats.providers.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">No usage recorded yet</span>
                                ) : (
                                    usageStats.providers.map(row => (
                                        <div key={row.provider} className="flex justify-between items-center text-xs">
                                            <span className="capitalize font-bold text-slate-700 dark:text-slate-355 flex items-center gap-1">
                                                <Sparkles size={12} className={row.provider === 'gemini' ? 'text-blue-500' : 'text-cyan-500'} />
                                                {row.provider}
                                            </span>
                                            <span className="font-mono text-slate-500">{row.tokens.toLocaleString()} tokens ({row.requests} reqs)</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Provider</label>
                                <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={aiFilter.provider} onChange={e => setAiFilter(p => ({ ...p, provider: e.target.value }))}>
                                    <option value="all">All Providers</option>
                                    <option value="gemini">Gemini</option>
                                    <option value="deepseek">Deepseek</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Task Type</label>
                                <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={aiFilter.actionType} onChange={e => setAiFilter(p => ({ ...p, actionType: e.target.value }))}>
                                    <option value="all">All Actions</option>
                                    <option value="chat">Chatbot Widget</option>
                                    <option value="email_reply">Auto-email Reply</option>
                                    <option value="outreach_draft">Outreach Draft Generation</option>
                                    <option value="system_task">System tasks</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Search User</label>
                                <input type="text" placeholder="Name or Email..." className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500" value={aiFilter.search} onChange={e => setAiFilter(p => ({ ...p, search: e.target.value }))} />
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => { setAiPagination(p => ({ ...p, page: 1 })); fetchUsageStats(); }} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Search Logs</button>
                            </div>
                        </div>

                        {/* AI Logs Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-500" /> AI Call logs
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Time</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">User</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Task Type</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Provider</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Tokens Used</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {usageLoading ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading AI usage logs...</td></tr>
                                        ) : aiLogs.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No logs found matching criteria.</td></tr>
                                        ) : (
                                            aiLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white">{log.user_name || 'Guest'}</span>
                                                            <span className="text-xs text-slate-500 font-mono">{log.user_email || 'unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                                            log.action_type === 'chat' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' :
                                                            log.action_type === 'email_reply' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' :
                                                            'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {log.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium capitalize text-slate-650 dark:text-slate-350">
                                                        {log.provider}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {log.total_tokens.toLocaleString()} <span className="text-xs font-normal text-slate-400">(P: {log.prompt_tokens} | R: {log.completion_tokens})</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* AI Logs Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Page {aiPagination.page} of {aiPagination.totalPages} ({aiPagination.total} total)</p>
                                <div className="flex gap-2">
                                    <button disabled={aiPagination.page <= 1} onClick={() => setAiPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                    <button disabled={aiPagination.page >= aiPagination.totalPages} onClick={() => setAiPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Outreach Email Open Rates Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Send size={16} className="text-blue-500" /> Outreach & Email Tracking
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Company & Role</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Emails Sent</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Email Opens</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Open Rate</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Last Open Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {usageLoading ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading outreach metrics...</td></tr>
                                        ) : outreachLogs.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No outreach campaigns created yet.</td></tr>
                                        ) : (
                                            outreachLogs.map((out) => {
                                                const openRate = out.email_sent_count > 0 ? (out.email_opens / out.email_sent_count) * 100 : 0;
                                                return (
                                                    <tr key={out.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-white">{out.company_name}</span>
                                                                <span className="text-xs text-slate-500">{out.role}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                                                out.status === 'Replied' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                                out.status === 'Sent' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                                                                out.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                                                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                                {out.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                            {out.email_sent_count}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                            {out.email_opens}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${openRate}%` }}></div>
                                                                </div>
                                                                <span className="font-mono text-xs font-bold">{openRate.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                            {out.last_opened_at ? new Date(out.last_opened_at).toLocaleString() : 'Never'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Outreach Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Page {outreachPagination.page} of {outreachPagination.totalPages} ({outreachPagination.total} total)</p>
                                <div className="flex gap-2">
                                    <button disabled={outreachPagination.page <= 1} onClick={() => setOutreachPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                    <button disabled={outreachPagination.page >= outreachPagination.totalPages} onClick={() => setOutreachPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODALS & CONFIRMATIONS --- */}

                {/* Audit log details modal */}
                {selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Session Timeline
                                        <span className="text-xs font-mono font-normal bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                            {selectedSession.session_id.slice(0, 8)}...
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-500">{new Date(selectedSession.started_at).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                {/* Metadata Summary */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-500 text-xs uppercase mb-1">User</p>
                                        <p className="font-medium">{selectedSession.user_identity?.name || 'Guest'}</p>
                                        <p className="text-slate-550 text-xs">{selectedSession.user_identity?.email}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-500 text-xs uppercase mb-1">Device</p>
                                        <p className="font-medium truncate">
                                            {selectedSession.browser_name ? (
                                                <>{selectedSession.browser_name} on {selectedSession.operating_system}</>
                                            ) : (
                                                selectedSession.device_info?.userAgent || 'Unknown'
                                            )}
                                        </p>
                                        <p className="text-slate-500 text-xs">
                                            {selectedSession.device_type && <span className="uppercase mr-1">{selectedSession.device_type} •</span>}
                                            {selectedSession.device_info?.screen}
                                        </p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="p-6">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Activity Log</h4>
                                    <div className="relative border-l-2 border-slate-200 dark:border-slate-850 ml-2 space-y-6">
                                        {selectedSession.visit_history?.map((visit, idx) => (
                                            <div key={idx} className="ml-6 relative animate-in slide-in-from-left duration-200">
                                                {/* Dot */}
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 ring-1 ring-slate-200 dark:ring-slate-800"></div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{visit.path}</p>
                                                    <span className="text-xs text-slate-400 font-mono">
                                                        {new Date(visit.timestamp).toLocaleTimeString()}
                                                        {idx > 0 && selectedSession.visit_history[idx - 1] && (
                                                            <span className="text-slate-400 dark:text-slate-500 ml-2">
                                                                (+{Math.round((new Date(visit.timestamp).getTime() - new Date(selectedSession.visit_history[idx - 1].timestamp).getTime()) / 1000)}s)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedSession.visit_history?.length === 0 && (
                                            <p className="ml-6 text-sm text-slate-450 italic">No page visits recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}                {/* Review Details Modal */}
                {selectedReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 relative">
                            <button onClick={() => setSelectedReview(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800">
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="text-blue-500" />
                                {selectedReview.feedback?.startsWith('[Project Review]') ? 'Portfolio Feedback' : 'Contact Message'}
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-2 text-sm border border-slate-100 dark:border-slate-800/50">
                                    <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-455">
                                        <span>Sender:</span>
                                        <span className="col-span-2 text-slate-855 dark:text-slate-200">{selectedReview.name}</span>
                                    </div>
                                    <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-455">
                                        <span>Email:</span>
                                        <span className="col-span-2 text-slate-855 dark:text-slate-200 font-mono">{selectedReview.email}</span>
                                    </div>
                                    {selectedReview.phone && (
                                        <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-455">
                                            <span>Phone:</span>
                                            <span className="col-span-2 text-slate-855 dark:text-slate-200">{selectedReview.phone}</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-455">
                                        <span>Rating:</span>
                                        <span className="col-span-2 flex items-center gap-1.5">{renderStars(selectedReview.stars)} <span className="text-xs font-bold">({selectedReview.stars} / 5)</span></span>
                                    </div>
                                    <div className="grid grid-cols-3 font-semibold text-slate-500 dark:text-slate-455">
                                        <span>Received:</span>
                                        <span className="col-span-2 text-slate-855 dark:text-slate-200">{new Date(selectedReview.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Content</span>
                                    <p className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm leading-relaxed whitespace-pre-wrap select-text max-h-[200px] overflow-y-auto">
                                        {selectedReview.feedback ? selectedReview.feedback.replace(/^\[(Project Review|Contact)\]\s*/, '') : ''}
                                    </p>
                                </div>

                                {/* Collapsible Email Reply Form */}
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <details className="group" open>
                                        <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-350 select-none list-none">
                                            <span className="flex items-center gap-2">
                                                <Mail size={16} className="text-blue-500" />
                                                Reply via Email
                                            </span>
                                            <span className="transition group-open:rotate-180">
                                                <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" className="w-4 h-4 text-slate-500">
                                                    <path d="M6 9l6 6 6-6"></path>
                                                </svg>
                                            </span>
                                        </summary>
                                        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                                            {/* Subject Line */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 uppercase">Subject</label>
                                                <input
                                                    type="text"
                                                    value={replySubject}
                                                    onChange={e => setReplySubject(e.target.value)}
                                                    placeholder="Email subject..."
                                                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 text-sm outline-none focus:border-blue-500 text-slate-850 dark:text-slate-200"
                                                />
                                            </div>
                                            
                                            {/* Message Body */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-550 uppercase flex justify-between items-center">
                                                    <span>Message Body</span>
                                                    <button
                                                        type="button"
                                                        disabled={isDrafting}
                                                        onClick={async () => {
                                                            setIsDrafting(true);
                                                            try {
                                                                const res = await fetch('/api/admin/reviews/draft', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        name: selectedReview.name,
                                                                        feedback: selectedReview.feedback,
                                                                        type: selectedReview.feedback?.startsWith('[Project Review]') ? 'review' : 'contact'
                                                                    })
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok && data.success) {
                                                                    setReplySubject(data.subject);
                                                                    setReplyMessage(data.body);
                                                                    addToast("Draft generated with Gemini!", "success");
                                                                } else {
                                                                    addToast(data.error || "Failed to generate draft", "error");
                                                                }
                                                            } catch (err) {
                                                                addToast("Error generating draft", "error");
                                                            } finally {
                                                                setIsDrafting(false);
                                                            }
                                                        }}
                                                        className="text-blue-600 dark:text-blue-450 hover:underline flex items-center gap-1 disabled:opacity-50 text-xs font-bold font-sans"
                                                    >
                                                        <Sparkles size={12} className={isDrafting ? "animate-pulse" : ""} />
                                                        {isDrafting ? "Drafting..." : "Draft with AI"}
                                                    </button>
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={replyMessage}
                                                    onChange={e => setReplyMessage(e.target.value)}
                                                    placeholder="Write your response here..."
                                                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 text-sm outline-none focus:border-blue-500 text-slate-850 dark:text-slate-200 leading-relaxed"
                                                />
                                            </div>

                                            {/* Send Button */}
                                            <button
                                                type="button"
                                                disabled={isSending || !replySubject || !replyMessage}
                                                onClick={async () => {
                                                    setIsSending(true);
                                                    try {
                                                        const res = await fetch('/api/admin/reviews/reply', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                email: selectedReview.email,
                                                                subject: replySubject,
                                                                message: replyMessage
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok && data.success) {
                                                            addToast("Reply email sent successfully!", "success");
                                                            setSelectedReview(null); // Close modal on success
                                                        } else {
                                                            addToast(data.error || "Failed to send email", "error");
                                                        }
                                                    } catch (err) {
                                                        addToast("Error sending reply email", "error");
                                                    } finally {
                                                        setIsSending(false);
                                                    }
                                                }}
                                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl font-semibold shadow-md transition-colors text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                                            >
                                                {isSending ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={14} />
                                                        Send Reply
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Delete Session Log modal */}
                {deleteSessionConfirm.show && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="bg-red-100 dark:bg-red-950/30 p-3 rounded-full text-red-600 dark:text-red-500">
                                    <AlertTriangle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Session Log?</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        This action cannot be undone. The session history will be permanently removed.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeleteSessionConfirm({ show: false, sessionId: null })}
                                        className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!deleteSessionConfirm.sessionId) return;
                                            const sid = deleteSessionConfirm.sessionId;
                                            setDeleteSessionConfirm({ show: false, sessionId: null });

                                            try {
                                                const res = await fetch(`/api/admin/audit/logs?id=${sid}`, { method: 'DELETE' });
                                                if (res.ok) {
                                                    addToast("Session log deleted", "success");
                                                    setSessions(prev => prev.filter(s => s.session_id !== sid));
                                                } else {
                                                    addToast("Failed to delete session log", "error");
                                                }
                                            } catch (err) {
                                                addToast("Error deleting session log", "error");
                                            }
                                        }}
                                        className="flex-1 py-2 px-4 bg-red-650 text-white rounded-xl font-semibold hover:bg-red-700 shadow-md transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Delete modal */}
                {deleteReviewConfirm.show && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="bg-red-105 dark:bg-red-950/30 p-3 rounded-full text-red-600 dark:text-red-500">
                                    <AlertTriangle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Feedback Record?</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        This review or message will be permanently deleted from the database.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeleteReviewConfirm({ show: false, reviewId: null })}
                                        className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!deleteReviewConfirm.reviewId) return;
                                            const rid = deleteReviewConfirm.reviewId;
                                            setDeleteReviewConfirm({ show: false, reviewId: null });

                                            try {
                                                const res = await fetch(`/api/admin/reviews?id=${rid}`, { method: 'DELETE' });
                                                const data = await res.json();
                                                if (res.ok && data.success) {
                                                    addToast("Feedback deleted successfully", "success");
                                                    setReviews(prev => prev.filter(r => r.review_id !== rid));
                                                    fetchReviews(); // Re-fetch to update rating stats
                                                } else {
                                                    addToast(data.error || "Failed to delete feedback", "error");
                                                }
                                            } catch (err) {
                                                addToast("Error deleting feedback", "error");
                                            }
                                        }}
                                        className="flex-1 py-2 px-4 bg-red-650 text-white rounded-xl font-semibold hover:bg-red-700 shadow-md transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Options for Audit Logs Export */}
                {showReportOptions && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select Report Type</h3>
                                <button onClick={() => setShowReportOptions(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-full text-slate-550"><X size={20} /></button>
                            </div>

                            <div className="space-y-3">
                                <button onClick={() => handleExport('summary')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-105 dark:bg-blue-950 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-650 dark:group-hover:text-blue-400">Summary Report</h4>
                                            <p className="text-xs text-slate-500">Concise overview. Counts only, no full path lists.</p>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => handleExport('detailed')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 dark:bg-purple-950 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                                            <Database size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-605 dark:group-hover:text-purple-400">Detailed Report</h4>
                                            <p className="text-xs text-slate-500">Full audit trail. Includes every unique page visited.</p>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => handleExport('ip')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 dark:bg-orange-950 p-2 rounded-lg text-orange-655 dark:text-orange-400">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-655 dark:group-hover:text-orange-400">IP Deep Dive</h4>
                                            <p className="text-xs text-slate-500">Aggregated stats for the selected IP (Input required).</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
