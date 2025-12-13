"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePortfolio } from "./PortfolioContext";

type Message = { role: "ai" | "user"; text: string };

export const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            text: "Hi! I'm Jumaan's AI Assistant. Ask me anything about his skills, projects, or experience! ✨",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { data } = usePortfolio();

    // Identity State
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
    const [identityForm, setIdentityForm] = useState({ name: "", email: "" });

    useEffect(() => {
        const stored = localStorage.getItem("portfolio_user_identity");
        if (stored) {
            setUserInfo(JSON.parse(stored));
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isOpen]);

    const handleIdentitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (identityForm.name && identityForm.email) {
            setUserInfo(identityForm);
            localStorage.setItem("portfolio_user_identity", JSON.stringify(identityForm));
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !userInfo) return;

        const userMsg = input;
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsTyping(true);

        const context = `You are a helpful AI assistant for Mohammed Jumaan's portfolio website. 
Here is his profile data in JSON format: ${JSON.stringify(data)}. Answer questions based STRICTLY on this data. Be professional, friendly, and concise. 
If the answer isn't in the data, say you don't have that specific info but suggest contacting him directly.
User Question: ${userMsg}`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: context,
                    name: userInfo.name,
                    email: userInfo.email
                })
            });

            const responseData = await res.json();

            if (res.ok) {
                setMessages((prev) => [...prev, { role: "ai", text: responseData.response }]);
            } else if (res.status === 429) {
                setMessages((prev) => [...prev, { role: "ai", text: "⚠️ You have reached the daily limit of 5 AI requests." }]);
            } else {
                setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error. Please try again later." }]);
            }

        } catch (error) {
            setMessages((prev) => [...prev, { role: "ai", text: "Sorry, connection failed. Please check your internet." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-white">
                            <Bot size={20} />
                            <h3 className="font-bold">JumaanAI</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {!userInfo ? (
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 h-80 flex flex-col justify-center">
                            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                                Please introduce yourself to start chatting (Limit: 5 requests/day).
                            </p>
                            <form onSubmit={handleIdentitySubmit} className="space-y-3">
                                <input
                                    required
                                    placeholder="Your Name"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                    value={identityForm.name}
                                    onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                                />
                                <input
                                    required
                                    type="email"
                                    placeholder="Your Email"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                    value={identityForm.email}
                                    onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
                                />
                                <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-bold">
                                    Start Chat
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex gap-1 shadow-sm">
                                            <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                onSubmit={handleSend}
                                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about Jumaan..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsOpen((o) => !o)}
                className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-blue-500/40 transition-all transform hover:scale-105"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <Sparkles size={24} className="animate-pulse" />
                )}
                <span
                    className={`font-bold overflow-hidden transition-all duration-300 ${isOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}
                >
                    Ask AI
                </span>
            </button>
        </div>
    );
};
