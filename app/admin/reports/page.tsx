"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldAlert, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface VisitEvent {
    path: string;
    timestamp: string;
}

interface SessionLog {
    session_id: string;
    ip_address: string;
    user_identity: { name?: string; email?: string; phone?: string };
    geo_info: { city?: string; country?: string; isp?: string };
    device_info: { browser?: string; os?: string; device?: string; userAgent?: string; screen?: string };
    visit_history: VisitEvent[];
    started_at: string;
    last_active_at: string;
    browser_name?: string;
    operating_system?: string;
    device_type?: string;
    country_name?: string;
    city_name?: string;
}

export default function ReportsPage() {
    const { isAuthenticated, isLoading: authLoading } = usePortfolio();
    const router = useRouter();
    const { addToast } = useToast();

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
        } else if (isAuthenticated) {
            fetchSessions();
        }
    }, [isAuthenticated, authLoading, pagination.page, router, fetchSessions]);

    const handleExport = async () => {
        setGeneratingReport(true);
        try {
            const res = await fetch('/api/admin/audit/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters })
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

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="text-blue-500" />
                            Session Audit
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Live tracking of user journeys and sessions.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
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
        </div>
    );
}
