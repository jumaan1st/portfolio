"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    Trash2, Plus, Save, X, Edit2, Loader2, MessageSquare, RefreshCw, Send,
    CheckCircle, Building, Search, ExternalLink, Calendar, ShieldAlert, ArrowLeft 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { useToast } from "@/components/ui/Toast";
import { FileUploader } from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";

const Input = ({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: (v: string) => void, type?: string }) => (
    <div className="w-full min-w-0">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{label}</label>
        <input type={type} className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
);

const SuccessModal = ({ isOpen, message, onClose }: { isOpen: boolean, message: string, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-2">
                    <CheckCircle size={40} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                    <p className="text-slate-505 font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export const AdminClientHubPage: React.FC = () => {
    const router = useRouter();
    const { addToast } = useToast();
    const { isAuthenticated, user, isLoading: authLoading } = usePortfolio();

    // Redirection for unauthorized users
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'view_only_admin'))) {
            router.push("/admin");
        }
    }, [isAuthenticated, authLoading, user, router]);

    // Portal states
    const [hubActiveTab, setHubActiveTab] = useState<'directory' | 'chats'>('directory');
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [chatSearch, setChatSearch] = useState("");

    // Modal Forms
    const [onboardForm, setOnboardForm] = useState<any | null>(null);
    const [editProjectForm, setEditProjectForm] = useState<any | null>(null);
    const [editingClientForm, setEditingClientForm] = useState<any | null>(null);

    // Chat States
    const [chatProjectId, setChatProjectId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [adminNewMessage, setAdminNewMessage] = useState("");

    // Loading states
    const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    // Client Deletion States
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
    const [showDeleteClientOtpModal, setShowDeleteClientOtpModal] = useState(false);
    const [deleteClientOtpCode, setDeleteClientOtpCode] = useState("");
    const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
    const [isDeletingClient, setIsDeletingClient] = useState(false);

    // Form Loading States
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [isUpdatingClient, setIsUpdatingClient] = useState(false);
    const [isUpdatingProject, setIsUpdatingProject] = useState(false);

    // Success Banner States
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handlers
    const fetchEnquiries = async () => {
        setIsLoadingEnquiries(true);
        try {
            const res = await fetch("/api/admin/enquiries");
            if (res.ok) {
                const data = await res.json();
                setEnquiries(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingEnquiries(false);
        }
    };

    const fetchClients = async (silent = false) => {
        if (!silent) setIsLoadingClients(true);
        try {
            const res = await fetch("/api/admin/clients");
            if (res.ok) {
                const data = await res.json();
                setClients(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setIsLoadingClients(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin')) {
            fetchEnquiries();
            fetchClients();
        }
    }, [isAuthenticated, user?.role]);

    // Mark messages read & load chat thread
    useEffect(() => {
        if (chatProjectId) {
            const proj = clients.flatMap(c => c.projects || []).find(p => p.id === chatProjectId);
            if (proj?.status === "Completed") {
                setChatMessages([]);
                return;
            }
            fetchChatMessages(chatProjectId);
        } else {
            setChatMessages([]);
        }
    }, [chatProjectId]);

    // Scroll to chat bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const fetchChatMessages = async (projId: string, silent = false) => {
        if (!silent) setIsLoadingChat(true);
        try {
            const res = await fetch(`/api/projects/messages?projectId=${projId}`);
            if (res.ok) {
                const data = await res.json();
                setChatMessages(data || []);
                // Silently refresh clients to clear unread badge counts locally
                fetchClients(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setIsLoadingChat(false);
        }
    };

    const handleSendAdminMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminNewMessage.trim() || !chatProjectId) return;

        try {
            const res = await fetch("/api/projects/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: chatProjectId,
                    message: adminNewMessage.trim()
                })
            });
            if (res.ok) {
                const newMsg = await res.json();
                setChatMessages(prev => [...prev, newMsg]);
                setAdminNewMessage("");
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to send message", "error");
            }
        } catch (err) {
            addToast("Failed to send message", "error");
        }
    };

    const handleDeleteEnquiry = async (id: number) => {
        if (!confirm("Are you sure you want to delete this enquiry?")) return;
        try {
            const res = await fetch(`/api/admin/enquiries?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                addToast("Enquiry deleted successfully", "success");
                fetchEnquiries();
            } else {
                addToast("Failed to delete enquiry", "error");
            }
        } catch (e) {
            addToast("Failed to delete enquiry", "error");
        }
    };

    const handleOnboardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onboardForm || isOnboarding) return;

        setIsOnboarding(true);
        try {
            const payload = {
                ...onboardForm,
                cost: Math.round(parseFloat(onboardForm.cost || "0") * 100)
            };
            const res = await fetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(`Client onboarded! Temp Password sent to email.`);
                setShowSuccessModal(true);
                setOnboardForm(null);
                fetchEnquiries();
                fetchClients();
            } else {
                addToast(data.error || "Onboarding failed", "error");
            }
        } catch (err) {
            addToast("Failed to onboard client", "error");
        } finally {
            setIsOnboarding(false);
        }
    };

    const handleEditClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClientForm || isUpdatingClient) return;

        if (user?.role === 'view_only_admin') {
            addToast("Permission denied: View-only admin", "error");
            return;
        }

        setIsUpdatingClient(true);
        try {
            const res = await fetch("/api/admin/clients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingClientForm)
            });
            const data = await res.json();
            if (res.ok) {
                addToast("Client profile updated successfully!", "success");
                setEditingClientForm(null);
                fetchClients();
            } else {
                addToast(data.error || "Profile update failed", "error");
            }
        } catch (err) {
            addToast("Failed to update client profile", "error");
        } finally {
            setIsUpdatingClient(false);
        }
    };

    const handleRequestDeleteClientOtp = async (clientId: string) => {
        if (user?.role !== 'admin') {
            addToast("Permission denied: Only the main administrator can delete clients", "error");
            return;
        }

        setIsSendingDeleteOtp(true);
        try {
            const res = await fetch("/api/admin/clients/delete-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (res.ok) {
                setDeletingClientId(clientId);
                setDeleteClientOtpCode("");
                setShowDeleteClientOtpModal(true);
                addToast("Verification OTP code sent to your email", "success");
            } else {
                addToast(data.error || "Failed to send verification code", "error");
            }
        } catch (err) {
            addToast("Failed to send verification code", "error");
        } finally {
            setIsSendingDeleteOtp(false);
        }
    };

    const handleVerifyDeleteClientOtpAndExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingClientId || !deleteClientOtpCode.trim()) return;

        if (user?.role !== 'admin') {
            addToast("Permission denied: Only the main administrator can delete clients", "error");
            return;
        }

        setIsDeletingClient(true);
        try {
            const res = await fetch(`/api/admin/clients?id=${deletingClientId}&otp=${deleteClientOtpCode.trim()}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok) {
                addToast("Client and related data deleted successfully!", "success");
                setShowDeleteClientOtpModal(false);
                setDeletingClientId(null);
                setDeleteClientOtpCode("");
                fetchClients();
            } else {
                addToast(data.error || "Failed to delete client", "error");
            }
        } catch (err) {
            addToast("Failed to delete client", "error");
        } finally {
            setIsDeletingClient(false);
        }
    };

    const handleUpdateProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProjectForm || isUpdatingProject) return;

        if (user?.role === 'view_only_admin') {
            addToast("Permission denied: View-only admin", "error");
            return;
        }

        setIsUpdatingProject(true);
        try {
            const payload = {
                ...editProjectForm,
                cost: Math.round(parseFloat(editProjectForm.cost || "0") * 100),
                discount: Math.round(parseFloat(editProjectForm.discount || "0") * 100),
                payments: (editProjectForm.payments || []).map((p: any) => ({
                    ...p,
                    amount: Math.round(parseFloat(p.amount || "0") * 100)
                }))
            };
            const res = await fetch("/api/admin/projects", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                addToast("Project updated successfully!", "success");
                setEditProjectForm(null);
                fetchClients();
                if (editProjectForm.status === "Completed" && chatProjectId === editProjectForm.id) {
                    setChatMessages([]);
                }
            } else {
                const err = await res.json();
                addToast(err.error || "Project update failed", "error");
            }
        } catch (err) {
            addToast("Failed to update project", "error");
        } finally {
            setIsUpdatingProject(false);
        }
    };

    // Calculate unread totals
    const totalUnreadCount = clients.reduce((acc, cli) => acc + (cli.projects?.reduce((pAcc: number, p: any) => pAcc + (p.unreadCount || 0), 0) || 0), 0);

    const allChatProjects = clients.flatMap(cli => 
        (cli.projects || []).map((p: any) => ({
            ...p,
            clientName: cli.company_name || cli.name,
            clientLogo: cli.company_logo_url
        }))
    ).filter(p => p.status !== 'Completed');

    const filteredChatProjects = allChatProjects.filter(p => 
        p.title.toLowerCase().includes(chatSearch.toLowerCase()) || 
        p.clientName.toLowerCase().includes(chatSearch.toLowerCase())
    );

    const activeSelectedProject = allChatProjects.find(p => p.id === chatProjectId);

    if (authLoading || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'view_only_admin')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-505 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={36} />
                <p className="font-semibold text-sm">Verifying Credentials...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-955 font-sans overflow-hidden">
            {/* Upper Hub Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin")}
                        className="p-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center"
                        title="Back to Admin Panel"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            Commercial Client Hub
                        </h1>
                        <p className="text-xs text-slate-400">Manage client directory database and WhatsApp-style logs</p>
                    </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-805 p-1 rounded-xl border dark:border-slate-800/80 shrink-0">
                    <button
                        onClick={() => setHubActiveTab('directory')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all ${
                            hubActiveTab === 'directory'
                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-450 shadow-sm"
                                : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                        }`}
                    >
                        Directory & Enquiries
                    </button>
                    <button
                        onClick={() => setHubActiveTab('chats')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                            hubActiveTab === 'chats'
                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-450 shadow-sm"
                                : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                        }`}
                    >
                        Discussions Inbox
                        {totalUnreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-green-500 text-white rounded-full leading-none shrink-0 shadow-sm shadow-green-500/20">
                                {totalUnreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {hubActiveTab === 'directory' ? (
                    <main className="flex-grow p-6 space-y-6 overflow-y-auto">
                        {/* Pending Enquiries Section */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b dark:border-slate-800 pb-2">
                                Approved Collaboration Enquiries
                            </h3>
                            {isLoadingEnquiries ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : enquiries.length === 0 ? (
                                <p className="text-slate-400 dark:text-slate-500 text-xs italic pl-1">No pending inquiries found.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {enquiries.filter(e => e.status === "Pending").map((enq) => (
                                        <div key={enq.id} className="p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-905 dark:text-white text-sm truncate">{enq.subject}</h4>
                                                <p className="text-[10px] text-slate-450 mt-1">From: <strong className="text-slate-700 dark:text-slate-300">{enq.name}</strong> ({enq.email})</p>
                                                <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap">{enq.message}</p>
                                            </div>
                                            {user?.role !== 'view_only_admin' && (
                                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                                                    <button
                                                        onClick={() => handleDeleteEnquiry(enq.id)}
                                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/30 text-red-600 text-[10px] font-bold rounded-lg transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setOnboardForm({
                                                            name: enq.name,
                                                            email: enq.email,
                                                            companyName: "",
                                                            companyLogoUrl: "",
                                                            phone: "",
                                                            projectTitle: enq.subject,
                                                            projectDescription: enq.message,
                                                            cost: 0,
                                                            deadline: "",
                                                            enquiryId: enq.id,
                                                            description: ""
                                                        })}
                                                        className="px-4 py-1.5 bg-blue-650 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-md shadow-blue-500/10"
                                                    >
                                                        Onboard Client
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Directory */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-sm text-slate-905 dark:text-white uppercase tracking-wider border-b dark:border-slate-800 pb-2">
                                Valued Customer Directory
                            </h3>
                            {isLoadingClients ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-550" /></div>
                            ) : clients.length === 0 ? (
                                <p className="text-slate-400 dark:text-slate-500 text-xs italic pl-1">No onboarded clients found.</p>
                            ) : (
                                <div className="space-y-6">
                                    {clients.map((cli) => (
                                        <div key={cli.id} className="p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-450 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden shadow-sm">
                                                            {cli.company_logo_url ? <img src={cli.company_logo_url} alt="" className="w-full h-full object-cover" /> : <Building size={20} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{cli.company_name || cli.name}</h4>
                                                            <p className="text-[10px] text-slate-450">Contact: {cli.name} &bull; {cli.email} &bull; {cli.phone || "No phone"}</p>
                                                        </div>
                                                    </div>
                                                    {user?.role !== 'view_only_admin' && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setEditingClientForm({
                                                                    id: cli.id,
                                                                    name: cli.name,
                                                                    email: cli.email,
                                                                    companyName: cli.company_name || "",
                                                                    companyLogoUrl: cli.company_logo_url || "",
                                                                    phone: cli.phone || "",
                                                                    description: cli.description || ""
                                                                })}
                                                                className="flex items-center gap-1 px-3 py-1.5 border border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                                                            >
                                                                <Edit2 size={12} /> Edit Directory
                                                            </button>
                                                            {user?.role === 'admin' && (
                                                                <button
                                                                    onClick={() => handleRequestDeleteClientOtp(cli.id)}
                                                                    disabled={isSendingDeleteOtp}
                                                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400 transition-all disabled:opacity-50"
                                                                >
                                                                    <Trash2 size={12} /> Delete Profile
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Projects section */}
                                                <div className="space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                                                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Collaborations</h5>
                                                    {cli.projects && cli.projects.length > 0 ? (
                                                        <div className="grid sm:grid-cols-2 gap-4">
                                                            {cli.projects.map((proj: any) => (
                                                                <div key={proj.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <h6 className="font-bold text-xs text-slate-900 dark:text-white truncate pr-2">{proj.title}</h6>
                                                                            <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                                                proj.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-950/30" :
                                                                                proj.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30" :
                                                                                proj.status === "Quoted" ? "bg-yellow-105 text-yellow-800 dark:bg-yellow-950/30" :
                                                                                "bg-slate-105 text-slate-600 dark:bg-slate-800"
                                                                            }`}>
                                                                                {proj.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{proj.description}</p>
                                                                        
                                                                        {/* Cost metrics */}
                                                                        <div className="mt-2 text-[9px] text-slate-450 flex flex-wrap gap-x-3 gap-y-1">
                                                                            <span>Cost: <strong className="text-slate-655 dark:text-slate-300">₹{(proj.cost / 100).toLocaleString()}</strong></span>
                                                                            {proj.discount > 0 && (
                                                                                <>
                                                                                    <span>Discount: <strong className="text-emerald-600">-₹{(proj.discount / 100).toLocaleString()}</strong></span>
                                                                                    <span>Net: <strong className="text-slate-800 dark:text-white">₹{((proj.cost - proj.discount) / 100).toLocaleString()}</strong></span>
                                                                                </>
                                                                            )}
                                                                            {proj.deadline && (
                                                                                <span>Deadline: <strong>{new Date(proj.deadline).toLocaleDateString()}</strong></span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 gap-2">
                                                                        {user?.role !== 'view_only_admin' && (
                                                                            <button
                                                                                onClick={() => setEditProjectForm({
                                                                                    id: proj.id,
                                                                                    title: proj.title,
                                                                                    description: proj.description,
                                                                                    cost: proj.cost !== undefined && proj.cost !== null ? (proj.cost / 100).toString() : "",
                                                                                    discount: proj.discount !== undefined && proj.discount !== null ? (proj.discount / 100).toString() : "0",
                                                                                    payments: (proj.payments || []).map((p: any) => ({
                                                                                        ...p,
                                                                                        amount: p.amount !== undefined && p.amount !== null ? (p.amount / 100).toString() : "0"
                                                                                    })),
                                                                                    project_image_url: proj.project_image_url || "",
                                                                                    live_url: proj.live_url || "",
                                                                                    deadline: proj.deadline ? proj.deadline.split('T')[0] : "",
                                                                                    status: proj.status
                                                                                })}
                                                                                className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                                                                            >
                                                                                <Edit2 size={10} /> Configure Pricing
                                                                            </button>
                                                                        )}
                                                                        {proj.status !== "Completed" && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setHubActiveTab('chats');
                                                                                    setChatProjectId(proj.id);
                                                                                }}
                                                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-450 flex items-center gap-1.5"
                                                                            >
                                                                                <MessageSquare size={10} /> Open Inbox
                                                                                {proj.unreadCount > 0 && (
                                                                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-400 text-xs italic">No active projects logged.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                ) : (
                    /* WHATSAPP STYLE CHATS WORKSPACE */
                    <main className="flex-grow flex overflow-hidden">
                        {/* Chats left sidebar list */}
                        <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 shrink-0">
                            <div className="relative group shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-405 group-focus-within:text-blue-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search chats by project or client..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 outline-none text-xs focus:ring-2 ring-blue-500 transition-all"
                                    value={chatSearch}
                                    onChange={e => setChatSearch(e.target.value)}
                                />
                            </div>

                            {filteredChatProjects.length === 0 ? (
                                <p className="text-slate-400 text-xs text-center py-12 italic">No conversations matches criteria.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {filteredChatProjects.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setChatProjectId(p.id)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                chatProjectId === p.id
                                                    ? "bg-blue-50/55 dark:bg-blue-900/20 border-blue-500/50 shadow-sm"
                                                    : "border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex items-center gap-2 mb-1 justify-between">
                                                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-xs">{p.title}</h4>
                                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                        p.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/20" : "bg-yellow-105 text-yellow-805 dark:bg-yellow-950/20"
                                                    }`}>{p.status}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-450 truncate">Partner: {p.clientName}</p>
                                            </div>
                                            {p.unreadCount > 0 && (
                                                <span className="w-5 h-5 bg-green-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center shrink-0 shadow-md shadow-green-500/25">
                                                    {p.unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </aside>

                        {/* Chats active message viewport log */}
                        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                            {activeSelectedProject ? (
                                <div className="flex-grow flex flex-col overflow-hidden">
                                    {/* Active Chat Header */}
                                    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border dark:border-slate-700 shrink-0 shadow-sm">
                                                {activeSelectedProject.clientLogo ? (
                                                    <img src={activeSelectedProject.clientLogo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{activeSelectedProject.title}</h4>
                                                <p className="text-[10px] text-slate-450">Partner Account: {activeSelectedProject.clientName}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => fetchChatMessages(activeSelectedProject.id)}
                                            disabled={isLoadingChat}
                                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-500 rounded-xl border dark:border-slate-800 transition-all flex items-center justify-center"
                                            title="Sync Discussion Messages"
                                        >
                                            <RefreshCw size={14} className={isLoadingChat ? "animate-spin text-blue-500" : ""} />
                                        </button>
                                    </div>

                                    {/* Messages list */}
                                    <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-100 dark:bg-slate-950">
                                        {isLoadingChat && chatMessages.length === 0 ? (
                                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-505" /></div>
                                        ) : chatMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <MessageSquare size={36} strokeWidth={1.5} className="mb-2" />
                                                <p className="text-xs">Secure chat log is empty. Compose a message below to start.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {chatMessages.map((msg) => {
                                                    const isAdminSender = msg.sender_role === "admin";
                                                    return (
                                                        <div key={msg.id} className={`flex ${isAdminSender ? "justify-end" : "justify-start"}`}>
                                                            <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                                                isAdminSender ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-900 dark:text-white shadow-sm"
                                                            }`}>
                                                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                                                <span className={`text-[8px] block mt-1 text-right ${isAdminSender ? "text-blue-200" : "text-slate-400"}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Composer */}
                                    <form onSubmit={handleSendAdminMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
                                        <input
                                            type="text"
                                            required
                                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-xs focus:ring-2 ring-blue-500"
                                            placeholder="Write message as Portfolio administrator..."
                                            value={adminNewMessage}
                                            onChange={e => setAdminNewMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-center p-6 gap-3">
                                    <MessageSquare size={48} strokeWidth={1.5} />
                                    <div>
                                        <h4 className="font-bold text-slate-750 dark:text-slate-300 text-sm">Discussions Log Terminal</h4>
                                        <p className="text-xs text-slate-450 mt-1 max-w-sm">Select an active client project from the sidebar to review logs or send updates.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                )}
            </div>

            {/* OTP VERIFICATION DELETE CLIENT MODAL */}
            {showDeleteClientOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 dark:border-red-950/30 scale-100 animate-in zoom-in-95 duration-200 space-y-6">
                        <div className="flex items-center gap-4 text-red-655 text-red-600 dark:text-red-400">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delete Customer Profile</h3>
                                <p className="text-xs text-slate-505 font-medium font-semibold">OTP Verification Code Required</p>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/10 p-4 rounded-2xl text-xs text-red-800 dark:text-red-300 leading-relaxed border border-red-100 dark:border-red-950/20">
                            <span className="font-bold">Warning:</span> Cascading deletion will permanently purge client records, credentials, projects, payments schedules, and chat history.
                        </div>

                        <form onSubmit={handleVerifyDeleteClientOtpAndExecute} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-2 block">
                                    Enter 6-Digit Verification OTP
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="000000"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-2 ring-red-500 dark:ring-red-650 transition-all placeholder:text-slate-350 placeholder:tracking-normal"
                                    value={deleteClientOtpCode}
                                    onChange={e => {
                                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                                        setDeleteClientOtpCode(cleanVal);
                                    }}
                                />
                                <p className="text-[10px] text-slate-400 mt-2 text-center">
                                    Dispatched verification code to admin email account.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteClientOtpModal(false);
                                        setDeletingClientId(null);
                                        setDeleteClientOtpCode("");
                                    }}
                                    className="px-6 py-2.5 font-bold text-slate-505 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeletingClient || deleteClientOtpCode.length < 6}
                                    className="px-8 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeletingClient && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm Deletion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT CLIENT DIRECTORY MODAL */}
            {editingClientForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-850">
                            <h3 className="text-xl font-bold">Edit Customer Profile</h3>
                            <button onClick={() => setEditingClientForm(null)} className="text-slate-400 hover:text-slate-655"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditClientSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Client Contact Name" value={editingClientForm.name} onChange={v => setEditingClientForm({ ...editingClientForm, name: v })} />
                                <Input label="Email (Uneditable)" value={editingClientForm.email} onChange={() => {}} type="email" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Company Name" value={editingClientForm.companyName} onChange={v => setEditingClientForm({ ...editingClientForm, companyName: v })} />
                                <Input label="Phone" value={editingClientForm.phone} onChange={v => setEditingClientForm({ ...editingClientForm, phone: v })} />
                            </div>
                            <FileUploader label="Company Logo" value={editingClientForm.companyLogoUrl || ''} onChange={v => setEditingClientForm({ ...editingClientForm, companyLogoUrl: v })} folder="company_logos" />

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Company background / details</label>
                                <div className="min-h-[150px]">
                                    <RichTextEditor
                                        value={editingClientForm.description || ''}
                                        onChange={v => setEditingClientForm({ ...editingClientForm, description: v })}
                                        placeholder="Write customer business summary, goals, or references..."
                                        allowImages={false}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => setEditingClientForm(null)} disabled={isUpdatingClient} className="px-5 py-2 text-slate-505 font-bold text-sm disabled:opacity-50">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingClient}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdatingClient && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROJECT CONFIG MODAL */}
            {editProjectForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Configure Project Details</h3>
                            <button onClick={() => setEditProjectForm(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateProjectSubmit} className="space-y-4">
                            <Input label="Project Title" value={editProjectForm.title} onChange={v => setEditProjectForm({ ...editProjectForm, title: v })} />
                            <div>
                                <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">Description</label>
                                <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none text-xs h-20" value={editProjectForm.description} onChange={e => setEditProjectForm({ ...editProjectForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Live Demo URL" value={editProjectForm.live_url || ""} onChange={v => setEditProjectForm({ ...editProjectForm, live_url: v })} />
                                <Input label="Showcase Image URL" value={editProjectForm.project_image_url || ""} onChange={v => setEditProjectForm({ ...editProjectForm, project_image_url: v })} />
                            </div>
                            <FileUploader label="Showcase Image Upload" value={editProjectForm.project_image_url || ""} onChange={v => setEditProjectForm({ ...editProjectForm, project_image_url: v })} folder="project_images" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Cost (in ₹)" value={editProjectForm.cost} onChange={v => setEditProjectForm({ ...editProjectForm, cost: v })} type="number" />
                                <Input label="Discount (in ₹)" value={editProjectForm.discount || 0} onChange={v => setEditProjectForm({ ...editProjectForm, discount: v })} type="number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-1 block">Deadline</label>
                                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-xs" value={editProjectForm.deadline} onChange={e => setEditProjectForm({ ...editProjectForm, deadline: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-1 block">Project Status</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-xs"
                                        value={editProjectForm.status}
                                        onChange={e => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
                                    >
                                        <option value="Inquiry">Inquiry (Initial)</option>
                                        <option value="Quoted">Quoted (Sent Quotation)</option>
                                        <option value="In Progress">In Progress (Active)</option>
                                        <option value="Testing">Testing</option>
                                        <option value="Completed">Completed (Auto-purges chats)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-550 uppercase ml-1 block">Payment Milestones</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPayments = [...(editProjectForm.payments || [])];
                                            newPayments.push({ title: "New Milestone", amount: "0", status: "Pending" });
                                            setEditProjectForm({ ...editProjectForm, payments: newPayments });
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-450 hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add Milestone
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                    {(!editProjectForm.payments || editProjectForm.payments.length === 0) ? (
                                        <p className="text-[11px] text-slate-400 italic pl-1">No milestones defined. Cost will be treated as single payment.</p>
                                    ) : (
                                        editProjectForm.payments.map((p: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-800 space-y-2 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPayments = editProjectForm.payments.filter((_: any, i: number) => i !== idx);
                                                        setEditProjectForm({ ...editProjectForm, payments: newPayments });
                                                    }}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-750 transition-colors"
                                                    title="Delete Milestone"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        label="Milestone Title"
                                                        value={p.title}
                                                        onChange={v => {
                                                            const newPayments = [...editProjectForm.payments];
                                                            newPayments[idx] = { ...newPayments[idx], title: v };
                                                            setEditProjectForm({ ...editProjectForm, payments: newPayments });
                                                        }}
                                                    />
                                                    <Input
                                                        label="Amount (in ₹)"
                                                        value={p.amount}
                                                        type="number"
                                                        onChange={v => {
                                                            const newPayments = [...editProjectForm.payments];
                                                            newPayments[idx] = { ...newPayments[idx], amount: v };
                                                            setEditProjectForm({ ...editProjectForm, payments: newPayments });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-505 uppercase block mb-1">Status</label>
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-955 border border-slate-202 dark:border-slate-700 rounded-lg p-2 outline-none text-xs"
                                                        value={p.status}
                                                        onChange={e => {
                                                            const newPayments = [...editProjectForm.payments];
                                                            newPayments[idx] = { ...newPayments[idx], status: e.target.value };
                                                            setEditProjectForm({ ...editProjectForm, payments: newPayments });
                                                        }}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Paid">Paid</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => setEditProjectForm(null)} disabled={isUpdatingProject} className="px-5 py-2 text-slate-505 font-bold text-sm disabled:opacity-50">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingProject}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdatingProject && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* APPROVED ONBOARDING CLIENT MODAL */}
            {onboardForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-850">
                            <h3 className="text-xl font-bold">Approved Onboarding Client</h3>
                            <button onClick={() => setOnboardForm(null)} className="text-slate-400 hover:text-slate-655"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleOnboardSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Client Name" value={onboardForm.name} onChange={v => setOnboardForm({ ...onboardForm, name: v })} />
                                <Input label="Email (Uneditable)" value={onboardForm.email} onChange={() => {}} type="email" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Company Name" value={onboardForm.companyName} onChange={v => setOnboardForm({ ...onboardForm, companyName: v })} />
                                <Input label="Phone" value={onboardForm.phone} onChange={v => setOnboardForm({ ...onboardForm, phone: v })} />
                            </div>
                            <FileUploader label="Company Logo" value={onboardForm.companyLogoUrl || ''} onChange={v => setOnboardForm({ ...onboardForm, companyLogoUrl: v })} folder="company_logos" />

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Client biography / description</label>
                                <div className="min-h-[150px]">
                                    <RichTextEditor
                                        value={onboardForm.description || ''}
                                        onChange={v => setOnboardForm({ ...onboardForm, description: v })}
                                        placeholder="Write client background, business profile, or references..."
                                        allowImages={false}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-2xl space-y-4">
                                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Initial Project Details</h4>
                                <Input label="Project Title" value={onboardForm.projectTitle} onChange={v => setOnboardForm({ ...onboardForm, projectTitle: v })} />
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Description</label>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none text-xs h-24" value={onboardForm.projectDescription} onChange={e => setOnboardForm({ ...onboardForm, projectDescription: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Quoted Cost (in ₹)" value={onboardForm.cost} onChange={v => setOnboardForm({ ...onboardForm, cost: v })} type="number" />
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Deadline</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-xs" value={onboardForm.deadline} onChange={e => setOnboardForm({ ...onboardForm, deadline: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => setOnboardForm(null)} disabled={isOnboarding} className="px-5 py-2 text-slate-505 font-bold text-sm disabled:opacity-50">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isOnboarding}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isOnboarding && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Onboard & Setup Portal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success modals */}
            <SuccessModal
                isOpen={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
};
