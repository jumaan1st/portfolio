"use client";

import React, { useState } from "react";
import { ExternalLink, Construction, MessageSquare } from "lucide-react";
import { Modal } from "./Modal";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProjectLinkProps {
    href: string;
    className?: string;
    children?: React.ReactNode;
    showIcon?: boolean;
}

export const ProjectLink: React.FC<ProjectLinkProps> = ({
    href,
    className = "",
    children,
    showIcon = false,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    // Check if link is valid (not empty, not #, starts with http)
    const isValid = href && href !== "#" && href.trim() !== "" && (href.startsWith("http") || href.startsWith("/"));

    const handleClick = (e: React.MouseEvent) => {
        if (!isValid) {
            e.preventDefault();
            setIsModalOpen(true);
        }
    };

    const handleContactRedirect = () => {
        setIsModalOpen(false);
        router.push("/contact");
    };

    return (
        <>
            <a
                href={isValid ? href : "#"}
                target={isValid && href.startsWith("http") ? "_blank" : undefined}
                rel={isValid && href.startsWith("http") ? "noreferrer" : undefined}
                className={`cursor-pointer ${className}`}
                onClick={handleClick}
            >
                {children}
                {showIcon && <ExternalLink size={16} className="ml-2" />}
            </a>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Demo Unavailable"
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                        <Construction size={40} className="text-amber-500 dark:text-amber-400" />
                    </div>

                    <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Work in Progress
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300">
                            The live demo for this project is currently unavailable or undergoing maintenance.
                            The code is available on GitHub, or I can walk you through a demo personally!
                        </p>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleContactRedirect}
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={16} /> Contact Me
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
