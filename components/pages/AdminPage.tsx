"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Trash2, Plus, Save, X, Edit2, Loader2, Sparkles,
    LayoutDashboard, User, FolderOpen, BookOpen, Briefcase, GraduationCap,
    LogOut, Menu, ChevronRight, Search, ExternalLink, RefreshCw, CheckCircle, Award, Send,
    Github, Lock, Building, DollarSign, Calendar, MessageSquare, CheckCircle2, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { useToast } from "@/components/ui/Toast";
import { IconPicker } from "@/components/ui/IconPicker";
import { FileUploader } from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import { formatDateRange } from "@/lib/utils";

// --- UI Helpers ---
const Input = ({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: (v: string) => void, type?: string }) => (
    <div className="w-full min-w-0">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{label}</label>
        <input type={type} className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
);

const EditorLayout = ({ title, children, onCancel, onSave }: any) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-205 dark:border-slate-700 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-650"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
        <div className="pt-6 border-t dark:border-slate-700 flex justify-end gap-3">
            <button onClick={onCancel} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors">Cancel</button>
            <button onClick={onSave} className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">Save Changes</button>
        </div>
    </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        <Icon size={20} />
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-500 text-white rounded-full leading-none flex items-center justify-center shrink-0">
                {badge}
            </span>
        )}
        {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
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
                    <p className="text-slate-500 font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

// ============================================
// CLIENT DASHBOARD CONTENT
// ============================================
const ClientDashboardContent: React.FC<{
    user: { email: string; role: string; id?: string };
    handleLogout: () => void;
    addToast: (msg: string, type: "success" | "error" | "info") => void;
}> = ({ user, handleLogout, addToast }) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [mustReset, setMustReset] = useState(false);
    const [passwords, setPasswords] = useState({ password: "", confirm: "" });
    const [isResetting, setIsResetting] = useState(false);
    const [clientActiveTab, setClientActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

    // Change password state
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [isChangePasswordSubmitting, setIsChangePasswordSubmitting] = useState(false);

    // Request new project state
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({ title: "", description: "" });
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    // Client Profile Edit & OTP Verification states
    const [clientProfile, setClientProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({
        name: "",
        email: "",
        companyName: "",
        companyLogoUrl: "",
        phone: "",
        description: ""
    });
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const fetchClientProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const res = await fetch("/api/client/profile");
            if (res.ok) {
                const data = await res.json();
                setClientProfile(data);
            }
        } catch (error) {
            console.error("Error fetching client profile:", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const fetchClientProjects = async (silent = false) => {
        if (!silent) setIsLoadingProjects(true);
        try {
            const res = await fetch("/api/client/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data || []);
                if (data && data.length > 0 && !selectedProject) {
                    setSelectedProject(data[0]);
                } else if (selectedProject) {
                    const updated = data.find((p: any) => p.id === selectedProject.id);
                    if (updated) setSelectedProject(updated);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setIsLoadingProjects(false);
        }
    };

    useEffect(() => {
        const checkReset = async () => {
            try {
                const res = await fetch("/api/auth/check");
                if (res.ok) {
                    const data = await res.json();
                    if (data.user?.mustReset) {
                        setMustReset(true);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkReset();
        fetchClientProfile();
        fetchClientProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchMessages(selectedProject.id);
        }
    }, [selectedProject?.id]);

    const fetchMessages = async (projId: string) => {
        if (selectedProject?.status === "Completed") {
            setMessages([]);
            return;
        }
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`/api/projects/messages?projectId=${projId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data || []);
                fetchClientProjects(true); // silent refresh of unread badges
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedProject) return;

        try {
            const res = await fetch("/api/projects/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    message: newMessage.trim()
                })
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
                setNewMessage("");
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to send message", "error");
            }
        } catch (error) {
            addToast("Failed to send message", "error");
        }
    };

    const handleQuoteAction = async (action: "approve" | "decline") => {
        if (!selectedProject) return;
        try {
            const res = await fetch("/api/client/projects", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    action
                })
            });
            const data = await res.json();
            if (res.ok) {
                addToast(`Quote ${action === "approve" ? "approved" : "declined"}!`, "success");
                fetchClientProjects();
            } else {
                addToast(data.error || "Action failed", "error");
            }
        } catch (error) {
            addToast("Failed to process quote action", "error");
        }
    };

    const handlePasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.password !== passwords.confirm) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (passwords.password.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setIsResetting(true);
        try {
            const res = await fetch("/api/client/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: passwords.password })
            });
            if (res.ok) {
                addToast("Password updated successfully!", "success");
                setMustReset(false);
            } else {
                const err = await res.json();
                addToast(err.error || "Password change failed", "error");
            }
        } catch (error) {
            addToast("Failed to update password", "error");
        } finally {
            setIsResetting(false);
        }
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (changePasswordForm.newPassword.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setIsChangePasswordSubmitting(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: changePasswordForm.currentPassword,
                    newPassword: changePasswordForm.newPassword
                })
            });
            const d = await res.json();
            if (res.ok) {
                addToast("Password changed successfully!", "success");
                setShowChangePasswordModal(false);
                setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                addToast(d.error || "Password change failed", "error");
            }
        } catch (error) {
            addToast("Failed to change password", "error");
        } finally {
            setIsChangePasswordSubmitting(false);
        }
    };

    const handleEditProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProfileForm.name || !editProfileForm.email) {
            addToast("Name and email are required", "error");
            return;
        }

        setIsSendingOtp(true);
        try {
            const res = await fetch("/api/client/profile/otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: editProfileForm.email })
            });
            const data = await res.json();
            if (res.ok) {
                addToast("Verification OTP sent to " + editProfileForm.email, "success");
                setShowEditProfileModal(false);
                setShowOtpModal(true);
                setOtpCode("");
            } else {
                addToast(data.error || "Failed to send verification code", "error");
            }
        } catch (error) {
            console.error("Error sending profile OTP:", error);
            addToast("Failed to send verification code. Please try again.", "error");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtpAndSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode.trim()) {
            addToast("Please enter the verification OTP code", "error");
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await fetch("/api/client/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editProfileForm.name,
                    email: editProfileForm.email,
                    companyName: editProfileForm.companyName,
                    companyLogoUrl: editProfileForm.companyLogoUrl,
                    phone: editProfileForm.phone,
                    description: editProfileForm.description,
                    otp: otpCode.trim()
                })
            });
            const data = await res.json();
            if (res.ok) {
                addToast("Profile updated successfully!", "success");
                setShowOtpModal(false);
                fetchClientProfile();
            } else {
                addToast(data.error || "Profile update failed", "error");
            }
        } catch (error) {
            console.error("Error updating client profile:", error);
            addToast("Failed to update profile. Please try again.", "error");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleRequestProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestForm.title.trim()) return;

        setIsSubmittingRequest(true);
        try {
            const res = await fetch("/api/client/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: requestForm.title.trim(),
                    description: requestForm.description.trim()
                })
            });
            if (res.ok) {
                const newProj = await res.json();
                addToast("Project request submitted successfully!", "success");
                setRequestForm({ title: "", description: "" });
                setShowRequestModal(false);
                await fetchClientProjects();
                setSelectedProject(newProj);
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to submit project request", "error");
            }
        } catch (error) {
            addToast("Failed to submit project request", "error");
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-955 flex flex-col font-sans transition-colors duration-300">
            {mustReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                        <div className="text-center">
                            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset Password</h3>
                            <p className="text-slate-500 text-sm mt-1">For security, you must update your temporary password before proceeding.</p>
                        </div>
                        <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                    value={passwords.password}
                                    onChange={e => setPasswords({ ...passwords, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isResetting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center text-sm"
                            >
                                {isResetting ? "Updating..." : "Save Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
                   <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        {clientProfile?.company_logo_url ? (
                            <img src={clientProfile.company_logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Briefcase size={20} className="text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                            {clientProfile?.company_name || "Client Portal"}
                        </h2>
                        <p className="text-xs text-slate-505">
                            {clientProfile?.name ? `${clientProfile.name} • ` : ""}{clientProfile?.email || user.email}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border dark:border-slate-800">
                    <button
                        onClick={() => setClientActiveTab('dashboard')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all ${
                            clientActiveTab === 'dashboard'
                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-350"
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setClientActiveTab('chat')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                            clientActiveTab === 'chat'
                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-350"
                        }`}
                    >
                        Project Chat
                        {projects.reduce((acc, p) => acc + (p.unreadCount || 0), 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-green-550 text-white rounded-full leading-none shrink-0">
                                {projects.reduce((acc, p) => acc + (p.unreadCount || 0), 0)}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (clientProfile) {
                                setEditProfileForm({
                                    name: clientProfile.name || "",
                                    email: clientProfile.email || "",
                                    companyName: clientProfile.company_name || "",
                                    companyLogoUrl: clientProfile.company_logo_url || "",
                                    phone: clientProfile.phone || "",
                                    description: clientProfile.description || ""
                                });
                                setShowEditProfileModal(true);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-205 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-805 transition-all text-slate-600 dark:text-slate-450 font-bold text-sm"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                    <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-205 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-805 transition-all text-slate-600 dark:text-slate-450 font-bold text-sm"
                    >
                        <Lock size={16} /> Change Password
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-205 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-805 transition-all text-slate-600 dark:text-slate-400 font-bold text-sm"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {clientActiveTab === 'dashboard' ? (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">My Projects</h3>
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-blue-500/10 transition-all active:scale-95"
                            >
                                <Plus size={10} /> Request Project
                            </button>
                        </div>
                        {isLoadingProjects ? (
                            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : projects.length === 0 ? (
                            <p className="text-slate-505 text-sm text-center py-12">No projects onboarded yet.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {projects.map((proj: any) => (
                                    <button
                                        key={proj.id}
                                        onClick={() => setSelectedProject(proj)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                            selectedProject?.id === proj.id
                                                ? "bg-blue-50/55 dark:bg-blue-900/20 border-blue-500/50 shadow-sm"
                                                : "border-slate-205 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2 text-sm">{proj.title}</h4>
                                            <div className="flex items-center gap-2">
                                                {proj.unreadCount > 0 && (
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                                )}
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                    proj.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                                                    proj.status === "In Progress" ? "bg-blue-105 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                                                    proj.status === "Quoted" ? "bg-yellow-105 text-yellow-850 dark:bg-yellow-950/30 dark:text-yellow-400" :
                                                    "bg-slate-105 text-slate-650 dark:bg-slate-800 dark:text-slate-400"
                                                }`}>
                                                    {proj.status}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-505 line-clamp-2">{proj.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-955 overflow-y-auto">
                        {selectedProject ? (
                            <div className="flex-1 p-6 space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">{selectedProject.title}</h3>
                                        <p className="text-slate-505 text-sm mt-1">{selectedProject.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                                            <span>Base Cost: <strong className="text-slate-900 dark:text-white">₹{(selectedProject.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                                            {selectedProject.discount > 0 && (
                                                <span className="text-rose-600 dark:text-rose-400">Discount: <strong>-₹{(selectedProject.discount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                                            )}
                                            {selectedProject.deadline && (
                                                <span>Deadline: <strong className="text-slate-900 dark:text-white">{new Date(selectedProject.deadline).toLocaleDateString()}</strong></span>
                                            )}
                                        </div>
                                    </div>
 
                                    {selectedProject.status === "Quoted" && (
                                        <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                            <div className="text-center sm:text-left">
                                                <p className="text-xs font-bold text-slate-505 uppercase">Quotation Proposal</p>
                                                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                    ₹{((Math.max(0, selectedProject.cost - (selectedProject.discount || 0))) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleQuoteAction("decline")}
                                                    className="px-4 py-2 bg-red-105 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-650 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition-all"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handleQuoteAction("approve")}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-500/20"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
 
                                {/* Payments & Milestones Section */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-b pb-2 dark:border-slate-800 flex items-center gap-2">
                                        <DollarSign size={16} className="text-emerald-500" />
                                        Payment Schedule & Milestones
                                    </h4>
                                    <div className="grid sm:grid-cols-3 gap-4 pb-4 border-b dark:border-slate-800">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-2xl border dark:border-slate-850">
                                            <p className="text-[10px] font-bold text-slate-505 uppercase">Base Price</p>
                                            <p className="text-lg font-extrabold text-slate-905 dark:text-white mt-1">₹{(selectedProject.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-2xl border dark:border-slate-850">
                                            <p className="text-[10px] font-bold text-slate-505 uppercase">Discount</p>
                                            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-455 mt-1">-₹{((selectedProject.discount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-950/20">
                                            <p className="text-[10px] font-bold text-slate-505 uppercase text-emerald-700 dark:text-emerald-400 font-bold">Total Net Payable</p>
                                            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">₹{((Math.max(0, selectedProject.cost - (selectedProject.discount || 0))) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
 
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-extrabold text-slate-505 uppercase tracking-wider">Installments Schedule</p>
                                        {!selectedProject.payments || selectedProject.payments.length === 0 ? (
                                            <div className="flex items-center gap-2 text-slate-505 text-xs py-3 border dark:border-slate-850 rounded-2xl px-4 bg-slate-50 dark:bg-slate-955">
                                                <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                                                <span>Single Installment terms: The total net price is settled in a single final payment upon completion.</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedProject.payments.map((milestone: any) => {
                                                    const isPaid = milestone.status === 'Paid';
                                                    return (
                                                        <div key={milestone.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-850">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                                    isPaid ? "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-yellow-105 text-yellow-750 dark:bg-yellow-950/30 dark:text-yellow-400"
                                                                }`}>
                                                                    {isPaid ? <CheckCircle size={16} /> : <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{milestone.title}</p>
                                                                    <p className="text-[10px] text-slate-400">Installment chunk</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-extrabold text-slate-900 dark:text-white">₹{(milestone.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                                    isPaid ? "bg-green-100 text-green-700 dark:bg-green-950/30" : "bg-yellow-105 text-yellow-805 dark:bg-yellow-950/20"
                                                                }`}>
                                                                    {milestone.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-2xl mx-auto py-12">
                                <div className="space-y-2">
                                    <div className="w-20 h-20 mx-auto rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md">
                                        {clientProfile?.company_logo_url ? (
                                            <img src={clientProfile.company_logo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building size={36} className="text-slate-400" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-905 dark:text-white">
                                        {clientProfile?.company_name || clientProfile?.name || "Welcome!"}
                                    </h3>
                                    <p className="text-slate-500 text-sm max-w-md">
                                        {clientProfile?.description 
                                            ? "Review your company biography and details below, or select an active project from the sidebar to review details." 
                                            : "Select an active project from the sidebar to review quotations or details."}
                                    </p>
                                </div>
                                
                                {clientProfile?.description && (
                                    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-3 shadow-sm">
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 border-b pb-2 dark:border-slate-800">Company biography</h4>
                                        <div 
                                            className="prose dark:prose-invert max-w-none text-xs text-slate-605 dark:text-slate-400 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: clientProfile.description }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-105 dark:bg-slate-955">
                    {/* Left Sidebar Chats */}
                    <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 shrink-0">
                        <div className="flex items-center justify-between pb-2 border-b dark:border-slate-850">
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Project Chats</h3>
                        </div>
                        {projects.length === 0 ? (
                            <p className="text-slate-505 text-sm text-center py-12">No active discussions available.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {projects.filter(p => p.status !== 'Completed').map((proj: any) => (
                                    <button
                                        key={proj.id}
                                        onClick={() => setSelectedProject(proj)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                            selectedProject?.id === proj.id
                                                ? "bg-blue-50/55 dark:bg-blue-900/20 border-blue-500/50 shadow-sm"
                                                : "border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">{proj.title}</h4>
                                                <span className="text-[9px] text-slate-400">WhatsApp</span>
                                            </div>
                                            <p className="text-[11px] text-slate-450 truncate mt-1">Open conversation thread</p>
                                        </div>
                                        {proj.unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-green-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shrink-0 shadow-md shadow-green-500/20">
                                                {proj.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Right Viewport WhatsApp Thread */}
                    <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                        {selectedProject && selectedProject.status !== 'Completed' ? (
                            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
                                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-205 dark:border-slate-800 shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-slate-905 dark:text-white text-sm">
                                            {selectedProject.title} Chat
                                        </h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Project Discussion Room</p>
                                    </div>
                                    <button
                                        onClick={() => fetchMessages(selectedProject.id)}
                                        disabled={isLoadingMessages}
                                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 rounded-xl transition-all border dark:border-slate-800/80 flex items-center justify-center"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? "animate-spin text-blue-500" : ""}`} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                                            <p className="text-slate-505 text-xs font-semibold">No messages. Ask a question below to begin discussion.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg: any) => {
                                            const isAdmin = msg.sender_role === "admin";
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                                                >
                                                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-xs ${
                                                        isAdmin
                                                            ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                                                            : "bg-blue-600 text-white"
                                                    }`}>
                                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                        <span className={`text-[9px] block mt-1.5 text-right ${
                                                            isAdmin ? "text-slate-400 dark:text-slate-505" : "text-blue-200"
                                                        }`}>
                                                            {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-205 dark:border-slate-800 flex gap-3">
                                    <input
                                        type="text"
                                        required
                                        className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all text-xs"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center shrink-0"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                                <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Project Discussions</h4>
                                    <p className="text-slate-505 text-xs max-w-sm mt-1">
                                        Select an active project chat thread from the left list to begin discussing details with the engineer.
                                    </p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            )}

            {/* Request Project Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Request New Project</h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-650"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRequestProjectSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Project Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    placeholder="e.g., E-commerce Website"
                                    value={requestForm.title}
                                    onChange={e => setRequestForm({ ...requestForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Description & Requirements</label>
                                <textarea
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-xs h-32 animate-none resize-none"
                                    placeholder="Describe what you want us to build, any features needed, timeline, and tech stack expectations..."
                                    value={requestForm.description}
                                    onChange={e => setRequestForm({ ...requestForm, description: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => setShowRequestModal(false)} className="px-5 py-2 text-slate-505 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={isSubmittingRequest} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2">
                                    {isSubmittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowChangePasswordModal(false);
                                    setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                }}
                                className="text-slate-400 hover:text-slate-655"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.currentPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.newPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.confirmPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChangePasswordModal(false);
                                        setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                    className="px-5 py-2 text-slate-550 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isChangePasswordSubmitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2"
                                >
                                    {isChangePasswordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Client Edit Profile Modal */}
            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Edit Profile Details</h3>
                            <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Client Name" value={editProfileForm.name} onChange={v => setEditProfileForm({ ...editProfileForm, name: v })} />
                                <Input label="Email" value={editProfileForm.email} onChange={v => setEditProfileForm({ ...editProfileForm, email: v })} type="email" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Company Name" value={editProfileForm.companyName} onChange={v => setEditProfileForm({ ...editProfileForm, companyName: v })} />
                                <Input label="Phone" value={editProfileForm.phone} onChange={v => setEditProfileForm({ ...editProfileForm, phone: v })} />
                            </div>
                            <FileUploader label="Company Logo" value={editProfileForm.companyLogoUrl || ''} onChange={v => setEditProfileForm({ ...editProfileForm, companyLogoUrl: v })} folder="company_logos" />

                            <div>
                                <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-2 block">Client biography / description</label>
                                <div className="min-h-[150px]">
                                    <RichTextEditor
                                        value={editProfileForm.description || ''}
                                        onChange={v => setEditProfileForm({ ...editProfileForm, description: v })}
                                        placeholder="Write client background, business profile, or other details..."
                                        allowImages={false}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => setShowEditProfileModal(false)} className="px-5 py-2 text-slate-505 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={isSendingOtp} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2">
                                    {isSendingOtp && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Send Verification OTP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Email OTP Verification</h3>
                            <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-655"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleVerifyOtpAndSave} className="space-y-4">
                            <p className="text-xs text-slate-505 leading-relaxed">
                                We sent a 6-digit verification code to <strong>{editProfileForm.email}</strong>. Enter the OTP code below to verify and save your changes.
                            </p>
                            <div>
                                <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-1 block">Verification OTP Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm font-semibold tracking-widest text-center"
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button type="button" onClick={() => { setShowOtpModal(false); setShowEditProfileModal(true); }} className="px-5 py-2 text-slate-505 font-bold text-sm">Back</button>
                                <button type="submit" disabled={isSavingProfile} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2">
                                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Verify & Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// MAIN ADMIN OR PORTAL CONTROLLER
// ============================================
const AdminContent: React.FC = () => {
    const {
        data,
        projectsMeta,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        fetchAdminData,
        createSkill, deleteSkill,
        createExperience, updateExperience, deleteExperience,
        updateProfile,
        createEducation, updateEducation, deleteEducation,
        createCertification, updateCertification, deleteCertification,
        fetchAdminProjects, fetchAdminBlogs, fetchAdminCertifications,
        fetchAdminSkills, fetchAdminExperience, fetchAdminEducation
    } = usePortfolio();

    const router = useRouter();
    const { addToast } = useToast();

    // UI States
    const [activeTab, setActiveTab] = useState<'profile' | 'financials' | 'skills' | 'certifications' | 'experience' | 'education' | 'view_only_admins'>('profile');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Password Reset / Change / Forgot states
    const [adminMustReset, setAdminMustReset] = useState(false);
    const [adminResetPasswords, setAdminResetPasswords] = useState({ password: "", confirm: "" });
    const [isAdminResetting, setIsAdminResetting] = useState(false);

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [isChangePasswordSubmitting, setIsChangePasswordSubmitting] = useState(false);

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

    // Client Management Tab States
    const [clients, setClients] = useState<any[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // Financials Tab States
    const [financials, setFinancials] = useState<any | null>(null);
    const [customDates, setCustomDates] = useState({ startDate: "", endDate: "" });
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

    // View-Only Admin Management States
    const [viewOnlyAdmins, setViewOnlyAdmins] = useState<any[]>([]);
    const [isLoadingViewOnlyAdmins, setIsLoadingViewOnlyAdmins] = useState(false);
    const [staffForm, setStaffForm] = useState({ name: "", email: "" });
    const [isAddingStaff, setIsAddingStaff] = useState(false);

    // Profile Forms State
    const [profileForm, setProfileForm] = useState<typeof data.profile | null>(null);
    const [newSkill, setNewSkill] = useState({ name: '', icon: 'devicon-react-original' });
    const [newCertification, setNewCertification] = useState({ name: '', issuer: '', url: '', date: '', icon: 'devicon-google-plain' });
    const [editingCertification, setEditingCertification] = useState<Partial<typeof data.certifications[0]> | null>(null);
    const [isCreatingCert, setIsCreatingCert] = useState(false);
    const [editingExperience, setEditingExperience] = useState<Partial<typeof data.experience[0]> | null>(null);
    const [isCreatingExp, setIsCreatingExp] = useState(false);
    const [editingEducation, setEditingEducation] = useState<Partial<typeof data.education[0]> | null>(null);
    const [isCreatingEdu, setIsCreatingEdu] = useState(false);

    // AI & Resume State
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeText, setResumeText] = useState("");
    const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
    const [importedData, setImportedData] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // (empty — moved to AdminClientHubPage)

    // Initialize Profile Form
    useEffect(() => {
        if (data?.profile) {
            const safeProfile = { ...data.profile };
            if (typeof safeProfile.roles === 'string') {
                try { safeProfile.roles = JSON.parse(safeProfile.roles); } catch (e) { safeProfile.roles = []; }
            }
            if (!Array.isArray(safeProfile.roles)) safeProfile.roles = [];

            if (typeof safeProfile.currentlyLearning === 'string') {
                try { safeProfile.currentlyLearning = JSON.parse(safeProfile.currentlyLearning); } catch (e) { safeProfile.currentlyLearning = []; }
            }
            if (!Array.isArray(safeProfile.currentlyLearning)) safeProfile.currentlyLearning = [];

            setProfileForm(safeProfile);
        }
    }, [data]);

    // Bootstrap data fetching
    useEffect(() => {
        if (isAuthenticated && (user?.role === 'admin' || user?.role === 'view_only_admin')) {
            fetchAdminData();
            fetchClients();
        }
    }, [isAuthenticated, user?.role]);

    useEffect(() => {
        if (isAuthenticated && user) {
            setAdminMustReset(user.mustReset || false);
        }
    }, [isAuthenticated, user]);

    // Lazy load tab data
    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'view_only_admin')) return;

        const loadTab = async () => {
            switch (activeTab) {
                case 'skills':
                    await fetchAdminSkills();
                    await fetchAdminCertifications();
                    break;
                case 'experience':
                    await fetchAdminExperience();
                    await fetchAdminEducation();
                    break;
                case 'financials':
                    fetchFinancials();
                    break;
                case 'view_only_admins':
                    fetchViewOnlyAdmins();
                    break;
            }
        };
        loadTab();
    }, [activeTab, isAuthenticated, user?.role]);

    // Lightweight client fetch for sidebar unread badge count only
    const fetchClients = async () => {
        setIsLoadingClients(true);
        try {
            const res = await fetch("/api/admin/clients");
            if (res.ok) {
                const data = await res.json();
                setClients(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingClients(false);
        }
    };

    // Financial calculations
    const fetchFinancials = async (start?: string, end?: string) => {
        setIsLoadingFinancials(true);
        try {
            const query = new URLSearchParams();
            if (start) query.set("startDate", start);
            if (end) query.set("endDate", end);

            const res = await fetch(`/api/admin/financials?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setFinancials(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingFinancials(false);
        }
    };

    // View-Only Admin staff account operations
    const fetchViewOnlyAdmins = async () => {
        setIsLoadingViewOnlyAdmins(true);
        try {
            const res = await fetch("/api/admin/view-only-admins");
            if (res.ok) {
                const data = await res.json();
                setViewOnlyAdmins(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingViewOnlyAdmins(false);
        }
    };

    const handleAddStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffForm.name || !staffForm.email) return;
        setIsAddingStaff(true);
        try {
            const res = await fetch("/api/admin/view-only-admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(staffForm)
            });
            const data = await res.json();
            if (res.ok) {
                addToast(`Staff account created! Temporary password sent to email.`, "success");
                setStaffForm({ name: "", email: "" });
                fetchViewOnlyAdmins();
            } else {
                addToast(data.error || "Failed to add staff account", "error");
            }
        } catch (err) {
            addToast("Failed to add staff account", "error");
        } finally {
            setIsAddingStaff(false);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!confirm("Are you sure you want to delete this staff account?")) return;
        try {
            const res = await fetch(`/api/admin/view-only-admins?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                addToast("Staff account deleted successfully", "success");
                fetchViewOnlyAdmins();
            } else {
                addToast("Failed to delete staff account", "error");
            }
        } catch (err) {
            addToast("Failed to delete staff account", "error");
        }
    };

    const handleCustomFinancialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customDates.startDate || !customDates.endDate) return;
        fetchFinancials(customDates.startDate, customDates.endDate);
    };

    // Login & Logout
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            const d = await res.json();
            if (res.ok) {
                setIsAuthenticated(true);
                setUser({ email: loginForm.email, role: d.role, id: d.clientId, mustReset: d.mustReset });
                if (d.role === 'admin') {
                    addToast("Welcome back, Admin!", "success");
                } else {
                    addToast("Welcome back to your client portal!", "success");
                }
            } else {
                addToast(d.error || "Invalid Credentials", "error");
            }
        } catch (error) {
            addToast("Login failed. Check console.", "error");
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setIsAuthenticated(false);
        setUser(null);
        addToast("Logged out successfully", "info");
    };

    const handleAdminPasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminResetPasswords.password !== adminResetPasswords.confirm) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (adminResetPasswords.password.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setIsAdminResetting(true);
        try {
            const res = await fetch("/api/client/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: adminResetPasswords.password })
            });
            if (res.ok) {
                addToast("Password updated successfully!", "success");
                setAdminMustReset(false);
                if (user) {
                    setUser({ ...user, mustReset: false });
                }
            } else {
                const err = await res.json();
                addToast(err.error || "Password change failed", "error");
            }
        } catch (error) {
            addToast("Failed to update password", "error");
        } finally {
            setIsAdminResetting(false);
        }
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (changePasswordForm.newPassword.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setIsChangePasswordSubmitting(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: changePasswordForm.currentPassword,
                    newPassword: changePasswordForm.newPassword
                })
            });
            const d = await res.json();
            if (res.ok) {
                addToast("Password changed successfully!", "success");
                setShowChangePasswordModal(false);
                setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                addToast(d.error || "Password change failed", "error");
            }
        } catch (error) {
            addToast("Failed to change password", "error");
        } finally {
            setIsChangePasswordSubmitting(false);
        }
    };

    const handleSendForgotOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return;

        setIsForgotSubmitting(true);
        try {
            const res = await fetch('/api/auth/forgot-password/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const d = await res.json();
            if (res.ok) {
                addToast("OTP sent to your email!", "success");
                setForgotStep('otp');
            } else {
                addToast(d.error || "Failed to send OTP", "error");
            }
        } catch (error) {
            addToast("Failed to send OTP", "error");
        } finally {
            setIsForgotSubmitting(false);
        }
    };

    const handleVerifyForgotOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotOtp || !forgotNewPassword) return;
        if (forgotNewPassword !== forgotConfirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (forgotNewPassword.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setIsForgotSubmitting(true);
        try {
            const res = await fetch('/api/auth/forgot-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    otp: forgotOtp,
                    newPassword: forgotNewPassword
                })
            });
            const d = await res.json();
            if (res.ok) {
                addToast("Password reset successfully! You can now sign in.", "success");
                setShowForgotModal(false);
                setForgotStep('email');
                setForgotEmail('');
                setForgotOtp('');
                setForgotNewPassword('');
                setForgotConfirmPassword('');
            } else {
                addToast(d.error || "Failed to reset password", "error");
            }
        } catch (error) {
            addToast("Failed to reset password", "error");
        } finally {
            setIsForgotSubmitting(false);
        }
    };

    const handleSave = async (
        action: () => Promise<void>,
        successMsg: string
    ) => {
        if (user?.role === 'view_only_admin') {
            addToast("Permission denied: View-only admin", "error");
            return false;
        }
        try {
            await action();
            addToast(successMsg, "success");
            return true;
        } catch (e) {
            console.error(e);
            addToast("Action failed. Check console.", "error");
            return false;
        }
    };

    // Profile & Resume Helpers
    const saveProfile = () => handleSave(async () => {
        if (profileForm) await updateProfile(profileForm);
    }, "Profile updated!");

    const saveExp = async () => {
        if (!editingExperience) return;
        const success = await handleSave(async () => {
            if (isCreatingExp) await createExperience(editingExperience);
            else if (editingExperience.id) await updateExperience(editingExperience.id, editingExperience);
        }, "Experience saved!");
        if (success) setEditingExperience(null);
    };

    const addSkill = async () => {
        if (!newSkill.name) return;
        await handleSave(() => createSkill(newSkill), "Skill added!");
        setNewSkill({ ...newSkill, name: '' });
    };

    const saveCertification = async () => {
        if (!editingCertification || !editingCertification.name) return;
        const success = await handleSave(async () => {
            if (isCreatingCert) await createCertification(editingCertification);
            else if (editingCertification.id) await updateCertification(editingCertification.id, editingCertification);
        }, "Certification saved!");
        if (success) setEditingCertification(null);
    };

    const saveEdu = async () => {
        if (!editingEducation) return;
        const success = await handleSave(async () => {
            if (isCreatingEdu) await createEducation(editingEducation);
            else if (editingEducation.id) await updateEducation(editingEducation.id, editingEducation);
        }, "Education saved!");
        if (success) setEditingEducation(null);
    };

    const handleResumeAnalysis = async () => {
        setIsAnalyzingResume(true);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: resumeText, type: 'resume' })
            });
            const data = await res.json();
            if (data.profile) {
                setImportedData({
                    profile: { ...data.profile },
                    skills: data.skills || [],
                    experience: data.experience || [],
                    education: data.education || []
                });
                setShowResumeModal(false);
                setShowReviewModal(true);
                addToast("Resume analyzed! Review the draft.", "success");
            } else {
                addToast("AI didn't return valid data.", "error");
            }
        } catch (e) {
            addToast("Analysis failed.", "error");
        } finally {
            setIsAnalyzingResume(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!importedData) return;
        try {
            if (importedData.profile) {
                await updateProfile(importedData.profile);
            }
            await Promise.all([
                ...importedData.skills.map((s: any) => createSkill(s)),
                ...importedData.experience.map((e: any) => createExperience(e)),
                ...importedData.education.map((e: any) => createEducation(e))
            ]);
            addToast("All data imported successfully!", "success");
            setShowReviewModal(false);
            setImportedData(null);
        } catch (e) {
            addToast("Partial import failure.", "error");
        }
    };

    const formatDateForInput = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    };

    // If login represents client, redirect to client portal component
    if (isAuthenticated && user?.role === 'client') {
        return <ClientDashboardContent user={user} handleLogout={handleLogout} addToast={addToast} />;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-955 p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-300">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/20">
                            <LayoutDashboard size={32} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Client & Admin Portal</h2>
                        <p className="text-slate-500 text-sm">Sign in to manage projects or access the portfolio admin panel</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Email</label>
                            <input type="email" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center ml-1 mb-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block">Password</label>
                                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-semibold text-blue-605 hover:text-blue-700 hover:underline">Forgot Password?</button>
                            </div>
                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" />
                        </div>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-655 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-650/40 transition-all text-sm">
                            Sign In
                        </button>
                    </form>
                </div>

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
                            <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                                <h3 className="text-xl font-bold">Forgot Password</h3>
                                <button
                                    onClick={() => {
                                        setShowForgotModal(false);
                                        setForgotStep('email');
                                    }}
                                    className="text-slate-400 hover:text-slate-655"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            {forgotStep === 'email' ? (
                                <form onSubmit={handleSendForgotOtp} className="space-y-4">
                                    <p className="text-xs text-slate-550">
                                        Enter your registered email address. We will send a 6-digit OTP code to verify your identity.
                                    </p>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="px-5 py-2 text-slate-505 font-bold text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isForgotSubmitting}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2"
                                        >
                                            {isForgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            Send OTP
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                                    <p className="text-xs text-slate-550">
                                        We sent a 6-digit OTP to <strong>{forgotEmail}</strong>. Enter it below along with your new password.
                                    </p>
                                    <div>
                                        <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">6-Digit OTP</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm font-semibold tracking-widest text-center"
                                            value={forgotOtp}
                                            onChange={e => setForgotOtp(e.target.value)}
                                            placeholder="000000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                            value={forgotNewPassword}
                                            onChange={e => setForgotNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                            value={forgotConfirmPassword}
                                            onChange={e => setForgotConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setForgotStep('email')}
                                            className="px-5 py-2 text-slate-505 font-bold text-sm"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isForgotSubmitting}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2"
                                        >
                                            {isForgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            Reset Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-505 gap-2">
                <Loader2 className="animate-spin" /> Loading Admin Suite...
            </div>
        );
    }

    const totalUnreadCount = clients.reduce((acc, cli) => acc + (cli.projects?.reduce((pAcc: number, p: any) => pAcc + (p.unreadCount || 0), 0) || 0), 0);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:relative`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">Admin Suite</h1>
                            <span className="text-[10px] font-extrabold text-blue-605 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Manager</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)] pb-24">
                    <SidebarItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    <Link href="/admin/clients" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <Briefcase size={20} />
                        <span>Client Hub</span>
                        {totalUnreadCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500 text-white rounded-full leading-none flex items-center justify-center shrink-0">
                                {totalUnreadCount}
                            </span>
                        )}
                        <ExternalLink size={14} className={totalUnreadCount > 0 ? "opacity-50" : "ml-auto opacity-50"} />
                    </Link>
                    <SidebarItem icon={DollarSign} label="Financial Suite" active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
                    {user?.role === 'admin' && (
                        <SidebarItem icon={Lock} label="Staff Accounts" active={activeTab === 'view_only_admins'} onClick={() => setActiveTab('view_only_admins')} />
                    )}
                    <SidebarItem icon={Award} label="Skills & Certs" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
                    <SidebarItem icon={GraduationCap} label="Experience & Edu" active={activeTab === 'experience'} onClick={() => setActiveTab('experience')} />

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                    <Link href="/admin/github" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <Github size={20} className="text-purple-600 dark:text-purple-500" />
                        <span>GitHub Sync</span>
                        <ExternalLink size={14} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/works" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <FolderOpen size={20} />
                        <span>Showcase Works</span>
                        <ExternalLink size={14} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/blogs" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <BookOpen size={20} />
                        <span>Manage Blogs</span>
                        <ExternalLink size={14} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/admin/outreach" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <Send size={20} />
                        <span>Outreach Hub</span>
                        <ExternalLink size={14} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/admin/reports" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                        <ShieldAlert size={20} className="text-red-500" />
                        <span>System Reports</span>
                        <ExternalLink size={14} className="ml-auto opacity-50" />
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                    <button onClick={() => setShowChangePasswordModal(true)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold transition-colors text-sm">
                        <Lock size={20} />
                        <span>Change Password</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-650 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors text-sm">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Admin Panels */}
            <main className="flex-1 min-w-0 overflow-auto h-screen relative">
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-650 dark:text-slate-450">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-extrabold text-slate-905 dark:text-white capitalize">
                            {activeTab === 'financials' ? "Financial Summary" : activeTab === 'skills' ? "Skills & Certifications" : activeTab === 'experience' ? "Work & Education history" : activeTab === 'view_only_admins' ? "Staff Accounts (View-Only)" : activeTab}
                        </h2>
                    </div>
                    {activeTab === 'profile' && user?.role !== 'view_only_admin' && (
                        <button onClick={() => setShowResumeModal(true)} className="flex bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-lg items-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                            <Sparkles size={16} />
                            <span>Auto-Fill Data</span>
                        </button>
                    )}
                </header>

                <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && profileForm && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-8 space-y-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b dark:border-slate-700">
                                <h3 className="text-lg font-bold">Personal Information</h3>
                                {user?.role !== 'view_only_admin' && (
                                    <button onClick={saveProfile} className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"><Save size={16} /> Save Changes</button>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Input label="Full Name" value={profileForm.name} onChange={v => setProfileForm({ ...profileForm, name: v })} />
                                    <Input label="Current Role" value={profileForm.currentRole} onChange={v => setProfileForm({ ...profileForm, currentRole: v })} />
                                    <Input label="Current Company (Leave empty if Freelance/Open to Work)" value={profileForm.currentCompany || ''} onChange={v => setProfileForm({ ...profileForm, currentCompany: v })} />
                                    <Input label="Current Company URL" value={profileForm.currentCompanyUrl || ''} onChange={v => setProfileForm({ ...profileForm, currentCompanyUrl: v })} />
                                    <Input label="Location" value={profileForm.location || ''} onChange={v => setProfileForm({ ...profileForm, location: v })} />
                                    <Input
                                        label="Roles (comma separated)"
                                        value={Array.isArray(profileForm.roles) ? profileForm.roles.join(', ') : profileForm.roles}
                                        onChange={v => setProfileForm({ ...profileForm, roles: v.split(',').map(s => s.trim()) })}
                                    />
                                    <Input label="Email Address" value={profileForm.email} onChange={v => setProfileForm({ ...profileForm, email: v })} />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FileUploader label="Photo (Light)" value={profileForm.photoLightUrl || ''} onChange={(v: string) => {
                                            const newProfile = { ...profileForm, photoLightUrl: v };
                                            setProfileForm(newProfile);
                                            updateProfile(newProfile);
                                        }} folder="photos" />
                                        <FileUploader label="Photo (Dark)" value={profileForm.photoDarkUrl || ''} onChange={(v: string) => {
                                            const newProfile = { ...profileForm, photoDarkUrl: v };
                                            setProfileForm(newProfile);
                                            updateProfile(newProfile);
                                        }} folder="photos" />
                                    </div>
                                    <Input label="Phone Number" value={profileForm.phone} onChange={(v: string) => setProfileForm({ ...profileForm, phone: v })} />
                                    <FileUploader label="Resume URL" value={profileForm.resumeUrl} onChange={(v: string) => {
                                        const newProfile = { ...profileForm, resumeUrl: v };
                                        setProfileForm(newProfile);
                                        updateProfile(newProfile);
                                    }} folder="resumes" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Professional Summary</label>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-4 h-32 focus:ring-2 ring-blue-500 outline-none transition-all text-sm" value={profileForm.summary} onChange={e => setProfileForm({ ...profileForm, summary: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase">Social Media</h4>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <Input label="LinkedIn" value={profileForm.linkedin} onChange={v => setProfileForm({ ...profileForm, linkedin: v })} />
                                        <Input label="GitHub" value={profileForm.github} onChange={v => setProfileForm({ ...profileForm, github: v })} />
                                        <Input label="Twitter/X" value={profileForm.twitter} onChange={v => setProfileForm({ ...profileForm, twitter: v })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* STAFF ACCOUNTS TAB (ONLY MAIN ADMIN) */}
                    {activeTab === 'view_only_admins' && user?.role === 'admin' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Add Staff Account */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    Create Staff Account (View-Only Admin)
                                </h3>
                                <form onSubmit={handleAddStaffSubmit} className="grid md:grid-cols-2 gap-4 items-end">
                                    <Input
                                        label="Name"
                                        value={staffForm.name}
                                        onChange={(v) => setStaffForm({ ...staffForm, name: v })}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={staffForm.email}
                                        onChange={(v) => setStaffForm({ ...staffForm, email: v })}
                                    />
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isAddingStaff}
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-500/10"
                                        >
                                            {isAddingStaff ? "Creating..." : "Add Staff Account"}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Staff Accounts List */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Staff Accounts</h3>
                                {isLoadingViewOnlyAdmins ? (
                                    <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>
                                ) : viewOnlyAdmins.length === 0 ? (
                                    <p className="text-slate-405 dark:text-slate-500 text-sm italic text-center py-6">No view-only staff accounts configured.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-250 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Email</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Password Status</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Added Date</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {viewOnlyAdmins.map((staff) => (
                                                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{staff.name}</td>
                                                        <td className="px-6 py-4">{staff.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                                staff.must_reset_password
                                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-450"
                                                                    : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-450"
                                                            }`}>
                                                                {staff.must_reset_password ? "Pending Reset" : "Active / Configured"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-slate-550 dark:text-slate-500">
                                                            {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleDeleteStaff(staff.id)}
                                                                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 text-red-650 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition-all"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FINANCIAL TAB */}
                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            {isLoadingFinancials ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-605" /></div>
                            ) : financials ? (
                                <>
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-xl flex items-center justify-center text-green-600"><DollarSign size={24} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Revenue</p>
                                                <h4 className="text-2xl font-extrabold mt-0.5">₹{(financials.lifetimeRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-105 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-605"><DollarSign size={24} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yearly Revenue</p>
                                                <h4 className="text-2xl font-extrabold mt-0.5">₹{(financials.yearlyRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-105 dark:bg-indigo-955/30 rounded-xl flex items-center justify-center text-indigo-650"><DollarSign size={24} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                                                <h4 className="text-2xl font-extrabold mt-0.5">₹{(financials.monthlyRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Date Range Filter */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 shadow-sm space-y-4">
                                        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Custom Range Calculator</h3>
                                        <form onSubmit={handleCustomFinancialsSubmit} className="flex flex-col sm:flex-row items-end gap-4">
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-500">Start Date</label>
                                                    <input type="date" required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-sm" value={customDates.startDate} onChange={e => setCustomDates({ ...customDates, startDate: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-500">End Date</label>
                                                    <input type="date" required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-sm" value={customDates.endDate} onChange={e => setCustomDates({ ...customDates, endDate: e.target.value })} />
                                                </div>
                                            </div>
                                            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/10 text-sm">
                                                Calculate
                                            </button>
                                        </form>
                                        {financials.customRevenue !== undefined && customDates.startDate && (
                                            <div className="p-4 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-650">Revenue between {customDates.startDate} and {customDates.endDate}:</span>
                                                <strong className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                                                    ₹{(financials.customRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </strong>
                                            </div>
                                        )}
                                    </div>

                                    {/* Most Valuable Clients and General Stats */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {/* Most Valuable Clients Table */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 shadow-sm md:col-span-2 space-y-4">
                                            <h3 className="font-bold text-base text-slate-905 dark:text-white">Most Valuable Customers</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            <th className="py-3">Client/Company</th>
                                                            <th className="py-3 text-center">Completed Projects</th>
                                                            <th className="py-3 text-right">Total Cost Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                                        {financials.mostValuableClients?.map((cli: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{cli.company}</td>
                                                                <td className="py-3 text-center text-slate-500">{cli.projectCount}</td>
                                                                <td className="py-3 text-right font-extrabold text-slate-900 dark:text-white">₹{(cli.revenue / 100).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                        {(!financials.mostValuableClients || financials.mostValuableClients.length === 0) && (
                                                            <tr>
                                                                <td colSpan={3} className="py-6 text-center text-slate-400 italic">No project data to compile.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* General KPIs */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 shadow-sm space-y-6">
                                            <h3 className="font-bold text-base text-slate-905 dark:text-white">Key Performance Indicators</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Onboarded Clients</span>
                                                    <strong className="text-lg font-extrabold">{financials.stats.totalClients}</strong>
                                                </div>
                                                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Logged Projects</span>
                                                    <strong className="text-lg font-extrabold">{financials.stats.totalProjects}</strong>
                                                </div>
                                                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Avg. Projects per Client</span>
                                                    <strong className="text-lg font-extrabold text-blue-600 dark:text-blue-450">{financials.stats.averageProjectsPerClient}</strong>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Avg. Value per Project</span>
                                                    <strong className="text-lg font-extrabold text-green-600 dark:text-green-400">
                                                        ₹{(financials.stats.averageProjectCost / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center py-12 text-slate-500">Failed to retrieve financial metrics.</p>
                            )}
                        </div>
                    )}

                    {/* SKILLS TAB */}
                    {activeTab === 'skills' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {user?.role !== 'view_only_admin' && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4">Add New Skill</h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input
                                            className="w-full md:flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-purple-500 text-sm"
                                            placeholder="Skill Name (e.g. React Native)"
                                            value={newSkill.name}
                                            onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                                        />
                                        <IconPicker
                                            value={newSkill.icon}
                                            onChange={v => setNewSkill({ ...newSkill, icon: v })}
                                        />
                                        <button onClick={addSkill} className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 md:py-0 font-bold rounded-xl hover:bg-purple-700 text-sm">Add</button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {data.skills.map(s => (
                                    <div key={s.id} className="group flex items-center gap-3 bg-white dark:bg-slate-800 pl-4 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-500/50 transition-all">
                                        <i className={`${s.icon} text-lg text-slate-550 group-hover:text-purple-505 transition-colors`}></i>
                                        <span className="font-semibold text-sm">{s.name}</span>
                                        {user?.role !== 'view_only_admin' && (
                                            <button onClick={() => handleSave(() => deleteSkill(s.id), "Skill deleted")} className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"><X size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CERTIFICATIONS TAB */}
                    {activeTab === 'skills' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Certifications</h3>
                                {user?.role !== 'view_only_admin' && (
                                    <button onClick={() => { setEditingCertification({ icon: 'devicon-google-plain' }); setIsCreatingCert(true); }} className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm"><Plus size={16} /> Add Certification</button>
                                )}
                            </div>

                            {editingCertification ? (
                                <EditorLayout title={isCreatingCert ? "Add Certification" : "Edit Certification"} onCancel={() => setEditingCertification(null)} onSave={saveCertification}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Name" value={editingCertification.name} onChange={v => setEditingCertification({ ...editingCertification, name: v })} />
                                        <Input label="Issuer" value={editingCertification.issuer} onChange={v => setEditingCertification({ ...editingCertification, issuer: v })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="w-full min-w-0">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Date</label>
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all text-sm" value={editingCertification.date || ''} onChange={e => setEditingCertification({ ...editingCertification, date: e.target.value })} />
                                        </div>
                                        <Input label="Credential URL" value={editingCertification.url} onChange={v => setEditingCertification({ ...editingCertification, url: v })} />
                                    </div>
                                    <div className="w-full md:col-span-2">
                                        <label className="text-xs font-bold text-slate-505 uppercase ml-1 mb-1 block">Icon</label>
                                        <IconPicker
                                            value={editingCertification.icon || ''}
                                            onChange={v => setEditingCertification({ ...editingCertification, icon: v })}
                                        />
                                    </div>
                                </EditorLayout>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.certifications?.map(c => (
                                        <div key={c.id} className="relative group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-202 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:border-purple-500/50 transition-all">
                                            <div className="w-12 h-12 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-2xl">
                                                <i className={c.icon}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">{c.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-450">{c.issuer}</p>
                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                                    <span>{c.date}</span>
                                                    {c.url && (
                                                        <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-550 hover:underline flex items-center gap-1">
                                                            View <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            {user?.role !== 'view_only_admin' && (
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingCertification(c); setIsCreatingCert(false); }} className="text-blue-555 text-blue-500 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleSave(() => deleteCertification(c.id), "Certification deleted")} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXPERIENCE TAB */}
                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Work Experience</h3>
                                {user?.role !== 'view_only_admin' && (
                                    <button onClick={() => { setEditingExperience({}); setIsCreatingExp(true); }} className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm"><Plus size={16} /> Add Role</button>
                                )}
                            </div>

                            {editingExperience ? (
                                <EditorLayout title="Edit Experience" onCancel={() => setEditingExperience(null)} onSave={saveExp}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Role" value={editingExperience.role} onChange={v => setEditingExperience({ ...editingExperience, role: v })} />
                                        <Input label="Company" value={editingExperience.company} onChange={v => setEditingExperience({ ...editingExperience, company: v })} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="w-full min-w-0">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Start Date</label>
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-orange-500 transition-all text-sm" value={formatDateForInput(editingExperience.start_date)} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} />
                                        </div>
                                        <div className="w-full min-w-0">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-xs font-bold text-slate-505 uppercase ml-1">End Date</label>
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none hover:text-orange-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!editingExperience.end_date}
                                                        onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.checked ? undefined : new Date().toISOString().split('T')[0] })}
                                                        className="accent-orange-650 w-4 h-4 cursor-pointer rounded"
                                                    />
                                                    Present
                                                </label>
                                            </div>
                                            {!editingExperience.end_date ? (
                                                <div className="w-full h-[46px] bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-450 font-bold text-sm gap-2 px-4">
                                                    <div className="w-2 h-2 bg-orange-505 rounded-full animate-pulse" />
                                                    Present
                                                </div>
                                            ) : (
                                                <input
                                                    type="date"
                                                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-202 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-orange-500 transition-all h-[46px] text-sm"
                                                    value={formatDateForInput(editingExperience.end_date)}
                                                    onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Description</label>
                                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl p-4 h-32 outline-none focus:ring-2 ring-orange-505 text-sm" value={editingExperience.description} onChange={e => setEditingExperience({ ...editingExperience, description: e.target.value })} />
                                    </div>
                                </EditorLayout>
                            ) : (
                                data.experience.map(exp => (
                                    <div key={exp.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 flex justify-between items-start shadow-sm">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{exp.role}</h4>
                                            <p className="text-orange-600 dark:text-orange-400 font-semibold">{exp.company}</p>
                                            <p className="text-xs text-slate-505 mt-1">{formatDateRange({ start: exp.start_date, end: exp.end_date })}</p>
                                        </div>
                                        {user?.role !== 'view_only_admin' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingExperience(exp); setIsCreatingExp(false); }} className="text-blue-500 p-2"><Edit2 size={18} /></button>
                                                <button onClick={() => handleSave(() => deleteExperience(exp.id), "Experience deleted")} className="text-red-500 p-2"><Trash2 size={18} /></button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Education</h3>
                                {user?.role !== 'view_only_admin' && (
                                    <button onClick={() => { setEditingEducation({}); setIsCreatingEdu(true); }} className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm"><Plus size={16} /> Add Education</button>
                                )}
                            </div>
                            {editingEducation ? (
                                <EditorLayout title="Edit Education" onCancel={() => setEditingEducation(null)} onSave={saveEdu}>
                                    <Input label="Degree" value={editingEducation.degree} onChange={v => setEditingEducation({ ...editingEducation, degree: v })} />
                                    <Input label="School" value={editingEducation.school} onChange={v => setEditingEducation({ ...editingEducation, school: v })} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="w-full min-w-0">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Start Date</label>
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-202 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-green-500 transition-all text-sm" value={formatDateForInput(editingEducation.start_date)} onChange={e => setEditingEducation({ ...editingEducation, start_date: e.target.value })} />
                                        </div>
                                        <div className="w-full min-w-0">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-xs font-bold text-slate-505 uppercase ml-1">End Date</label>
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-505 cursor-pointer select-none hover:text-green-650 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!editingEducation.end_date}
                                                        onChange={e => setEditingEducation({ ...editingEducation, end_date: e.target.checked ? undefined : new Date().toISOString().split('T')[0] })}
                                                        className="accent-green-650 w-4 h-4 cursor-pointer rounded"
                                                    />
                                                    Present
                                                </label>
                                            </div>
                                            {!editingEducation.end_date ? (
                                                <div className="w-full h-[46px] bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-455 font-bold text-sm gap-2 px-4">
                                                    <div className="w-2 h-2 bg-green-505 rounded-full animate-pulse" />
                                                    Present
                                                </div>
                                            ) : (
                                                <input
                                                    type="date"
                                                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-202 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-green-505 transition-all h-[46px] text-sm"
                                                    value={formatDateForInput(editingEducation.end_date)}
                                                    onChange={e => setEditingEducation({ ...editingEducation, end_date: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <Input label="Grade" value={editingEducation.grade} onChange={v => setEditingEducation({ ...editingEducation, grade: v })} />
                                </EditorLayout>
                            ) : (
                                data.education.map(edu => (
                                    <div key={edu.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-202 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-905 dark:text-white">{edu.degree}</h4>
                                            <p className="text-green-600 dark:text-green-405 font-medium">{edu.school}</p>
                                            <p className="text-xs text-slate-500 mt-1">{formatDateRange({ start: edu.start_date, end: edu.end_date })}</p>
                                        </div>
                                        {user?.role !== 'view_only_admin' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingEducation(edu); setIsCreatingEdu(false); }} className="text-blue-500 p-2"><Edit2 size={18} /></button>
                                                <button onClick={() => handleSave(() => deleteEducation(edu.id), "Education deleted")} className="text-red-500 p-2"><Trash2 size={18} /></button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Resume upload dialog */}
            {showResumeModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">Resume Parsing</h3>
                        <textarea
                            className="w-full h-64 bg-slate-50 dark:bg-slate-955 border p-4 rounded-xl text-sm"
                            placeholder="Paste your resume text here..."
                            value={resumeText}
                            onChange={e => setResumeText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setShowResumeModal(false)} className="px-4 py-2 font-bold text-slate-505 text-sm">Cancel</button>
                            <button onClick={handleResumeAnalysis} disabled={isAnalyzingResume} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm">
                                {isAnalyzingResume ? 'Analyzing...' : 'Analyze'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin First-Login Password Reset Modal */}
            {adminMustReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <Lock className="w-12 h-12 text-blue-605 mx-auto mb-3" />
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset Password</h3>
                            <p className="text-slate-500 text-sm mt-1">For security, you must update your temporary password before proceeding.</p>
                        </div>
                        <form onSubmit={handleAdminPasswordResetSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                    value={adminResetPasswords.password}
                                    onChange={e => setAdminResetPasswords({ ...adminResetPasswords, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-550 uppercase">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    placeholder="••••••••"
                                    value={adminResetPasswords.confirm}
                                    onChange={e => setAdminResetPasswords({ ...adminResetPasswords, confirm: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isAdminResetting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center text-sm"
                            >
                                {isAdminResetting ? "Updating..." : "Save Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                            <h3 className="text-xl font-bold">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowChangePasswordModal(false);
                                    setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                }}
                                className="text-slate-400 hover:text-slate-655"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.currentPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.newPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-550 uppercase ml-1 mb-1 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 text-sm"
                                    value={changePasswordForm.confirmPassword}
                                    onChange={e => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChangePasswordModal(false);
                                        setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                    className="px-5 py-2 text-slate-550 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isChangePasswordSubmitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-sm flex items-center gap-2"
                                >
                                    {isChangePasswordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export const AdminPage = () => (
    <AdminContent />
);
