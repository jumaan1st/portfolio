"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "../PortfolioContext";
import { ArrowLeft, Save, GripVertical, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/Toast";

interface ReorderProject {
    id: number;
    title: string;
    image: string;
    originalSortOrder: number;
    currentSortOrder: number; // Used for calculation
}

export const ReorderProjectsPage = () => {
    const { isAuthenticated } = usePortfolio();
    const router = useRouter();
    const { addToast } = useToast();

    const [projects, setProjects] = useState<ReorderProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination for Drag and Drop View
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch ALL projects to handle global reordering (lightweight fetch)
    // We need 'sort_order'
    useEffect(() => {
        const fetchAll = async () => {
            try {
                // We fetch all at once (limit=1000) to ensure accurate ranking
                const res = await fetch('/api/projects?limit=1000&summary=true');
                const json = await res.json();
                if (json.data) {
                    // Map to our structure
                    // The API returns them sorted by sort_order DESC, then id DESC.
                    // So Index 0 is Rank 1.
                    const mapped = json.data.map((p: any, index: number) => ({
                        id: p.id,
                        title: p.title,
                        image: p.image,
                        originalSortOrder: p.sort_order || 0,
                        // We don't really use server sort_order for local logic,
                        // we rely on the ARRAY INDEX as the truth source for Rank.
                    }));
                    setProjects(mapped);
                }
            } catch (e) {
                console.error(e);
                addToast("Failed to load projects", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [addToast]);

    // Drag and Drop Logic
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        // Determine index relative to current page or global?
        // Let's operate on global index
        const globalIndex = (currentPage - 1) * itemsPerPage + index;
        const globalDraggedIndex = draggedItemIndex;

        if (globalDraggedIndex === null || globalDraggedIndex === globalIndex) return;

        // Reorder list
        const newList = [...projects];
        const item = newList.splice(globalDraggedIndex, 1)[0];
        newList.splice(globalIndex, 0, item);

        setProjects(newList);
        setDraggedItemIndex(globalIndex);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    // Numeric Input Logic
    const handleRankChange = (id: number, newRankStr: string) => {
        const newRank = parseInt(newRankStr);
        if (isNaN(newRank) || newRank < 1 || newRank > projects.length) return;

        const currentIndex = projects.findIndex(p => p.id === id);
        if (currentIndex === -1) return;

        const targetIndex = newRank - 1;
        if (currentIndex === targetIndex) return;

        const newList = [...projects];
        const item = newList.splice(currentIndex, 1)[0];
        newList.splice(targetIndex, 0, item);
        setProjects(newList);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert list order to sort_order values
            // Rank 1 (Index 0) -> Max Value
            // Rank N (Index N-1) -> Min Value
            // Simple approach: Rank 1 = projects.length, Rank N = 1.

            const total = projects.length;
            const updates = projects.map((p, index) => ({
                id: p.id,
                sort_order: total - index // Descending value for Ascending Rank
            }));

            const res = await fetch('/api/projects/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updates })
            });

            if (!res.ok) throw new Error("Failed to save");

            addToast("Order saved successfully!", "success");
            router.push('/projects');
        } catch (e) {
            console.error(e);
            addToast("Failed to save order", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated) return (
        <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">
            Access Denied. Admins Only.
        </div>
    );

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse space-y-4 text-center">
                <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto" />
                <p className="text-slate-500">Loading projects...</p>
            </div>
        </div>
    );

    // Pagination Slicing
    const totalPages = Math.ceil(projects.length / itemsPerPage);
    const displayedProjects = projects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reorder Projects</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Order</span>
                </button>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3 border border-blue-200 dark:border-blue-800/50">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>
                        Drag and drop items to reorder them, or type a number in the "Rank" box to jump a project to a specific position.
                        <strong> Rank 1</strong> will be the first project displayed on your portfolio.
                    </p>
                </div>

                <div className="space-y-2">
                    {displayedProjects.map((project, index) => {
                        const globalIndex = (currentPage - 1) * itemsPerPage + index;
                        const rank = globalIndex + 1;

                        return (
                            <div
                                key={project.id}
                                draggable
                                onDragStart={() => handleDragStart(globalIndex)}
                                onDragOver={(e) => handleDragOver(e, index)} // Note: Use LOCAL index for DragOver visual calculation logic usually, simplified here
                                onDragEnd={handleDragEnd}
                                className={`
                                    flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm
                                    ${draggedItemIndex === globalIndex ? 'opacity-50 border-dashed border-blue-500' : 'hover:border-blue-300 dark:hover:border-blue-700'}
                                    transition-all cursor-move
                                `}
                            >
                                <div className="text-slate-400 cursor-grab active:cursor-grabbing p-2">
                                    <GripVertical size={20} />
                                </div>

                                <div className="flex flex-col items-center gap-1 w-16">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rank</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={projects.length}
                                        value={rank}
                                        onChange={(e) => handleRankChange(project.id, e.target.value)}
                                        className="w-12 text-center text-sm font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 outline-none focus:ring-2 ring-blue-500"
                                    />
                                </div>

                                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    {project.image && project.image.startsWith('http') ? (
                                        <img src={project.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                                    )}
                                </div>

                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                                    {project.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-4 font-bold text-slate-600 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
