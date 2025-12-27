"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Trash2, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { FileUploader } from '@/components/FileUploader';
import { BLOG_TAGS } from '@/data/constants';
import type { BlogPost } from '@/data/portfolioData';

// Replicating basic Input component to avoid dependency issues if it's local
const Input = ({ label, value, onChange, placeholder }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
        <input
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

interface BlogEditorProps {
    blog?: BlogPost;
    onSave: (blog: BlogPost) => Promise<void>;
    onCancel: () => void;
    isCreating?: boolean;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ blog, onSave, onCancel, isCreating = false }) => {
    const [editingBlog, setEditingBlog] = useState<Partial<BlogPost>>(blog || {
        title: '',
        excerpt: '',
        content: '',
        tags: [],
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        readTime: '5 min read',
        image: '',
        is_hidden: false
    });
    const [saving, setSaving] = useState(false);

    const extractImageFromContent = (htmlContent: string): string | undefined => {
        if (!htmlContent) return undefined;
        // Simple regex to find src of first img tag
        const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
        return match ? match[1] : undefined;
    };

    // Auto-calculate read time
    React.useEffect(() => {
        if (!editingBlog.content) return;
        const text = editingBlog.content.replace(/<[^>]*>/g, ''); // Strip HTML
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        const readTime = `${minutes} min read`;
        if (readTime !== editingBlog.readTime) {
            setEditingBlog(prev => ({ ...prev, readTime }));
        }
    }, [editingBlog.content]);

    // Helpers for Date Picker
    const formatDateForInput = (dateString: string | undefined) => {
        if (!dateString) return new Date().toISOString().split('T')[0];
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value);
        // Format to "Jan 1, 2024" style
        const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        setEditingBlog({ ...editingBlog, date: formatted });
    };

    const handleSave = async () => {
        setSaving(true);
        if (!editingBlog.title?.trim()) {
            alert("Title is required");
            setSaving(false);
            return;
        }
        if (!editingBlog.excerpt?.trim() || editingBlog.excerpt === '<p><br></p>') {
            alert("Excerpt is required");
            setSaving(false);
            return;
        }
        if (!editingBlog.content?.trim() || editingBlog.content === '<p><br></p>') {
            alert("Content is required");
            setSaving(false);
            return;
        }

        try {
            const finalBlog = { ...editingBlog };
            // Auto-set cover image if missing
            if (!finalBlog.image && finalBlog.content) {
                const extracted = extractImageFromContent(finalBlog.content);
                if (extracted) {
                    finalBlog.image = extracted;
                }
            }
            await onSave(finalBlog as BlogPost);
        } catch (e) {
            console.error(e);
            alert("Failed to save blog post");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isCreating ? "New Article" : "Edit Article"}
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <Input
                    label="Article Title *"
                    value={editingBlog.title}
                    onChange={(v: string) => setEditingBlog({ ...editingBlog, title: v })}
                    placeholder="Enter an engaging title..."
                />

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Publish Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all text-slate-700 dark:text-slate-200"
                            value={formatDateForInput(editingBlog.date)}
                            onChange={handleDateChange}
                        />
                    </div>
                    <Input
                        label="Read Time (Auto)"
                        value={editingBlog.readTime}
                        onChange={(v: string) => setEditingBlog({ ...editingBlog, readTime: v })}
                        placeholder="Calculated automatically..."
                    />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <input
                        type="checkbox"
                        id="is_hidden"
                        checked={editingBlog.is_hidden || false}
                        onChange={(e) => setEditingBlog({ ...editingBlog, is_hidden: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_hidden" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Keep this post Hidden (Draft)
                    </label>
                </div>

                {/* Cover Image Upload Logic inline or component */}
                <div className="space-y-2">
                    <FileUploader
                        label="Cover Image"
                        value={editingBlog.image || ''}
                        onChange={(url: string) => setEditingBlog({ ...editingBlog, image: url })}
                        folder="blog-covers"
                    />
                </div>

                <div>
                    <Input
                        label="Tags (comma separated)"
                        value={Array.isArray(editingBlog.tags) ? editingBlog.tags.join(', ') : editingBlog.tags}
                        onChange={(v: string) => setEditingBlog({ ...editingBlog, tags: v.split(',').map(s => s.trim()) })}
                    />
                    <div className="flex flex-wrap gap-2 mt-2 px-1">
                        <span className="text-xs text-slate-400">Quick Add:</span>
                        {BLOG_TAGS.slice(0, 8).map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    const currentTags = Array.isArray(editingBlog.tags)
                                        ? editingBlog.tags
                                        : (editingBlog.tags ? (editingBlog.tags as any).split(',') : []);
                                    const cleanTags = currentTags.map((t: string) => t.trim()).filter(Boolean);

                                    if (!cleanTags.includes(tag)) {
                                        const newTags = [...cleanTags, tag];
                                        setEditingBlog({ ...editingBlog, tags: newTags });
                                    }
                                }}
                                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-purple-100 hover:text-purple-600 transition-colors"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Excerpt (Summary) *</label>
                        <RichTextEditor
                            value={editingBlog.excerpt || ''}
                            onChange={v => setEditingBlog({ ...editingBlog, excerpt: v })}
                            placeholder="Short summary for the card view..."
                            className="min-h-[100px]"
                            allowImages={false}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Content *</label>
                        <RichTextEditor
                            value={editingBlog.content || ''}
                            onChange={v => setEditingBlog({ ...editingBlog, content: v })}
                            placeholder="Write your article here..."
                            className="min-h-[400px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
