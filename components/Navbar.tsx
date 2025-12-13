"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Edit3, Home, Layout, Mail, User, Lock, Sun, Moon, Github, Linkedin } from "lucide-react";
import { usePortfolio } from "./PortfolioContext";
import { useTheme } from "next-themes";

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: User },
    { href: "/projects", label: "Projects", icon: Layout },
    { href: "/contact", label: "Contact", icon: Mail },
];

export const Navbar: React.FC = () => {
    const { isAuthenticated, data } = usePortfolio();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSocialOpen, setIsSocialOpen] = useState(false); // Sub-dropdown for socials

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 py-2">

                {/* Desktop navbar - Unchanged */}
                <div className="hidden md:flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20 group-hover:shadow-blue-900/40 transition-all">
                            MJ
                        </div>
                        <div className="text-left hidden sm:block">
                            <h1 className="font-bold text-slate-900 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Portfolio
                            </h1>
                            <p className="text-[10px] text-slate-500 tracking-wider uppercase">
                                Jumaan
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        {/* Socials (Desktop) */}
                        <div className="hidden lg:flex items-center gap-1 mr-2 px-2 border-r border-slate-200 dark:border-slate-800">
                            {data.profile.github && (
                                <a
                                    href={`https://${data.profile.github.replace(/^https?:\/\//, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <Github size={18} />
                                </a>
                            )}
                            {data.profile.linkedin && (
                                <a
                                    href={`https://${data.profile.linkedin.replace(/^https?:\/\//, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Linkedin size={18} />
                                </a>
                            )}
                        </div>

                        {navItems.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
                            >
                                <Icon size={18} />
                                <span className="hidden md:block font-medium">{label}</span>
                            </Link>
                        ))}

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
                        >
                            {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
                        </button>

                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                        >
                            {isAuthenticated ? <Lock size={18} /> : <Edit3 size={18} />}
                            <span className="hidden md:block font-medium">
                                {isAuthenticated ? "Dashboard" : "Admin"}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Header (Double Decker) */}
                <div className="md:hidden flex flex-col gap-3 pb-2">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow">
                                MJ
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">Jumaan</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                                {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {isMenuOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-around border-t border-slate-100 dark:border-slate-800/50 pt-2">
                        {navItems.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                aria-label={label}
                            >
                                <Icon size={20} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Mobile Menu Dropdown (Simplified - Admin & Socials only) */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 animate-in slide-in-from-top-4 fade-in duration-200">
                        <div className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">

                            <Link
                                href="/admin"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all"
                            >
                                <Edit3 size={20} />
                                <span className="font-medium">{isAuthenticated ? "Dashboard" : "Admin"}</span>
                            </Link>

                            <div className="h-px bg-slate-200 dark:bg-slate-700 mx-4 my-1" />

                            {/* Socials Dropdown Toggle */}
                            <button
                                onClick={() => setIsSocialOpen(!isSocialOpen)}
                                className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <User size={20} className="text-blue-500" />
                                    <span className="font-medium">Connect</span>
                                </div>
                                <div className={`transform transition-transform ${isSocialOpen ? 'rotate-180' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </button>

                            {isSocialOpen && (
                                <div className="px-4 pb-2 space-y-2 animate-in slide-in-from-top-1 fade-in">
                                    {data.profile.github && (
                                        <a
                                            href={`https://${data.profile.github.replace(/^https?:\/\//, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                                        >
                                            <Github size={18} /> GitHub
                                        </a>
                                    )}
                                    {data.profile.linkedin && (
                                        <a
                                            href={`https://${data.profile.linkedin.replace(/^https?:\/\//, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-700"
                                        >
                                            <Linkedin size={18} /> LinkedIn
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Bar Removed in favor of Double-Decker Header */}
            </div>
        </nav>
    );
};
