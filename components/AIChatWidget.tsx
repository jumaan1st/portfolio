"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePortfolio } from "./PortfolioContext";
import { callGeminiAPI } from "@/lib/gemini";

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsTyping(true);

        const context = `You are a helpful AI assistant for Mohammed Jumaan's portfolio website. 
Here is his profile data in JSON format: ${JSON.stringify(
            data
        )}. Answer questions based STRICTLY on this data. Be professional, friendly, and concise. 
If the answer isn't in the data, say you don't have that specific info but suggest contacting him directly.
User Question: ${userMsg}`;

        const aiResponse = await callGeminiAPI(context);
        setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
        setIsTyping(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
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

                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-700 flex gap-1">
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={handleSend}
                        className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about Jumaan..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isTyping}
                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </form>
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
                    className={`font-bold overflow-hidden transition-all duration-300 ${
                        isOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                >
          Ask AI
        </span>
            </button>
        </div>
    );
};
