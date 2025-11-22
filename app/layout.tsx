"use client";

import "./globals.css";
import React, { useEffect, useState } from "react";
import { PortfolioProvider, usePortfolio } from "@/components/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Modal } from "@/components/Modal";
import { Terminal, Star } from "lucide-react";

function Shell({ children }: { children: React.ReactNode }) {
    const { data } = usePortfolio();
    const [showWelcome, setShowWelcome] = useState(
        data.config.showWelcomeModal
    );
    const [showReview, setShowReview] = useState(false);
    const [visitingProject, setVisitingProject] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        name: "",
        email: "",
        phone: "",
        review: "",
        rating: 5,
    });

    // Simpler version of your "return from project" logic:
    useEffect(() => {
        // On client initial load we don't know if they came from external project,
        // so you can later wire this with localStorage if you want.
    }, []);

    const renderStars = (rating: number) =>
        [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={24}
                className={`${
                    i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-600"
                } cursor-pointer transition-colors hover:scale-110`}
                onClick={() =>
                    setReviewForm((prev) => ({ ...prev, rating: i + 1 }))
                }
            />
        ));

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Thank you ${reviewForm.name}! Your review has been submitted.`);
        setShowReview(false);
        setReviewForm({
            name: "",
            email: "",
            phone: "",
            review: "",
            rating: 5,
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans flex flex-col overflow-x-hidden">
            <Navbar />
            <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 md:py-12 relative">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
                {children}
            </main>

            <AIChatWidget />

            <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center">
                <p className="text-slate-600 text-sm">
                    &copy; {new Date().getFullYear()} {data.profile.name}. Built with
                    Next.js & React.
                </p>
            </footer>

            {/* Welcome modal */}
            <Modal
                isOpen={showWelcome}
                onClose={() => setShowWelcome(false)}
                title="Welcome"
            >
                <div className="text-center space-y-6 py-2">
                    <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4 animate-pulse">
                        <Terminal size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {data.profile.name}
                        </h3>
                        <p className="text-blue-400 text-sm font-mono mt-1">
                            Java Developer @ Dyashin Technosoft
                        </p>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        You&apos;ve landed on my personal portfolio. I build robust backend
                        systems and scalable web applications.
                    </p>
                    <button
                        onClick={() => setShowWelcome(false)}
                        className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-lg transition-colors"
                    >
                        Enter Portfolio
                    </button>
                </div>
            </Modal>

            {/* Review modal: you can later wire visitingProject flag using localStorage */}
            <Modal
                isOpen={showReview}
                onClose={() => setShowReview(false)}
                title="Project Feedback"
            >
                <div className="space-y-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4">
                        <p className="text-blue-300 text-sm text-center">
                            Welcome back! I noticed you checked out one of my projects.
                            Thoughts?
                        </p>
                    </div>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="text-center mb-4">
                            <div className="flex justify-center gap-2">
                                {renderStars(reviewForm.rating)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                required
                                placeholder="Your Name"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white w-full focus:border-blue-500 outline-none"
                                value={reviewForm.name}
                                onChange={(e) =>
                                    setReviewForm((p) => ({ ...p, name: e.target.value }))
                                }
                            />
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white w-full focus:border-blue-500 outline-none"
                                value={reviewForm.email}
                                onChange={(e) =>
                                    setReviewForm((p) => ({ ...p, email: e.target.value }))
                                }
                            />
                        </div>
                        <textarea
                            required
                            placeholder="Your feedback..."
                            rows={3}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white w-full focus:border-blue-500 outline-none"
                            value={reviewForm.review}
                            onChange={(e) =>
                                setReviewForm((p) => ({ ...p, review: e.target.value }))
                            }
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all"
                        >
                            Submit Review
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <PortfolioProvider>
            <Shell>{children}</Shell>
        </PortfolioProvider>
        </body>
        </html>
    );
}
