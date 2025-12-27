import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Project } from "@/data/portfolioData";
import { PROJECT_CATEGORIES } from "@/data/constants";
import RichTextEditor from "./RichTextEditor";
import { FileUploader } from "./FileUploader";
import { extractFirstImage } from "@/lib/utils";

interface ProjectEditorProps {
    initialData?: Partial<Project>;
    onSave: (project: Partial<Project>) => Promise<void>;
    onCancel: () => void;
    title?: string;
    isFullPage?: boolean;
    onDirtyChange?: (isDirty: boolean) => void;
}

const Input = ({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) => (
    <div className="w-full min-w-0">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{label}</label>
        <input className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
);

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ initialData, onSave, onCancel, title, isFullPage, onDirtyChange }) => {
    const [project, setProject] = useState<Partial<Project>>(initialData || {});
    const [isSaving, setIsSaving] = useState(false);

    // Track dirty state
    useEffect(() => {
        if (!onDirtyChange) return;
        const isModified = JSON.stringify(project) !== JSON.stringify(initialData || {});
        onDirtyChange(isModified);
    }, [project, initialData, onDirtyChange]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Auto-set cover image if missing
            if (!project.image && project.longDescription) {
                const extracted = extractFirstImage(project.longDescription);
                if (extracted) project.image = extracted;
            }
            await onSave(project);
        } finally {
            setIsSaving(false);
        }
    };

    const containerClasses = isFullPage
        ? "bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6"
        : "bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto";

    return (
        <div className={containerClasses}>
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title || "Edit Project"}</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                </button>
            </div>

            <Input label="Project Title" value={project.title} onChange={v => setProject({ ...project, title: v })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Category</label>
                    <select
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 appearance-none text-slate-700 dark:text-slate-200"
                        value={project.category}
                        onChange={e => setProject({ ...project, category: e.target.value })}
                    >
                        <option value="">Select Category</option>
                        {PROJECT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <Input label="Link" value={project.link} onChange={v => setProject({ ...project, link: v })} />
            </div>
            <Input
                label="Technologies (comma separated)"
                value={Array.isArray(project.tech) ? project.tech.join(', ') : project.tech}
                onChange={v => setProject({ ...project, tech: v.split(',').map(s => s.trim()) })}
            />
            <FileUploader label="Project Image" value={project.image || ''} onChange={(v: string) => setProject({ ...project, image: v })} folder="projects" />

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Short Summary (Card Preview)</label>
                    <textarea
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-24 outline-none focus:ring-2 ring-blue-500 text-sm text-slate-700 dark:text-slate-200"
                        value={project.description}
                        onChange={e => setProject({ ...project, description: e.target.value })}
                        placeholder="Brief summary shown on the project card..."
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Full Project Details</label>
                    <div className="min-h-[300px]">
                        <RichTextEditor
                            value={project.longDescription || project.description || ''}
                            onChange={val => setProject({ ...project, longDescription: val })}
                            placeholder="Write the full case study here..."
                            allowImages={true}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t dark:border-slate-700 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 z-10 pb-2">
                <button onClick={onCancel} className="w-full sm:w-auto px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors">Cancel</button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto justify-center px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                </button>
            </div>
        </div>
    );
};
