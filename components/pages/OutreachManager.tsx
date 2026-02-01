"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import { Plus, Send, RefreshCw, Mail, Eye, Trash2, CheckCircle, Clock, X, Search, Zap, FileText, Layout } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import axios from "axios";

// Interface for Application
interface Application {
    id: string;
    company_name: string;
    role: string;
    job_description?: string;
    user_context?: string; // NEW
    contact_name?: string;
    contact_role?: string;
    contact_email: string;
    status: 'Pending' | 'Sent' | 'Replied' | 'Rejected';
    email_sent_count: number;
    email_opens: number;
    last_opened_at?: string;
    is_referral?: boolean;
    created_at: string;
}

export default function OutreachManager() {
    const { isAuthenticated, isLoading: authLoading, data } = usePortfolio();
    const router = useRouter();
    const { addToast } = useToast();

    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Draft / Send State
    const [drafting, setDrafting] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [currentDraft, setCurrentDraft] = useState({
        subject: '',
        body: '',
        appId: '',
        attachResume: true
    });

    // Preview Tab State
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

    // Add Lead Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLead, setNewLead] = useState({
        id: '', company_name: '', role: '', job_description: '', contact_name: '', contact_role: '', contact_email: '', is_referral: false, user_context: ''
    });

    // Fetch Data
    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/outreach/leads');
            if (res.data.success) {
                setApps(res.data.applications);
            }
        } catch (error) {
            addToast("Failed to load leads", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/admin");
        else if (isAuthenticated) fetchApps();
    }, [isAuthenticated, authLoading, router, fetchApps]);

    // Handle Add / Edit Lead
    const handleSaveLead = async () => {
        try {
            if (newLead.id) {
                await axios.put('/api/admin/outreach/leads', newLead);
                addToast("Lead updated successfully", "success");
            } else {
                await axios.post('/api/admin/outreach/leads', newLead);
                addToast("Lead added successfully", "success");
            }
            setShowAddModal(false);
            setNewLead({ id: '', company_name: '', role: '', job_description: '', contact_name: '', contact_role: '', contact_email: '', is_referral: false, user_context: '' });
            fetchApps();
        } catch (e) {
            addToast("Failed to save lead", "error");
        }
    };

    const handleEditClick = (app: Application) => {
        setNewLead({
            id: app.id,
            company_name: app.company_name,
            role: app.role,
            job_description: app.job_description || '',
            contact_name: app.contact_name || '',
            contact_role: app.contact_role || '',
            contact_email: app.contact_email,
            is_referral: app.is_referral || false,
            user_context: app.user_context || ''
        });
        setShowAddModal(true);
    }

    // Handle Checkbox
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // Handle Generate Draft (Single Click)
    const handleGenerateDraft = async (appId: string) => {
        setDrafting(appId);
        try {
            // Check if app exists
            const app = apps.find(a => a.id === appId);
            if (!app) return;

            // Determine type based on status
            const type = app.status === 'Pending' ? 'initial' : 'follow-up';
            const res = await axios.post('/api/admin/outreach/draft', { applicationId: appId, type });

            if (res.data.success) {
                setCurrentDraft({
                    subject: res.data.draft.subject,
                    body: res.data.draft.body,
                    appId: appId,
                    attachResume: true
                });
                setReviewModalOpen(true);
                setActiveTab('preview'); // Open in preview mode by default
            }
        } catch (error) {
            console.error(error);
            addToast("Draft generation failed", "error");
        } finally {
            setDrafting(null);
        }
    };

    // Handle Send Real Email (From Modal)
    const handleSendEmail = async () => {
        setSending(true);
        try {
            const res = await axios.post('/api/admin/outreach/email', {
                applicationId: currentDraft.appId,
                subject: currentDraft.subject,
                body: currentDraft.body,
                attachResume: currentDraft.attachResume
            });

            if (res.data.success) {
                addToast("Email sent successfully!", "success");
                setReviewModalOpen(false);
                fetchApps();
            }
        } catch (error) {
            addToast("Failed to send email", "error");
        } finally {
            setSending(false);
        }
    };

    const generatePreviewHtml = () => {
        const myProfile = data?.profile || { name: 'Mohammed Jumaan', roles: ['Full Stack Engineer'], email: 'hello@jumaan.me', linkedin: '', github: '', phone: '' };
        const websiteLink = 'https://jumaan.me';

        // Postcards/Huddleup Style Template (Adapted)
        return `
            <div style="background-color: #b49dd7; padding: 20px; font-family: 'Inter', sans-serif;">
                 <!-- Spacer -->
                <div style="height: 20px;"></div>

                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="padding: 40px 40px 20px 40px; background-color: #321a59; text-align: center;">
                        <h1 style="margin: 0; font-family: 'Poppins', sans-serif; font-size: 32px; font-weight: 700; color: #ffffff;">${myProfile.name}</h1>
                        <p style="margin: 5px 0 0; font-family: 'Inter', sans-serif; font-size: 16px; color: #b49dd7; font-weight: 500;">${Array.isArray(myProfile.roles) ? myProfile.roles[0] : 'Full Stack Engineer'}</p>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px; background-color: #ffffff;">
                        <div style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; color: #565558;">
                            ${currentDraft.body}
                        </div>

                        <!-- Portfolio CTA -->
                        <div style="margin-top: 25px; text-align: center;">
                            <a href="${websiteLink}" style="background-color: #321a59; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View My Portfolio</a>
                        </div>

                         ${currentDraft.attachResume ? `
                            <div style="margin-top: 30px; padding: 15px; background-color: #f3f0f9; border-left: 4px solid #321a59; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #321a59; font-weight: 600;">📎 Resume attached.</p>
                            </div>` : ''}
                    </div>

                    <!-- Footer -->
                    <div style="padding: 0 40px 40px 40px; background-color: #ffffff;">
                        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
                            <a href="#" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">Portfolio</a>
                            <a href="#" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">LinkedIn</a>
                            <a href="#" style="display:inline-block; margin: 0 10px; text-decoration: none; color: #321a59; font-weight: 600; font-size: 14px;">GitHub</a>
                        </div>
                    </div>
                </div>
                
                 <!-- Bottom Sig -->
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #321a59; opacity: 0.8;">
                     &copy; ${new Date().getFullYear()} ${myProfile.name}
                </div>
            </div>
        `;
    };

    if (authLoading) return <div className="p-10 text-center">Loading...</div>;

    // Filter for "Recent Opens" (The Live Feed Logic)
    const recentOpens = apps.filter(a => a.last_opened_at).sort((a, b) => new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime()).slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Send className="text-blue-600" /> Outreach Hub
                    </h2>
                    <p className="text-slate-500">Manage job applications and track recruiter engagement.</p>
                </div>
                <button
                    onClick={() => {
                        setNewLead({ id: '', company_name: '', role: '', job_description: '', contact_name: '', contact_role: '', contact_email: '', is_referral: false, user_context: '' });
                        setShowAddModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={20} /> Add Lead
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h2 className="font-bold text-lg dark:text-white">Active Leads ({apps.length})</h2>
                        <button onClick={fetchApps} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><RefreshCw size={18} /></button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input type="checkbox" onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(new Set(apps.map(a => a.id)));
                                            else setSelectedIds(new Set());
                                        }} />
                                    </th>
                                    <th className="p-4 font-semibold dark:text-slate-300">Company & Role</th>
                                    <th className="p-4 font-semibold dark:text-slate-300">Status</th>
                                    <th className="p-4 font-semibold dark:text-slate-300">Engagement</th>
                                    <th className="p-4 font-semibold dark:text-slate-300 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {apps.map(app => (
                                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(app.id)}
                                                onChange={() => toggleSelect(app.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{app.company_name}</div>
                                            <div className="text-xs text-slate-500">{app.role}</div>
                                            <div className="text-xs text-blue-500 mt-1">
                                                {app.contact_name}
                                                {app.contact_role && <span className="text-slate-400"> • {app.contact_role}</span>}
                                                {app.is_referral && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Referral</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium 
                                                ${app.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                                    app.status === 'Replied' ? 'bg-green-100 text-green-700' :
                                                        'bg-slate-100 text-slate-600'}`}>
                                                {app.status}
                                            </span>
                                            {app.email_sent_count > 0 && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {app.email_sent_count} emails sent
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Eye size={14} className={app.email_opens > 0 ? "text-green-500" : "text-slate-300"} />
                                                <span className="font-medium">{app.email_opens} Opens</span>
                                            </div>
                                            {app.last_opened_at && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Last: {new Date(app.last_opened_at).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditClick(app)} className="text-slate-400 hover:text-blue-600 p-2" title="Edit Lead">
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateDraft(app.id)}
                                                    disabled={drafting === app.id}
                                                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all hover:shadow-sm"
                                                >
                                                    {drafting === app.id ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                                    {app.status === 'Pending' ? 'Draft Email' : 'Follow Up'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Live Feed Widget */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Eye size={100} />
                        </div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Feed
                        </h3>
                        <div className="space-y-4">
                            {recentOpens.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">No recent activity detected.</p>
                            ) : (
                                recentOpens.map(log => (
                                    <div key={log.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-right-4">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 shrink-0">
                                            <Eye size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium dark:text-slate-200">
                                                <span className="font-bold text-slate-900 dark:text-white">{log.company_name}</span> has opened your email.
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(log.last_opened_at!).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl text-blue-800 dark:text-blue-300 text-sm border border-blue-100 dark:border-blue-900/50">
                        <strong>⚡ Pro Tip:</strong>
                        <p className="mt-1 opacity-90">Click &quot;Draft Email&quot; to review the AI-generated message before sending. The AI will personalize it based on your Resume & their Job Description.</p>
                    </div>
                </div>
            </div>

            {/* Add Lead Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold dark:text-white">{newLead.id ? 'Edit Lead' : 'Add New Lead'}</h3>
                            <input className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="Company Name" value={newLead.company_name} onChange={e => setNewLead({ ...newLead, company_name: e.target.value })} />
                            <input className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="Job Role" value={newLead.role} onChange={e => setNewLead({ ...newLead, role: e.target.value })} />
                            <textarea className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 h-24" placeholder="Job Description (Paste here for AI)" value={newLead.job_description} onChange={e => setNewLead({ ...newLead, job_description: e.target.value })} />

                            <textarea
                                className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 h-20 text-sm"
                                placeholder="Custom AI Instructions (e.g. 'Mention I met them at X event' or 'Focus on React')"
                                value={newLead.user_context}
                                onChange={e => setNewLead({ ...newLead, user_context: e.target.value })}
                            />

                            <input className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="Contact Name (Recruiter)" value={newLead.contact_name} onChange={e => setNewLead({ ...newLead, contact_name: e.target.value })} />
                            <input className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="Contact Role (e.g. HR Manager)" value={newLead.contact_role} onChange={e => setNewLead({ ...newLead, contact_role: e.target.value })} />
                            <input className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="Contact Email" value={newLead.contact_email} onChange={e => setNewLead({ ...newLead, contact_email: e.target.value })} />

                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isReferral"
                                    checked={newLead.is_referral}
                                    onChange={e => setNewLead({ ...newLead, is_referral: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isReferral" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    Is this a Referral Request? (Asking for a referral/intro)
                                </label>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">Cancel</button>
                                <button onClick={handleSaveLead} className="flex-1 p-2 bg-blue-600 text-white rounded-lg">Save Lead</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Review & Send Modal (NEW with Tabs) */}
            {
                reviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                        <Send size={20} className="text-blue-500" /> Review Email
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Review your AI draft before sending.</p>
                                </div>
                                <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 mx-6 mt-4 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('write')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'write' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <FileText size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Layout size={16} /> Preview (Rendered)
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1 h-[500px]">
                                {activeTab === 'write' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Subject Line</label>
                                            <input
                                                className="w-full p-3 font-medium border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={currentDraft.subject}
                                                onChange={e => setCurrentDraft({ ...currentDraft, subject: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs font-bold uppercase text-slate-500 block">Email Body (HTML Supported)</label>
                                                <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab('preview')}>Preview &rarr;</span>
                                            </div>
                                            <textarea
                                                className="w-full p-3 border rounded-lg h-80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                value={currentDraft.body}
                                                onChange={e => setCurrentDraft({ ...currentDraft, body: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                        {/* Inline Iframe-like simulation */}
                                        <div className="h-full overflow-y-auto bg-slate-100 p-2">
                                            <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="attachResume"
                                        checked={currentDraft.attachResume}
                                        onChange={e => setCurrentDraft({ ...currentDraft, attachResume: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="attachResume" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                        Attach Resume PDF
                                    </label>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <button onClick={() => setReviewModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={sending}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"
                                    >
                                        {sending ? <RefreshCw className="animate-spin" /> : <Send size={18} />}
                                        Send Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
