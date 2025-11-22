"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Edit3, Home, Layout, Mail, Menu, User, Lock, Sun, Moon } from "lucide-react";
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
    const { isAuthenticated } = usePortfolio();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20 group-hover:shadow-blue-900/40 transition-all">
                            MJ
                        </div>
                        <div className="hidden sm:block text-left">
                            <h1 className="font-bold text-slate-900 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Portfolio
                            </h1>
                            <p className="text-[10px] text-slate-500 tracking-wider uppercase">
                                Jumaan
                            </p>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        {navItems.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                            >
                                <Icon size={18} />
                                <span className="hidden md:block font-medium">{label}</span>
                            </Link>
                        ))}
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        )}

                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                        >
                            {isAuthenticated ? <Lock size={18} /> : <Edit3 size={18} />}
                            <span className="hidden md:block font-medium">
                                {isAuthenticated ? "Dashboard" : "Admin"}
                            </span>
                        </Link>
                    </div>

                    {/* Mobile icon */}
                    <div className="md:hidden flex items-center gap-4 text-slate-600 dark:text-slate-400">
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        )}
                        <Menu size={24} />
                    </div>
                </div>

                {/* Mobile nav row */}
                <div className="md:hidden flex justify-between mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 overflow-x-auto pb-2">
                    {navItems.map(({ href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <Icon size={20} />
                        </Link>
                    ))}
                    <Link
                        href="/admin"
                        className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <Edit3 size={20} />
                    </Link>
                </div>
            </div>
        </nav>
    );
};
