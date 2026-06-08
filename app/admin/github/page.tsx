"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Github, RefreshCw, SaveAll, Loader2, Plus, Eye, ArrowLeft, ArrowRight, Lock, FileText, ChevronLeft, CheckCircle, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { useToast } from "@/components/ui/Toast";
import { marked } from "marked";

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
                    <p className="text-slate-550 font-medium">{message}</p>
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

export default function GitHubSyncPage() {
    const { 
        data, 
        isAuthenticated, 
        isLoading: authLoading,
        fetchAdminData 
    } = usePortfolio();
    
    const router = useRouter();
    const { addToast } = useToast();

    // GitHub Preview States
    const [githubPreview, setGithubPreview] = useState<{ 
        markdown: string, 
        svgs: { 
            headerUrl: string, 
            skillsUrl: string, 
            certsUrl: string,
            headerSvg: string,
            skillsSvg: string,
            certsSvg: string
        } 
    } | null>(null);

    const [isLoadingGithub, setIsLoadingGithub] = useState(false);
    const [isSyncingGithub, setIsSyncingGithub] = useState(false);
    const [githubViewTab, setGithubViewTab] = useState<'svgs' | 'readme'>('svgs');
    
    // Success Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchGithubPreview = useCallback(async () => {
        setIsLoadingGithub(true);
        try {
            const res = await fetch('/api/admin/github/sync');
            const d = await res.json();
            if (res.ok && d.success) {
                setGithubPreview({
                    markdown: d.markdown,
                    svgs: d.svgs
                });
            } else {
                addToast(d.error || "Failed to load GitHub preview", "error");
            }
        } catch (e) {
            addToast("Failed to load GitHub preview", "error");
        } finally {
            setIsLoadingGithub(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/admin");
        } else if (isAuthenticated) {
            fetchGithubPreview();
            fetchAdminData();
        }
    }, [isAuthenticated, authLoading, router, fetchGithubPreview, fetchAdminData]);

    const handleGitHubSync = async () => {
        setIsSyncingGithub(true);
        try {
            const res = await fetch('/api/admin/github/sync', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                const msg = data.message || "README Updated!";
                setSuccessMessage(msg);
                setShowSuccessModal(true);
                fetchGithubPreview(); // Refresh preview after push
            } else {
                addToast(data.error || "Failed to sync to GitHub", "error");
            }
        } catch (e) {
            addToast("Network error during sync", "error");
        } finally {
            setIsSyncingGithub(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-slate-950">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }
    
    if (!isAuthenticated) return null;

    const getReadmeHtml = () => {
        if (!githubPreview) return "";
        let rawHtml = "";
        try {
            rawHtml = marked.parse(githubPreview.markdown) as string;
            rawHtml = rawHtml.replace(/<img[^>]*src="[^"]*header\.svg[^"]*"[^>]*>/gi, `<div class="w-full flex justify-center py-2">${githubPreview.svgs.headerSvg}</div>`);
            rawHtml = rawHtml.replace(/<img[^>]*src="[^"]*skills\.svg[^"]*"[^>]*>/gi, `<div class="w-full flex justify-center py-2">${githubPreview.svgs.skillsSvg}</div>`);
            rawHtml = rawHtml.replace(/<img[^>]*src="[^"]*certifications\.svg[^"]*"[^>]*>/gi, `<div class="w-full flex justify-center py-2">${githubPreview.svgs.certsSvg}</div>`);
        } catch (e) {
            console.error(e);
        }
        return rawHtml;
    };

    const githubUrl = data.profile?.github || '';
    const username = (githubUrl ? githubUrl.replace(/\/$/, '').split('/').pop() : 'jumaan1st') || 'jumaan1st';
    const name = data.profile?.name || 'Developer';
    const avatarUrl = data.profile?.photoLightUrl || `https://github.com/${username}.png`;
    const location = data.profile?.location || 'Earth';
    const bio = data.profile?.summary || 'Web Developer';
    const email = data.profile?.email || '';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 relative text-slate-700 dark:text-slate-300 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Back Link */}
                <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold mb-2 w-fit select-none">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>

                {/* Top Controls Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Github className="text-purple-600 dark:text-purple-500" />
                            GitHub Profile README Sync
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Generate and preview an interactive profile README.md using self-hosted R2 SVGs.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchGithubPreview} disabled={isLoadingGithub} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <RefreshCw size={16} className={isLoadingGithub ? 'animate-spin' : ''} />
                            Refresh Preview
                        </button>
                        <button onClick={handleGitHubSync} disabled={isSyncingGithub || isLoadingGithub} className="bg-purple-600 hover:bg-purple-755 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md transition-colors">
                            {isSyncingGithub ? <Loader2 size={16} className="animate-spin" /> : <SaveAll size={16} />}
                            Save & Sync README
                        </button>
                    </div>
                </div>

                {isLoadingGithub ? (
                    <div className="text-center p-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
                        <Loader2 className="animate-spin mx-auto text-purple-600 mb-2" size={32} />
                        <p className="text-sm text-slate-550 dark:text-slate-450 mt-2">Generating preview templates...</p>
                    </div>
                ) : githubPreview ? (
                    /* Chrome Browser Window Container */
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden bg-slate-100 dark:bg-[#1a1b1d] flex flex-col">
                        
                        {/* Chrome-Style Tab Bar */}
                        <div className="bg-[#dee1e6] dark:bg-[#202124] px-4 pt-2.5 flex items-end gap-2 border-b border-[#c5c8cc] dark:border-[#121314] select-none">
                            {/* Window Control Buttons (Mock dots) */}
                            <div className="flex items-center gap-1.5 mr-4 pb-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                            </div>

                            {/* Chrome Tab 1 */}
                            <button 
                                onClick={() => setGithubViewTab('svgs')} 
                                className={`relative h-9 px-6 font-semibold text-xs flex items-center gap-2 rounded-t-lg transition-all duration-150 ${
                                    githubViewTab === 'svgs' 
                                        ? 'bg-white dark:bg-[#2d2e31] text-slate-850 dark:text-slate-200 shadow-sm z-10 font-bold' 
                                        : 'text-slate-600 dark:text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Eye size={12} className="text-purple-500" />
                                <span>SVG Assets Previews</span>
                                {githubViewTab === 'svgs' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                                )}
                            </button>

                            {/* Chrome Tab 2 */}
                            <button 
                                onClick={() => setGithubViewTab('readme')} 
                                className={`relative h-9 px-6 font-semibold text-xs flex items-center gap-2 rounded-t-lg transition-all duration-150 ${
                                    githubViewTab === 'readme' 
                                        ? 'bg-white dark:bg-[#2d2e31] text-slate-850 dark:text-slate-200 shadow-sm z-10 font-bold' 
                                        : 'text-slate-600 dark:text-slate-455 hover:bg-slate-200 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Github size={12} className="text-purple-500" />
                                <span>Full README Page Mockup</span>
                                {githubViewTab === 'readme' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                                )}
                            </button>

                            {/* Plus Button */}
                            <button className="h-7 w-7 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 mb-1">
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Chrome-Style Address/URL Bar Row */}
                        <div className="bg-white dark:bg-[#2d2e31] px-4 py-2 flex items-center gap-3 border-b border-[#e1e4e8] dark:border-[#212224]">
                            {/* Nav navigation buttons */}
                            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                                <ArrowLeft size={16} className="cursor-not-allowed opacity-50" />
                                <ArrowRight size={16} className="cursor-not-allowed opacity-50" />
                                <RefreshCw size={14} onClick={fetchGithubPreview} className={`cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${isLoadingGithub ? 'animate-spin' : ''}`} />
                            </div>

                            {/* Address Box */}
                            <div className="flex-1 bg-slate-100 dark:bg-[#202124] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs border border-slate-200/50 dark:border-slate-800 font-mono text-slate-650 dark:text-slate-300">
                                <Lock size={12} className="text-green-600 dark:text-green-500" />
                                <span className="text-slate-400 dark:text-slate-600">https://</span>
                                <span>
                                    {githubViewTab === 'svgs' 
                                        ? `pub-449628d08210466891a47d6feb22ed65.r2.dev/github-profile` 
                                        : `github.com/${username}`
                                    }
                                </span>
                            </div>

                            {/* Extensions / Menu mock */}
                            <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                                <Sparkles size={14} className="text-amber-500" />
                                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                                    {username.substring(0, 2)}
                                </div>
                            </div>
                        </div>

                        {/* Browser Viewport Content */}
                        <div className="bg-slate-50 dark:bg-[#0d1117] min-h-[600px]">
                            {githubViewTab === 'svgs' ? (
                                /* R2 SVGs View */
                                <div className="p-6 sm:p-8 space-y-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                                        <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">Self-Hosted R2 Previews</h4>
                                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/30">Active</span>
                                    </div>
                                    
                                    <div className="space-y-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                <FileText size={13} /> Header Banner (R2 URL)
                                            </span>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-blue-500 select-all font-mono">
                                                {githubPreview.svgs.headerUrl.split('?')[0]}
                                            </div>
                                            <div 
                                                className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden mt-1.5 bg-white dark:bg-[#0f172a] p-4 flex justify-center items-center shadow-sm" 
                                                dangerouslySetInnerHTML={{ __html: githubPreview.svgs.headerSvg }} 
                                            />
                                        </div>

                                        <div className="space-y-1.5 pt-2">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                <FileText size={13} /> Skills Badges Grid (R2 URL)
                                            </span>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-blue-500 select-all font-mono">
                                                {githubPreview.svgs.skillsUrl.split('?')[0]}
                                            </div>
                                            <div 
                                                className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden mt-1.5 bg-white dark:bg-[#0f172a] p-4 flex justify-center shadow-sm" 
                                                dangerouslySetInnerHTML={{ __html: githubPreview.svgs.skillsSvg }} 
                                            />
                                        </div>

                                        <div className="space-y-1.5 pt-2">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                <FileText size={13} /> Credentials Showcase (R2 URL)
                                            </span>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-blue-500 select-all font-mono">
                                                {githubPreview.svgs.certsUrl.split('?')[0]}
                                            </div>
                                            <div 
                                                className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden mt-1.5 bg-white dark:bg-[#0f172a] p-4 flex justify-center shadow-sm" 
                                                dangerouslySetInnerHTML={{ __html: githubPreview.svgs.certsSvg }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Visual GitHub Profile Page Mockup */
                                <div className="bg-white dark:bg-[#0d1117] text-slate-850 dark:text-[#c9d1d9] font-sans pb-12 select-text text-left">
                                    
                                    {/* GitHub Mock Header */}
                                    <div className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] px-6 py-4 flex items-center justify-between text-xs text-slate-650 dark:text-[#8b949e]">
                                        <div className="flex items-center gap-4">
                                            <Github size={20} className="text-slate-900 dark:text-[#f0f6fc]" />
                                            <span className="font-semibold text-slate-800 dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 rounded-md bg-white dark:bg-[#0d1117] select-none">Search or jump to...</span>
                                            <span className="hover:text-slate-950 dark:hover:text-white cursor-pointer font-medium select-none">Pull requests</span>
                                            <span className="hover:text-slate-950 dark:hover:text-white cursor-pointer font-medium select-none">Issues</span>
                                            <span className="hover:text-slate-950 dark:hover:text-white cursor-pointer font-medium select-none">Codespaces</span>
                                            <span className="hover:text-slate-950 dark:hover:text-white cursor-pointer font-medium select-none">Marketplace</span>
                                            <span className="hover:text-slate-950 dark:hover:text-white cursor-pointer font-medium select-none">Explore</span>
                                        </div>
                                        <div className="flex items-center gap-3 select-none">
                                            <div className="relative">
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#f6f8fa] dark:border-[#161b22]" />
                                                <span className="cursor-pointer hover:text-slate-950 dark:hover:text-white">🔔</span>
                                            </div>
                                            <span className="cursor-pointer hover:text-slate-950 dark:hover:text-white">➕</span>
                                            <img src={avatarUrl} alt="avatar" className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                                        </div>
                                    </div>

                                    {/* Sub Tab Bar (Overview, Repositories etc.) */}
                                    <div className="border-b border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] sticky top-0 z-20 select-none">
                                        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex gap-6 overflow-x-auto">
                                            <span className="px-3 py-3.5 border-b-2 border-[#fd8c73] text-slate-900 dark:text-[#f0f6fc] font-semibold text-sm flex items-center gap-1.5 cursor-pointer">
                                                📖 Overview
                                            </span>
                                            <span className="px-3 py-3.5 border-b-2 border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] text-slate-650 dark:text-[#c9d1d9] text-sm flex items-center gap-1.5 cursor-pointer">
                                                📦 Repositories <span className="bg-slate-100 dark:bg-[#30363d] text-xs font-semibold px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">12</span>
                                            </span>
                                            <span className="px-3 py-3.5 border-b-2 border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] text-slate-650 dark:text-[#c9d1d9] text-sm flex items-center gap-1.5 cursor-pointer">
                                                📊 Projects
                                            </span>
                                            <span className="px-3 py-3.5 border-b-2 border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] text-slate-650 dark:text-[#c9d1d9] text-sm flex items-center gap-1.5 cursor-pointer">
                                                📦 Packages
                                            </span>
                                            <span className="px-3 py-3.5 border-b-2 border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] text-slate-650 dark:text-[#c9d1d9] text-sm flex items-center gap-1.5 cursor-pointer">
                                                ⭐️ Stars <span className="bg-slate-100 dark:bg-[#30363d] text-xs font-semibold px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">108</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Main Page Layout Grid */}
                                    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                                        
                                        {/* Profile Sidebar Mock */}
                                        <div className="md:col-span-1 space-y-4">
                                            <div className="relative group">
                                                <img src={avatarUrl} alt="Avatar Large" className="w-full max-w-[260px] aspect-square rounded-full border border-[#d0d7de] dark:border-[#30363d] shadow-sm bg-slate-50 dark:bg-slate-900" />
                                            </div>
                                            
                                            <div>
                                                <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f0f6fc] leading-tight">{name}</h1>
                                                <h2 className="text-xl text-slate-500 dark:text-[#8b949e] font-light leading-snug">{username}</h2>
                                            </div>

                                            <div className="text-sm font-medium text-slate-750 dark:text-[#c9d1d9]">
                                                {bio}
                                            </div>

                                            <button className="w-full bg-[#f6f8fa] hover:bg-[#f3f4f6] dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-[#d0d7de] dark:border-[#30363d] text-slate-800 dark:text-[#c9d1d9] font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-colors select-none">
                                                Edit profile
                                            </button>

                                            <div className="text-xs text-slate-600 dark:text-[#8b949e] flex flex-wrap items-center gap-1.5 font-medium pt-2 select-none">
                                                <span className="hover:text-blue-500 cursor-pointer">👥 <b>1,248</b> followers</span>
                                                <span>•</span>
                                                <span className="hover:text-blue-500 cursor-pointer"><b>145</b> following</span>
                                            </div>

                                            <div className="space-y-2.5 text-xs text-slate-650 dark:text-[#c9d1d9] border-t border-[#d0d7de] dark:border-[#30363d] pt-4">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <span>📍</span> {location}
                                                </div>
                                                {email && (
                                                    <div className="flex items-center gap-2 text-blue-500 hover:underline cursor-pointer font-medium">
                                                        <span>✉️</span> {email}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-blue-500 hover:underline cursor-pointer font-medium">
                                                    <span>🔗</span> www.jumaan.me
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Content Area */}
                                        <div className="md:col-span-3 space-y-6">
                                            {/* Popular Repositories Title Row */}
                                            <div className="flex justify-between items-center text-xs select-none">
                                                <span className="font-semibold text-slate-900 dark:text-[#f0f6fc]">Popular repositories</span>
                                                <span className="text-blue-500 hover:underline cursor-pointer">Customize your pins</span>
                                            </div>

                                            {/* Mock Pin Repositories */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] rounded-lg p-4 text-xs flex flex-col justify-between h-[110px]">
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-blue-500 hover:underline cursor-pointer text-sm">portfolio-app</span>
                                                            <span className="border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 rounded-full text-[10px] text-slate-500 font-medium">Public</span>
                                                        </div>
                                                        <p className="text-slate-550 dark:text-[#8b949e] mt-1.5 line-clamp-2">My personal developer website built using Next.js and Tailwind.</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-slate-500 mt-2 text-[11px] font-medium select-none">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#3178c6]" /> TypeScript</span>
                                                        <span>⭐ 45</span>
                                                        <span>🍴 12</span>
                                                    </div>
                                                </div>

                                                <div className="border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] rounded-lg p-4 text-xs flex flex-col justify-between h-[110px]">
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-blue-500 hover:underline cursor-pointer text-sm">useful-svg-widgets</span>
                                                            <span className="border border-[#d0d7de] dark:border-[#30363d] px-2 py-0.5 rounded-full text-[10px] text-slate-500 font-medium">Public</span>
                                                        </div>
                                                        <p className="text-slate-550 dark:text-[#8b949e] mt-1.5 line-clamp-2">Automated SVG rendering API to show beautiful skills badges and metrics.</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-slate-500 mt-2 text-[11px] font-medium select-none">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f1e05a]" /> JavaScript</span>
                                                        <span>⭐ 82</span>
                                                        <span>🍴 8</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Profile README Box Mockup */}
                                            <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden bg-white dark:bg-[#0d1117]">
                                                {/* Box Header */}
                                                <div className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-650 dark:text-[#8b949e] select-none">
                                                    <span className="flex items-center gap-2 text-slate-800 dark:text-[#f0f6fc]">
                                                        <span>📄</span> {username} / README.md
                                                    </span>
                                                    <span className="hover:text-blue-500 cursor-pointer">✏️</span>
                                                </div>

                                                {/* Box Compiled Content */}
                                                <div className="p-6 sm:p-10 text-slate-900 dark:text-[#c9d1d9] font-sans max-w-none text-left select-text github-readme-body border-t border-[#d0d7de] dark:border-[#30363d]">
                                                                                                      <style dangerouslySetInnerHTML={{ __html: `
                                                        .github-readme-body h1 { font-size: 1.8em; font-weight: 600; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; color: #1f2328; }
                                                        .dark .github-readme-body h1 { border-bottom: 1px solid #30363d; color: #f0f6fc; }
                                                        
                                                        .github-readme-body h2 { font-size: 1.4em; font-weight: 600; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; color: #1f2328; }
                                                        .dark .github-readme-body h2 { border-bottom: 1px solid #30363d; color: #f0f6fc; }
                                                        
                                                        .github-readme-body h3 { font-size: 1.2em; font-weight: 600; margin-top: 24px; margin-bottom: 16px; color: #1f2328; }
                                                        .dark .github-readme-body h3 { color: #f0f6fc; }
                                                        
                                                        .github-readme-body p { margin-top: 0; margin-bottom: 16px; line-height: 1.6; }
                                                        .github-readme-body ul { list-style-type: disc; padding-left: 2em; margin-top: 0; margin-bottom: 16px; }
                                                        .github-readme-body li { margin-top: 0.25em; }
                                                        
                                                        .github-readme-body a { color: #0969da; text-decoration: none; }
                                                        .dark .github-readme-body a { color: #58a6ff; }
                                                        .github-readme-body a:hover { text-decoration: underline; }
                                                        
                                                        .github-readme-body blockquote { padding: 0 1em; color: #57606a; border-left: 0.25em solid #d0d7de; margin: 0 0 16px 0; }
                                                        .dark .github-readme-body blockquote { color: #8b949e; border-left: 0.25em solid #30363d; }
                                                        
                                                        .github-readme-body code { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: rgba(175,184,193,0.2); border-radius: 6px; font-family: ui-monospace,monospace; color: #1f2328; }
                                                        .dark .github-readme-body code { background-color: rgba(110,118,129,0.4); color: #c9d1d9; }
                                                        
                                                        .github-readme-body pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 6px; border: 1px solid #d0d7de; margin-bottom: 16px; }
                                                        .dark .github-readme-body pre { background-color: #161b22; border: 1px solid #30363d; }
                                                        
                                                        .github-readme-body hr { height: 0.25em; padding: 0; margin: 24px 0; background-color: #d0d7de; border: 0; }
                                                        .dark .github-readme-body hr { background-color: #30363d; }
                                                    `}} />
                                                    <div dangerouslySetInnerHTML={{ __html: getReadmeHtml() }} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Click "Refresh Preview" to generate README mockups.</p>
                    </div>
                )}
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
}
