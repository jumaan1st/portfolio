"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Trash2, Plus, Save, X, Edit2, Loader2, SaveAll, Sparkles,
    LayoutDashboard, User, FolderOpen, PenTool, BookOpen, Briefcase, GraduationCap,
    LogOut, Menu, ChevronRight, Search, Upload, ExternalLink, RefreshCw, CheckCircle, Award, ShieldAlert, Send
} from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "@/components/PortfolioContext";
import { Project } from "@/data/portfolioData";
import { useToast } from "@/components/ui/Toast";
import { IconPicker } from "@/components/ui/IconPicker";
import { BLOG_TAGS } from "@/data/constants";
import { FileUploader } from "@/components/FileUploader";
import { extractFirstImage, formatDateRange } from "@/lib/utils";

// --- Sub-components (could be separate files, kept here for cohesion during migration) ---
// --- Sub-components (could be separate files, kept here for cohesion during migration) ---


const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        <Icon size={20} />
        <span>{label}</span>
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

const AdminContent: React.FC = () => {
    const {
        data,
        projectsMeta,
        isAuthenticated,
        setIsAuthenticated,
        fetchAdminData,
        createProject, updateProject, deleteProject,
        createSkill, deleteSkill,
        createExperience, updateExperience, deleteExperience,
        updateProfile,
        createEducation, updateEducation, deleteEducation,
        createCertification, updateCertification, deleteCertification,
        fetchAdminProjects, fetchAdminBlogs, fetchAdminCertifications
    } = usePortfolio();

    const { addToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'skills' | 'experience' | 'education' | 'blogs' | 'certifications'>('profile');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Date helper
    const formatDateForInput = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    };
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSyncingGithub, setIsSyncingGithub] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 10;
    const lastFetchedPage = useRef<number | null>(null);

    // Fetch Admin Data on Auth
    useEffect(() => {
        if (isAuthenticated) {
            // Prevent duplicate fetch for the same page (React Strict Mode fix)
            if (lastFetchedPage.current === currentPage) return;

            const load = async () => {
                // setIsLoadingData(true); // Don't block UI with global loading
                lastFetchedPage.current = currentPage;
                // Fetch Admin Data (skip projects as they are managed in /projects now)
                await fetchAdminData();
                // setIsLoadingData(false);
            };
            load();
        }
    }, [isAuthenticated, currentPage]); // Re-fetch when page changes

    // Lazy Load Data based on Active Tab
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadTab = async () => {
            switch (activeTab) {
                case 'projects': await fetchAdminProjects(); break;
                case 'blogs': await fetchAdminBlogs(); break;
                // Skills, Experience, Education are now loaded in bootstrap 'admin' mode
                case 'certifications': await fetchAdminCertifications(); break; // Check if we want these lazy too? User didn't specify certifications. Let's keep Certs lazy or add to bootstrap?
                // Actually user only said "profile experiance educatio n and skilss". 
                // Certifications is small too, let's assume we can lazily load it or add it. 
                // The bootstrap ALREADY fetches certifications (line 51 in bootstrap/route.ts) unconditionally!
                // So certifications are ALREADY in data. We just didn't realize it.
                // Wait, let's check bootstrap again.
                // "const certificationsQuery = db.select().from(certifications)..."
                // Yes, certifications are ALWAYS fetched. So we don't need lazy loader for certifications either!
            }
        };
        loadTab();
    }, [activeTab, isAuthenticated]);

    // Forms State
    const [editingExperience, setEditingExperience] = useState<Partial<typeof data.experience[0]> | null>(null);
    const [isCreatingExp, setIsCreatingExp] = useState(false);

    const [editingEducation, setEditingEducation] = useState<Partial<typeof data.education[0]> | null>(null);
    const [isCreatingEdu, setIsCreatingEdu] = useState(false);

    const [newSkill, setNewSkill] = useState({ name: '', icon: 'devicon-react-original' });
    const [newCertification, setNewCertification] = useState({ name: '', issuer: '', url: '', date: '', icon: 'devicon-google-plain' });
    const [editingCertification, setEditingCertification] = useState<Partial<typeof data.certifications[0]> | null>(null);
    const [isCreatingCert, setIsCreatingCert] = useState(false);
    const [profileForm, setProfileForm] = useState<typeof data.profile | null>(null);

    // AI & Resume State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeText, setResumeText] = useState("");
    const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
    const [importedData, setImportedData] = useState<any>(null);

    const [showReviewModal, setShowReviewModal] = useState(false);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Initialize profile form
    useEffect(() => {
        if (data?.profile) {
            const safeProfile = { ...data.profile };

            // Ensure roles is array
            if (typeof safeProfile.roles === 'string') {
                try { safeProfile.roles = JSON.parse(safeProfile.roles); } catch (e) { safeProfile.roles = []; }
            }
            if (!Array.isArray(safeProfile.roles)) safeProfile.roles = [];

            // Ensure currentlyLearning is array
            if (typeof safeProfile.currentlyLearning === 'string') {
                try { safeProfile.currentlyLearning = JSON.parse(safeProfile.currentlyLearning); } catch (e) { safeProfile.currentlyLearning = []; }
            }
            if (!Array.isArray(safeProfile.currentlyLearning)) safeProfile.currentlyLearning = [];

            setProfileForm(safeProfile);
        }
    }, [data]);

    // --- Actions ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            if (res.ok) {
                setIsAuthenticated(true);
                addToast("Welcome back, Admin!", "success");
            } else {
                const d = await res.json();
                addToast(d.error || "Invalid Credentials", "error");
            }
        } catch (error) {
            addToast("Login failed. Check console.", "error");
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setIsAuthenticated(false);
        addToast("Logged out successfully", "info");
    };

    const handleSave = async (
        action: () => Promise<void>,
        successMsg: string
    ) => {
        try {
            await action();
            // Show Modal instead of Toast for success
            setSuccessMessage(successMsg);
            setShowSuccessModal(true);
            return true;
        } catch (e) {
            console.error(e);
            addToast("Action failed. Check console.", "error");
            return false;
        }
    };

    // Profile
    const saveProfile = () => handleSave(async () => {
        if (profileForm) await updateProfile(profileForm);
    }, "Profile updated!");

    const handleGitHubSync = async () => {
        setIsSyncingGithub(true);
        try {
            const res = await fetch('/api/admin/github/sync', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                // Determine message based on response (created vs updated)
                const msg = data.message || "README Updated!";
                setSuccessMessage(msg);
                setShowSuccessModal(true);
            } else {
                addToast(data.error || "Failed to sync to GitHub", "error");
            }
        } catch (e) {
            addToast("Network error during sync", "error");
        } finally {
            setIsSyncingGithub(false);
        }
    };



    // Experience
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



    // Education
    const saveEdu = async () => {
        if (!editingEducation) return;
        const success = await handleSave(async () => {
            if (isCreatingEdu) await createEducation(editingEducation);
            else if (editingEducation.id) await updateEducation(editingEducation.id, editingEducation);
        }, "Education saved!");
        if (success) setEditingEducation(null);
    };

    // AI & Resume Logic ... (Reuse existing logic but with toasts)
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
                setProfileForm(prev => ({ ...prev, ...importedData.profile }));
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-300">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/20">
                            <LayoutDashboard size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Portal</h2>
                        <p className="text-slate-500">Sign in to manage your portfolio</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Email</label>
                            <input type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="admin@example.com" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Password</label>
                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" />
                        </div>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all">
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="animate-spin" /> Loading Admin Data...
            </div>
        );
    }

    // --- Main Dashboard Layout ---

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Portfolio</h1>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
                    <SidebarItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    <Link href="/projects" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <FolderOpen size={20} />
                        <span>Manage Projects</span>
                        <ExternalLink size={16} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/blogs" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <BookOpen size={20} />
                        <span>Manage Blogs</span>
                        <ExternalLink size={16} className="ml-auto opacity-50" />
                    </Link>
                    <Link href="/admin/outreach" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Send size={20} />
                        <span>Outreach Hub</span>
                        <ExternalLink size={16} className="ml-auto opacity-50" />
                    </Link>
                    <SidebarItem icon={PenTool} label="Skills" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
                    <SidebarItem icon={Award} label="Certifications" active={activeTab === 'certifications'} onClick={() => setActiveTab('certifications')} />
                    <SidebarItem icon={Briefcase} label="Experience" active={activeTab === 'experience'} onClick={() => setActiveTab('experience')} />
                    <SidebarItem icon={GraduationCap} label="Education" active={activeTab === 'education'} onClick={() => setActiveTab('education')} />
                    <Link href="/admin/reports" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ShieldAlert size={20} />
                        <span>System Reports</span>
                        <ExternalLink size={16} className="ml-auto opacity-50" />
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto h-screen relative">

                {/* Header (Mobile Toggle + Quick Actions) */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600 dark:text-slate-400">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowResumeModal(true)} className="flex bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-lg items-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                            <Sparkles size={16} />
                            <span className="hidden xs:inline">Auto-Fill Data</span>
                            <span className="inline xs:hidden">AI</span>
                        </button>
                    </div>
                </header>

                <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

                    {/* Tab Content */}

                    {/* PROFILE */}
                    {activeTab === 'profile' && profileForm && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-8 space-y-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b dark:border-slate-700">
                                <h3 className="text-lg font-bold">Personal Information</h3>
                                <button onClick={saveProfile} className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"><Save size={16} /> Save Changes</button>
                                <button onClick={handleGitHubSync} disabled={isSyncingGithub} className="w-full md:w-auto bg-slate-800 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors border border-slate-700">
                                    {isSyncingGithub ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    Sync to GitHub
                                </button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Input label="Full Name" value={profileForm.name} onChange={v => setProfileForm({ ...profileForm, name: v })} />
                                    <Input label="Current Role" value={profileForm.currentRole} onChange={v => setProfileForm({ ...profileForm, currentRole: v })} />
                                    <Input
                                        label="Roles (comma separated)"
                                        value={Array.isArray(profileForm.roles) ? profileForm.roles.join(', ') : profileForm.roles}
                                        onChange={v => setProfileForm({ ...profileForm, roles: v.split(',').map(s => s.trim()) })}
                                    />
                                    <Input label="Email Address" value={profileForm.email} onChange={v => setProfileForm({ ...profileForm, email: v })} />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FileUploader label="Photo (Light)" value={profileForm.photoLightUrl || ''} onChange={(v: string) => setProfileForm({ ...profileForm, photoLightUrl: v })} folder="photos" />
                                        <FileUploader label="Photo (Dark)" value={profileForm.photoDarkUrl || ''} onChange={(v: string) => setProfileForm({ ...profileForm, photoDarkUrl: v })} folder="photos" />
                                    </div>
                                    <Input label="Phone Number" value={profileForm.phone} onChange={(v: string) => setProfileForm({ ...profileForm, phone: v })} />
                                    <FileUploader label="Resume URL" value={profileForm.resumeUrl} onChange={(v: string) => setProfileForm({ ...profileForm, resumeUrl: v })} folder="resumes" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Professional Summary</label>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-32 focus:ring-2 ring-blue-500 outline-none transition-all" value={profileForm.summary} onChange={e => setProfileForm({ ...profileForm, summary: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase">Social Media</h4>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <Input label="LinkedIn" value={profileForm.linkedin} onChange={v => setProfileForm({ ...profileForm, linkedin: v })} />
                                        <Input label="GitHub" value={profileForm.github} onChange={v => setProfileForm({ ...profileForm, github: v })} />
                                        <Input label="Twitter/X" value={profileForm.twitter} onChange={v => setProfileForm({ ...profileForm, twitter: v })} />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4 pt-4 border-t dark:border-slate-700">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase flex justify-between items-center">
                                        Currently Learning
                                        <button onClick={() => setProfileForm({
                                            ...profileForm,
                                            currentlyLearning: [...(profileForm.currentlyLearning || []), { topic: '', status: 'In Progress' }]
                                        })} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </h4>

                                    <div className="space-y-3">
                                        {(profileForm.currentlyLearning || []).map((item, idx) => (
                                            <div key={idx} className="flex flex-col md:flex-row gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                                                    <input placeholder="Topic" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                                                        value={item.topic} onChange={e => {
                                                            const newList = [...(profileForm.currentlyLearning || [])];
                                                            newList[idx].topic = e.target.value;
                                                            setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                        }}
                                                    />
                                                    <input placeholder="Category" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                                                        value={item.category || ''} onChange={e => {
                                                            const newList = [...(profileForm.currentlyLearning || [])];
                                                            newList[idx].category = e.target.value;
                                                            setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                        }}
                                                    />
                                                    <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                                                        value={item.status || 'In Progress'} onChange={e => {
                                                            const newList = [...(profileForm.currentlyLearning || [])];
                                                            newList[idx].status = e.target.value;
                                                            setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                        }}
                                                    >
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Planned">Planned</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                    <input placeholder="Reference URL" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                                                        value={item.referenceUrl || ''} onChange={e => {
                                                            const newList = [...(profileForm.currentlyLearning || [])];
                                                            newList[idx].referenceUrl = e.target.value;
                                                            setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                        }}
                                                    />
                                                    <input placeholder="Level (e.g. Beginner)" className="md:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                                                        value={item.level || ''} onChange={e => {
                                                            const newList = [...(profileForm.currentlyLearning || [])];
                                                            newList[idx].level = e.target.value;
                                                            setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                        }}
                                                    />
                                                </div>
                                                <button onClick={() => {
                                                    const newList = [...(profileForm.currentlyLearning || [])];
                                                    newList.splice(idx, 1);
                                                    setProfileForm({ ...profileForm, currentlyLearning: newList });
                                                }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors self-start md:self-center">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!profileForm.currentlyLearning || profileForm.currentlyLearning.length === 0) && (
                                            <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                No learning items added.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* PROJECTS REMOVED - Managed in /projects */}

                    {/* BLOGS */}


                    {/* OUTREACH */}
                    {/* OUTREACH - Moved to /admin/outreach */}



                    {/* SKILLS */}
                    {activeTab === 'skills' && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="font-bold text-lg mb-4">Add New Skill</h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        className="w-full md:flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-purple-500"
                                        placeholder="Skill Name (e.g. React Native)"
                                        value={newSkill.name}
                                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                                    />
                                    <IconPicker
                                        value={newSkill.icon}
                                        onChange={v => setNewSkill({ ...newSkill, icon: v })}
                                    />
                                    <button onClick={addSkill} className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 md:py-0 font-bold rounded-xl hover:bg-purple-700">Add</button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {data.skills.map(s => (
                                    <div key={s.id} className="group flex items-center gap-3 bg-white dark:bg-slate-800 pl-4 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-500/50 transition-all">
                                        <i className={`${s.icon} text-lg text-slate-500 group-hover:text-purple-500 transition-colors`}></i>
                                        <span className="font-medium">{s.name}</span>
                                        <button onClick={() => handleSave(() => deleteSkill(s.id), "Skill deleted")} className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CERTIFICATIONS */}
                    {activeTab === 'certifications' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Certifications</h3>
                                <button onClick={() => { setEditingCertification({ icon: 'devicon-google-plain' }); setIsCreatingCert(true); }} className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"><Plus size={16} /> Add <span className="hidden sm:inline">Certification</span></button>
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
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all" value={editingCertification.date || ''} onChange={e => setEditingCertification({ ...editingCertification, date: e.target.value })} />
                                        </div>
                                        <Input label="Credential URL" value={editingCertification.url} onChange={v => setEditingCertification({ ...editingCertification, url: v })} />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Icon</label>
                                        <IconPicker
                                            value={editingCertification.icon || ''}
                                            onChange={v => setEditingCertification({ ...editingCertification, icon: v })}
                                        />
                                    </div>
                                </EditorLayout>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.certifications?.map(c => (
                                        <div key={c.id} className="relative group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:border-purple-500/50 transition-all">
                                            <div className="w-12 h-12 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-2xl">
                                                <i className={c.icon}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{c.issuer}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                    <span>{c.date}</span>
                                                    {c.url && (
                                                        <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                                            View <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingCertification(c); setIsCreatingCert(false); }} className="text-blue-500 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit2 size={16} /></button>
                                                <button onClick={() => handleSave(() => deleteCertification(c.id), "Certification deleted")} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXPERIENCE & EDUCATION (Simplified for brevity as structure is similar) */}
                    {activeTab === 'experience' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Work Experience</h3>
                                <button onClick={() => { setEditingExperience({}); setIsCreatingExp(true); }} className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"><Plus size={16} /> Add <span className="hidden sm:inline">Role</span></button>
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
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-orange-500 transition-all" value={formatDateForInput(editingExperience.start_date)} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} />
                                        </div>
                                        <div className="w-full min-w-0">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">End Date</label>
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none hover:text-orange-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!editingExperience.end_date}
                                                        onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.checked ? undefined : new Date().toISOString().split('T')[0] })}
                                                        className="accent-orange-600 w-4 h-4 cursor-pointer rounded"
                                                    />
                                                    Present
                                                </label>
                                            </div>
                                            {!editingExperience.end_date ? (
                                                <div className="w-full h-[46px] bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm gap-2 px-4">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                                    Present
                                                </div>
                                            ) : (
                                                <input
                                                    type="date"
                                                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-orange-500 transition-all h-[46px]"
                                                    value={formatDateForInput(editingExperience.end_date)}
                                                    onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Description</label>
                                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-32 outline-none focus:ring-2 ring-orange-500" value={editingExperience.description} onChange={e => setEditingExperience({ ...editingExperience, description: e.target.value })} />
                                    </div>
                                </EditorLayout>
                            ) : (
                                data.experience.map(exp => (
                                    <div key={exp.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg">{exp.role}</h4>
                                            <p className="text-orange-600 dark:text-orange-400 font-medium">{exp.company}</p>
                                            <p className="text-xs text-slate-500 mt-1">{formatDateRange({ start: exp.start_date, end: exp.end_date })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingExperience(exp); setIsCreatingExp(false); }} className="text-blue-500 p-2"><Edit2 size={18} /></button>
                                            <button onClick={() => handleSave(() => deleteExperience(exp.id), "Experience deleted")} className="text-red-500 p-2"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'education' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xl">Education</h3>
                                <button onClick={() => { setEditingEducation({}); setIsCreatingEdu(true); }} className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"><Plus size={16} /> Add <span className="hidden sm:inline">Education</span></button>
                            </div>
                            {editingEducation ? (
                                <EditorLayout title="Edit Education" onCancel={() => setEditingEducation(null)} onSave={saveEdu}>
                                    <Input label="Degree" value={editingEducation.degree} onChange={v => setEditingEducation({ ...editingEducation, degree: v })} />
                                    <Input label="School" value={editingEducation.school} onChange={v => setEditingEducation({ ...editingEducation, school: v })} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="w-full min-w-0">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Start Date</label>
                                            <input type="date" className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-green-500 transition-all" value={formatDateForInput(editingEducation.start_date)} onChange={e => setEditingEducation({ ...editingEducation, start_date: e.target.value })} />
                                        </div>
                                        <div className="w-full min-w-0">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">End Date</label>
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none hover:text-green-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!editingEducation.end_date}
                                                        onChange={e => setEditingEducation({ ...editingEducation, end_date: e.target.checked ? undefined : new Date().toISOString().split('T')[0] })}
                                                        className="accent-green-600 w-4 h-4 cursor-pointer rounded"
                                                    />
                                                    Present
                                                </label>
                                            </div>
                                            {!editingEducation.end_date ? (
                                                <div className="w-full h-[46px] bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm gap-2 px-4">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    Present
                                                </div>
                                            ) : (
                                                <input
                                                    type="date"
                                                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-green-500 transition-all h-[46px]"
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
                                    <div key={edu.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-lg">{edu.degree}</h4>
                                            <p className="text-green-600 dark:text-green-400">{edu.school}</p>
                                            <p className="text-xs text-slate-500">{formatDateRange({ start: edu.start_date, end: edu.end_date })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingEducation(edu); setIsCreatingEdu(false); }} className="text-blue-500 p-2"><Edit2 size={18} /></button>
                                            <button onClick={() => handleSave(() => deleteEducation(edu.id), "Education deleted")} className="text-red-500 p-2"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* Modals for Resume / AI - Keeping them simple for now, can be extracted */}
            {showResumeModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">Resume Parsing</h3>
                        <textarea
                            className="w-full h-64 bg-slate-50 dark:bg-slate-950 border p-4 rounded-xl"
                            placeholder="Paste your resume text here..."
                            value={resumeText}
                            onChange={e => setResumeText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setShowResumeModal(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                            <button onClick={handleResumeAnalysis} disabled={isAnalyzingResume} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
                                {isAnalyzingResume ? 'Analyzing...' : 'Analyze'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SuccessModal
                isOpen={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
};

// UI Helpers
const Input = ({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) => (
    <div className="w-full min-w-0">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{label}</label>
        <input className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
);

const EditorLayout = ({ title, children, onCancel, onSave }: any) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
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

// Wrapper was removed as ToastProvider is now global
export const AdminPage = () => (
    <AdminContent />
);
