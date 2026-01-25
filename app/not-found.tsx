"use client";

import Link from "next/link";
import { Home, MoveLeft, Terminal, AlertCircle } from "lucide-react";
import React from 'react';

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

            {/* Main Container */}
            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

                {/* 404 Visual */}
                <div className="relative">
                    <h1 className="text-[9rem] sm:text-[12rem] font-bold leading-none bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 select-none opacity-50 blur-[1px]">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-6 rounded-2xl shadow-2xl flex items-center gap-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <AlertCircle size={48} className="text-red-500" />
                            <div className="text-left">
                                <div className="text-xl font-bold text-slate-900 dark:text-white">Page Not Found</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">CODE: 404_NOT_FOUND</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-4 max-w-lg mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        Lost in Cyberspace?
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        The page you are looking for has been moved, deleted, or possibly never existed in this dimension.
                    </p>
                </div>

                {/* Fake Terminal / Developer Hint */}
                <div className="w-full max-w-md bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-xl mx-auto text-left">
                    <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <div className="ml-2 text-xs text-slate-500 font-mono">debug_console</div>
                    </div>
                    <div className="p-4 font-mono text-xs sm:text-sm text-slate-300 space-y-1">
                        <div><span className="text-green-400">$</span> check_url --status</div>
                        <div className="text-red-400">Error: 404 Target Unreachable</div>
                        <div><span className="text-green-400">$</span> suggestion --fix</div>
                        <div className="text-yellow-300">Try navigating to the homepage.</div>
                        <div className="animate-pulse"><span className="text-green-400">$</span> _</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                    <Link
                        href="/"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95 group"
                    >
                        <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-all active:scale-95"
                    >
                        <MoveLeft size={18} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
