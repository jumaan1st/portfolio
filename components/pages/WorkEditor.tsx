"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { PROJECT_CATEGORIES } from '@/data/constants';

const Input = ({ label, value, onChange, placeholder }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
        <input
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all text-slate-905 dark:text-white"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

interface WorkEditorProps {
    project?: any;
    onSave: (project: any) => Promise<void>;
    onCancel: () => void;
    isCreating?: boolean;
}

export const WorkEditor: React.FC<WorkEditorProps> = ({ project, onSave, onCancel, isCreating = false }) => {
    const [editingProject, setEditingProject] = useState<any>(project || {
        title: '',
        category: '',
        tech: [],
        description: '',
        longDescription: '',
        link: '',
        githubLink: '',
        color: 'blue',
        isClient: false,
        priority: 0
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        if (!editingProject.title?.trim()) {
            alert("Title is required");
            setSaving(false);
            return;
        }
        if (!editingProject.description?.trim()) {
            alert("Short Summary is required");
            setSaving(false);
            return;
        }

        try {
            await onSave(editingProject);
        } catch (e) {
            console.error(e);
            alert("Failed to save work");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isCreating ? "New Work" : "Edit Work"}
                </h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <Input
                    label="Work Title *"
                    value={editingProject.title}
                    onChange={(v: string) => setEditingProject({ ...editingProject, title: v })}
                    placeholder="Enter work / project title..."
                />

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-505 uppercase ml-1">Category</label>
                        <select
                            className="w-full bg-slate-55 dark:bg-slate-900 border border-slate-202 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                            value={editingProject.category || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {PROJECT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Technologies (comma separated)"
                        value={Array.isArray(editingProject.tech) ? editingProject.tech.join(', ') : editingProject.tech}
                        onChange={(v: string) => setEditingProject({ ...editingProject, tech: v.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="React, Next.js, Node.js"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label="Demo Link"
                        value={editingProject.link}
                        onChange={(v: string) => setEditingProject({ ...editingProject, link: v })}
                        placeholder="https://demo.com"
                    />
                    <Input
                        label="GitHub Link"
                        value={editingProject.githubLink}
                        onChange={(v: string) => setEditingProject({ ...editingProject, githubLink: v })}
                        placeholder="https://github.com/..."
                    />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <input
                        type="checkbox"
                        id="is_client"
                        checked={editingProject.isClient || false}
                        onChange={(e) => setEditingProject({ ...editingProject, isClient: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_client" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Commercial Client Project
                    </label>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Short Summary (Card Preview) *</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-24 outline-none focus:ring-2 ring-blue-500 text-sm text-slate-900 dark:text-white"
                            value={editingProject.description || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                            placeholder="Brief summary shown on the showcase card..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Full Work Details (Case Study)</label>
                        <RichTextEditor
                            value={editingProject.longDescription || ''}
                            onChange={(v: string) => setEditingProject({ ...editingProject, longDescription: v })}
                            placeholder="Describe your design decisions, technical implementation, and challenges..."
                            className="min-h-[400px]"
                            allowImages={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
