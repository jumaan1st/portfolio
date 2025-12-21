"use client";

import React, { useState } from "react";
import { Loader2, Upload, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FileUploaderProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
    folder?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, value, onChange, folder = 'uploads' }) => {
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();

    const handleDeleteOld = async (oldUrl: string) => {
        if (!oldUrl) return;
        try {
            await fetch('/api/upload', {
                method: 'DELETE',
                body: JSON.stringify({ url: oldUrl }),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.error("Failed to delete old file", e);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side Safety Limit: 5MB
        if (file.size > 5 * 1024 * 1024) {
            addToast("File is too large! Max 5MB.", "error");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                if (value) await handleDeleteOld(value);
                onChange(data.url);
                addToast("File uploaded successfully", "success");
            } else {
                addToast("Upload failed", "error");
            }
        } catch (error) {
            console.error(error);
            addToast("Upload error", "error");
        } finally {
            setUploading(false);
        }
    };

    const isPdf = value?.toLowerCase().endsWith('.pdf');
    const isImage = value?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || (!isPdf && value);

    // Helper to truncate URL for display - explicitly stricter for mobile
    const displayUrl = value ? (value.length > 25 ? value.substring(0, 20) + '...' : value) : '';

    return (
        <div className="w-full min-w-0 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">{label}</label>

            {!value ? (
                <div className="relative group w-full">
                    <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer h-28 sm:h-32">
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                        <span className="text-xs font-bold">{uploading ? "Uploading..." : "Click to Upload"}</span>
                    </div>
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        disabled={uploading}
                        accept={folder === 'resumes' ? ".pdf" : "image/*"}
                    />
                </div>
            ) : (
                <div className="w-full max-w-full relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 grid grid-cols-[auto_1fr_auto] gap-3 items-center shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* Preview Icon/Image - Fixed Width */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        {isImage ? (
                            <img src={value} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-bold text-red-500 uppercase">PDF</span>
                        )}
                    </div>

                    {/* Info - Flexible Width with Truncation */}
                    <div className="min-w-0 overflow-hidden flex flex-col justify-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{folder === 'resumes' ? 'Document' : 'Image'}</p>
                        <a href={value} target="_blank" rel="noreferrer" className="block text-xs font-mono text-slate-600 dark:text-slate-300 truncate hover:text-blue-600 transition-colors" title={value}>
                            {displayUrl}
                        </a>
                    </div>

                    {/* Actions - Fixed Width */}
                    <div className="flex items-center gap-1 shrink-0">
                        <a
                            href={value}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="Open Link"
                        >
                            <ExternalLink size={16} />
                        </a>
                        <div className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all cursor-pointer" title="Replace File">
                            <RefreshCw size={16} />
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleUpload}
                                disabled={uploading}
                                accept={folder === 'resumes' ? ".pdf" : "image/*"}
                            />
                        </div>
                    </div>

                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-xl z-10 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-blue-600" size={20} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
