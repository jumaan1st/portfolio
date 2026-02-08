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

    // Delete Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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



    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await axios.delete(`/api/admin/outreach/leads?id=${deleteTargetId}`);
            addToast("Lead deleted", "success");
            fetchApps();
        } catch (e) {
            addToast("Failed to delete lead", "error");
        } finally {
            setShowDeleteConfirm(false);
            setDeleteTargetId(null);
        }
    };

    const handleMarkReplied = async (appId: string) => {
        const app = apps.find(a => a.id === appId);
        if (!app) return;

        const newStatus = app.status === 'Replied' ? (app.email_sent_count > 0 ? 'Sent' : 'Pending') : 'Replied';

        try {
            await axios.put('/api/admin/outreach/leads', { id: appId, status: newStatus });
            addToast(`Marked as ${newStatus}`, "success");
            fetchApps();
        } catch (e) {
            addToast("Failed to update status", "error");
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
        const cleanPhone = myProfile.phone ? myProfile.phone.replace(/[^0-9]/g, '') : '';
        const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi, I received your application and would like to chat.")}` : '#';

        return `
            <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <div style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">${myProfile.name}</h1>
                        <p style="margin: 8px 0 0; font-size: 15px; color: #6b7280; font-weight: 500;">${Array.isArray(myProfile.roles) ? myProfile.roles[0] : 'Full Stack Engineer'}</p>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px; background-color: #ffffff;">
                        <div style="font-size: 16px; line-height: 1.7; color: #374151;">
                            ${currentDraft.body.replace(/\n/g, '<br/>')}
                        </div>

                        <!-- Attachments Area -->
                         ${currentDraft.attachResume ? `
                            <div style="margin-top: 35px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
                                <div style="background: #eff6ff; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📄</div>
                                <div>
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Resume Attached</p>
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">PDF Document</p>
                                </div>
                            </div>` : ''}
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            &copy; ${new Date().getFullYear()} ${myProfile.name} • ${myProfile.email}
                        </p>
                    </div>
                </div>
            </div>
        `;
    };

    if (authLoading) return <div className="p-10 text-center">Loading...</div>;

    // Filter for "Recent Opens" (The Live Feed Logic)
    const recentOpens = apps.filter(a => a.last_opened_at).sort((a, b) => new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime()).slice(0, 5);

    return (
        <div className="h-full flex flex-col p-6 gap-6">
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

            {/* Main Content Area - Full Width */}
            <div className="flex-1 overflow-hidden relative">
                <div className="flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                        <h2 className="font-bold text-lg dark:text-white">Active Leads ({apps.length})</h2>
                        <button onClick={fetchApps} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><RefreshCw size={18} /></button>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm relative">
                        <div className="absolute inset-0 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
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
                                                    <button onClick={() => handleMarkReplied(app.id)} className={`p-2 transition-colors ${app.status === 'Replied' ? 'text-green-600 bg-green-50 rounded-full' : 'text-slate-400 hover:text-green-600'}`} title={app.status === 'Replied' ? "Unmark Replied" : "Mark as Replied"}>
                                                        <CheckCircle size={16} className={app.status === 'Replied' ? 'fill-green-100' : ''} />
                                                    </button>
                                                    <button onClick={() => handleDelete(app.id)} className="text-slate-400 hover:text-red-500 p-2" title="Delete Lead">
                                                        <Trash2 size={16} />
                                                    </button>
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
            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <Trash2 size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white">Delete Lead?</h3>
                                    <p className="text-slate-500 text-sm mt-1">This action cannot be undone. Are you sure you want to permanently delete this lead?</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
