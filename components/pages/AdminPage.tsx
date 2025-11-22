"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { usePortfolio } from "@/components/PortfolioContext";

export const AdminPage: React.FC = () => {
    const { data, isAuthenticated, setIsAuthenticated } = usePortfolio();
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (
            loginForm.email === data.config.adminEmail &&
            loginForm.password === data.config.adminPass
        ) {
            setIsAuthenticated(true);
        } else {
            alert("Invalid Credentials. (Hint: admin@jumaan.dev / password123)");
        }
    };

    const handleLogout = () => setIsAuthenticated(false);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-300">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-slate-800 rounded-full text-slate-400">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        Admin Access
                    </h2>
                    <p className="text-slate-400 text-center text-sm mb-6">
                        Please authenticate to continue
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={loginForm.email}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="admin@jumaan.dev"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={loginForm.password}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                placeholder="••••••••"
                            />
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                    <p className="text-slate-400 text-sm">
                        You are logged in. You can now edit details directly on the pages.
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/20 transition-colors"
                >
                    Logout
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-2">Editing Enabled</h3>
                    <p className="text-slate-400 text-sm">
                        Navigate to &quot;Home&quot; or &quot;About&quot; to see pencil
                        icons next to text fields.
                    </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-2">Projects</h3>
                    <p className="text-slate-400 text-sm">
                        {data.projects.length} projects active. Manage them in the config
                        file.
                    </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-2">Status</h3>
                    <p className="text-slate-400 text-sm">
                        Logged in as <span className="font-semibold">Admin</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};
