"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import { Calendar, Search, FileText, Download, ChevronLeft, ChevronRight, Filter, ShieldAlert, Eye, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AuditLog {
    id: string;
    request_id: string;
    created_at: string;
    session_id: string; // ip
    http_method: string;
    request_uri: string;
    user_agent: string;
    country_code: string;
    country_name: string;
    region_name: string;
    city_name: string;
    timezone: string;
    isp_name: string;
    browser_name: string;
    operating_system: string;
    device_type: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
    [key: string]: any; // Catch-all for other cols
}

export default function ReportsPage() {
    const { isAuthenticated, isLoading: authLoading } = usePortfolio();
    const router = useRouter();
    const { addToast } = useToast();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(false);

    // Details Modal State
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        type: "",
        ip: ""
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    });

    const fetchLogs = useCallback(async () => {
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
                setLogs(data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            } else {
                addToast("Failed to load logs", "error");
            }
        } catch (error) {
            console.error("Fetch error", error);
            addToast("Error loading logs", "error");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters, addToast]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/admin");
        } else if (isAuthenticated) {
            fetchLogs();
        }
    }, [isAuthenticated, authLoading, pagination.page, router, fetchLogs]);


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

    if (authLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div></div>;
    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Simulation Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="text-blue-500" />
                            Audit Logs
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Track visitor activity and generate reports.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                                    <Download size={18} />
                                    Email PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem("portfolio_user_identity", JSON.stringify({ name: "Test Admin", email: "admin@test.com" }));
                                sessionStorage.removeItem("audit_seen_website_visit");
                                window.location.reload();
                            }}
                            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <ShieldAlert size={18} />
                            Simulate
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">From</label>
                        <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">To</label>
                        <input type="date" className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                        <select className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
                            <option value="">All Activity</option>
                            <option value="home">Home Visits</option>
                            <option value="blog">Blog Posts</option>
                            <option value="project">Project Views</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Search IP</label>
                        <input type="text" placeholder="IP..." className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm" value={filters.ip} onChange={e => setFilters(p => ({ ...p, ip: e.target.value }))} />
                    </div>
                    <div className="flex items-end">
                        <button onClick={fetchLogs} className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium">Apply Filters</button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Time</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Location</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">IP</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Path</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">User</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-10">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No logs found.</td></tr>
                                ) : (
                                    logs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                                                {log.city_name || 'Uk'}, {log.country_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{log.session_id}</td>
                                            <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-medium truncate max-w-xs" title={log.request_uri}>{log.request_uri}</td>
                                            <td className="px-6 py-4">
                                                {log.user_name ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-white">{log.user_name}</span>
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-blue-600"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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

                {/* Full Details Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Details</h3>
                                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Core Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Timestamp</p>
                                        <p className="text-sm font-mono">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Request ID</p>
                                        <p className="text-sm font-mono text-slate-600 truncate">{selectedLog.request_id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Path</p>
                                        <p className="text-sm font-medium text-blue-600">{selectedLog.request_uri}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Method</p>
                                        <p className="text-sm font-bold">{selectedLog.http_method || 'GET'}</p>
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-slate-800" />

                                {/* Location & Network */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">Network & Location</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">IP Address</p>
                                            <p className="text-sm font-mono">{selectedLog.session_id}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">ISP</p>
                                            <p className="text-sm font-medium">{selectedLog.isp_name || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Location</p>
                                            <p className="text-sm">{selectedLog.city_name}, {selectedLog.country_name}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Timezone</p>
                                            <p className="text-sm">{selectedLog.timezone || 'UTC'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User & Device */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">User & Device</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">User Identity</p>
                                            {selectedLog.user_name ? (
                                                <div className="mt-1">
                                                    <p className="font-semibold">{selectedLog.user_name}</p>
                                                    <p className="text-xs text-slate-500">{selectedLog.user_email}</p>
                                                    {selectedLog.user_phone && <p className="text-xs text-slate-500">{selectedLog.user_phone}</p>}
                                                </div>
                                            ) : <p className="text-sm italic text-slate-400">Anonymous</p>}
                                        </div>
                                        <div className="col-span-2 md:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">System</p>
                                            <p className="text-sm">{selectedLog.operating_system} / {selectedLog.browser_name}</p>
                                            <p className="text-xs text-slate-400 mt-1">{selectedLog.device_type}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Full User Agent */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">User Agent String</p>
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                                        {selectedLog.user_agent}
                                    </code>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-right">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
