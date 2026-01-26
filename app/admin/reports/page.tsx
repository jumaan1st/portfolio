"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import { Database, HardDrive, FileText, FolderOpen, CheckCircle, AlertTriangle, RefreshCw, ShieldAlert, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
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

    // Helper to calc percentage
    const getPercent = (used: number, total: number) => Math.min(100, Math.max(0, (used / total) * 100));

    // Helper for color based on usage
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
                <button onClick={fetchStats} className="text-sm flex items-center gap-2 text-slate-500 hover:text-blue-600">
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
    const { isAuthenticated, isLoading: authLoading } = usePortfolio();
    const router = useRouter();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'audit' | 'usage'>('audit');

    // Audit Log State
    const [sessions, setSessions] = useState<SessionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<SessionLog | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        ip: ""
    });

    const [pagination, setPagination] = useState({
        page: 1, limit: 20, total: 0, totalPages: 1
    });

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });

            const res = await fetch(`/api/admin/audit/logs?${query.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setSessions(data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            } else {
                addToast("Failed to load sessions", "error");
            }
        } catch (error) {
            console.error("Fetch error", error);
            addToast("Error loading sessions", "error");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters, addToast]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/admin");
        } else if (isAuthenticated && activeTab === 'audit') {
            fetchSessions();
        }
    }, [isAuthenticated, authLoading, pagination.page, router, fetchSessions, activeTab]);

    const [showReportOptions, setShowReportOptions] = useState(false);

    const handleExport = async (type: 'summary' | 'detailed' | 'ip' = 'detailed') => {
        // If IP type selected but no IP filter, warn user
        if (type === 'ip' && !filters.ip) {
            addToast("Please enter an IP address in filters first", "error");
            return;
        }

        setGeneratingReport(true);
        setShowReportOptions(false); // Close modal
        try {
            const res = await fetch('/api/admin/audit/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters, type })
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

    // ... (rest of code)

    // Modal Render Helper (Placed inside render)
    const ReportOptionsModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select Report Type</h3>
                    <button onClick={() => setShowReportOptions(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-3">
                    <button onClick={() => handleExport('summary')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Summary Report</h4>
                                <p className="text-xs text-slate-500">Concise overview. Counts only, no full path lists.</p>
                            </div>
                        </div>
                    </button>

                    <button onClick={() => handleExport('detailed')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">Detailed Report</h4>
                                <p className="text-xs text-slate-500">Full audit trail. Includes every unique page visited.</p>
                            </div>
                        </div>
                    </button>

                    <button onClick={() => handleExport('ip')} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">IP Deep Dive</h4>
                                <p className="text-xs text-slate-500">Aggregated stats for the selected IP (Input required).</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    // Calculate Duration
    const getDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div></div>;
    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="text-blue-500" />
                            System Reports
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Monitor system activity and resource usage.
                        </p>
                    </div>
                </div>

                {/* TABS HEADER */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`pb-3 px-1 font-medium text-sm transition-all ${activeTab === 'audit'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        User Audit Log
                    </button>
                    <button
                        onClick={() => setActiveTab('usage')}
                        className={`pb-3 px-1 font-medium text-sm transition-all ${activeTab === 'usage'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Resource Usage
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
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                            >
                                {generatingReport ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={18} className="mr-1" />
                                        Email PDF
                                    </>
                                )}
                            </button>
                            <button onClick={fetchSessions} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">From</label>
                                <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">To</label>
                                <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Search IP</label>
                                <input type="text" placeholder="IP..." className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.ip} onChange={e => setFilters(p => ({ ...p, ip: e.target.value }))} />
                            </div>
                            <div className="flex items-end">
                                <button onClick={fetchSessions} className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium">Apply Filters</button>
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
                                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-10">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading sessions...</td></tr>
                                        ) : sessions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No sessions recorded yet.</td></tr>
                                        ) : (
                                            sessions.map((log, i) => {
                                                const now = new Date().getTime();
                                                const lastActive = new Date(log.last_active_at).getTime();
                                                const isActive = (now - lastActive) < 30 * 60 * 1000; // 30 mins

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
                                                                <span className="text-xs text-slate-400">{log.geo_info?.isp}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${log.device_info?.trafficSource ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                {log.device_info?.trafficSource || 'Direct'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                        {isActive ? 'Active Now' : 'Offline'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(log.started_at).toLocaleTimeString()}
                                                                </span>
                                                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded w-fit">
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
                                                                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                                                    Latest: {log.visit_history?.[log.visit_history.length - 1]?.path}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => setSelectedSession(log)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-blue-600"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.totalPages}</p>
                                <div className="flex gap-2">
                                    <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronLeft size={18} /></button>
                                    <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Session Details Modal - The "Timeline" */}
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
                                        <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-0">
                                        {/* Metadata Summary */}
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold text-slate-500 text-xs uppercase mb-1">User</p>
                                                <p className="font-medium">{selectedSession.user_identity?.name || 'Guest'}</p>
                                                <p className="text-slate-500 text-xs">{selectedSession.user_identity?.email}</p>
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
                                            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-6">
                                                {selectedSession.visit_history?.map((visit, idx) => (
                                                    <div key={idx} className="ml-6 relative">
                                                        {/* Dot */}
                                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 ring-1 ring-slate-200 dark:ring-slate-800"></div>

                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                            <p className="font-medium text-slate-900 dark:text-white text-sm">{visit.path}</p>
                                                            <span className="text-xs text-slate-500 font-mono">
                                                                {new Date(visit.timestamp).toLocaleTimeString()}
                                                                {idx > 0 && selectedSession.visit_history[idx - 1] && (
                                                                    <span className="text-slate-400 ml-2">
                                                                        (+{Math.round((new Date(visit.timestamp).getTime() - new Date(selectedSession.visit_history[idx - 1].timestamp).getTime()) / 1000)}s)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {selectedSession.visit_history?.length === 0 && (
                                                    <p className="ml-6 text-sm text-slate-500 italic">No page visits recorded yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* --- TAB CONTENT: USAGE STATS --- */}
                {activeTab === 'usage' && (
                    <UsageStatsTab />
                )}

                {showReportOptions && <ReportOptionsModal />}
            </div>
        </div>
    );
}
