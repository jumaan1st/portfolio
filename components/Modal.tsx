"use client";

import React from "react";
import { X } from "lucide-react";

type ModalProps = {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto text-slate-600 dark:text-slate-300">{children}</div>
            </div>
        </div>
    );
};
