"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePortfolio } from "./PortfolioContext";
import ReactMarkdown from 'react-markdown';

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

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    // Initial position on open (bottom rightish)
    useEffect(() => {
        if (isOpen && window.innerWidth > 768) {
            setPosition({
                x: window.innerWidth - 350,
                y: window.innerHeight - 500
            });
        }
    }, [isOpen]);

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (window.innerWidth < 768) return; // Disable drag on mobile
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX - position.x,
            startY: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = e.clientX - dragRef.current.startX;
            const newY = e.clientY - dragRef.current.startY;
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

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

    // ...

    const optimizePortfolioData = (originalData: any) => {
        if (!originalData) return {};
        const { config, ui, ...rest } = originalData;

        return {
            profile: {
                name: rest.profile?.name,
                summary: rest.profile?.summary,
                skills: (rest.skills || []).map((s: any) => s.name),
                // Recent 2 jobs full detail, others summary
                experience: (rest.experience || []).map((e: any, idx: number) =>
                    idx < 2
                        ? `${e.role} at ${e.company} (${e.period}): ${e.description}`
                        : `${e.role} at ${e.company} (${e.period})`
                ),
            },
            // LAST 10 projects, top 3 with complete details (longDescription or description)
            projects: (rest.projects || [])
                .slice()
                .reverse()
                .slice(0, 10)
                .map((p: any, idx: number) => ({
                    title: p.title,
                    tech: p.tech,
                    description: idx < 3 ? (p.longDescription || p.description) : undefined,
                })),
            // LAST 10 blogs, top 3 with full details (content or excerpt)
            blogs: (rest.blogs || [])
                .slice()
                .reverse()
                .slice(0, 10)
                .map((b: any, idx: number) => ({
                    title: b.title,
                    date: b.date,
                    content: idx < 3 ? (b.content || b.excerpt) : undefined,
                }))
        };
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !userInfo) return;

        const userMsg = input;
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsTyping(true);

        // Optimizing context to save tokens
        const optimizedData = optimizePortfolioData(data);
        const context = `You are a helpful AI assistant for Mohammed Jumaan's portfolio website. 
Here is his profile data in JSON format: ${JSON.stringify(optimizedData)}. Answer questions based STRICTLY on this data. Be professional, friendly, and concise. 
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
            // ...

            const responseData = await res.json();

            if (res.ok) {
                setMessages((prev) => [...prev, { role: "ai", text: responseData.response }]);
            } else {
                setMessages((prev) => [...prev, { role: "ai", text: responseData.error || "Something went wrong. Please try again." }]);
            }

        } catch (error) {
            setMessages((prev) => [...prev, { role: "ai", text: "Sorry, connection failed. Please check your internet." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Toggle Button (Always visible when closed, or maybe hidden when open?) */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-blue-500/40 transition-all transform hover:scale-105"
                    >
                        <Sparkles size={20} className="animate-pulse" />
                        <span className="font-bold text-sm">Ask AI</span>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    ref={windowRef}
                    style={{
                        position: 'fixed',
                        left: window.innerWidth < 768 ? '50%' : `${position.x}px`,
                        top: window.innerWidth < 768 ? '50%' : `${position.y}px`,
                        transform: window.innerWidth < 768 ? 'translate(-50%, -50%)' : 'none',
                    }}
                    className={`z-50 w-[90vw] md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 ${isDragging ? 'cursor-grabbing' : ''}`}
                >
                    {/* Header (Drag Handle) */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
                    >
                        <div className="flex items-center gap-2 text-white">
                            <Bot size={18} />
                            <h3 className="font-bold text-sm">JumaanAI</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Make Resize Indicator or Minimize? For now just Close */}
                            <button
                                onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!userInfo ? (
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 h-80 flex flex-col justify-center">
                            <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-4">
                                Please introduce yourself to start chatting (Limit: 5 requests/day).
                            </p>
                            <form onSubmit={handleIdentitySubmit} className="space-y-3">
                                <input
                                    required
                                    placeholder="Your Name"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                                    value={identityForm.name}
                                    onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                                />
                                <input
                                    required
                                    type="email"
                                    placeholder="Your Email"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                                    value={identityForm.email}
                                    onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
                                />
                                <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-xs font-bold">
                                    Start Chat
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="h-80 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950/50">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[85%] p-2 rounded-xl text-xs ${msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm"
                                                }`}
                                        >
                                            {msg.role === "user" ? (
                                                msg.text
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex gap-1 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-100" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                onSubmit={handleSend}
                                className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about Jumaan..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
};
