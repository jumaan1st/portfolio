import React, { useState, useEffect } from "react";
import { X, Save, Github, Sparkles, Wand2, Loader2, Send } from "lucide-react";
import { Project } from "@/data/portfolioData";
import { PROJECT_CATEGORIES } from "@/data/constants";
import RichTextEditor from "./RichTextEditor";
import { FileUploader } from "./FileUploader";
import { extractFirstImage } from "@/lib/utils";
import { useToast } from "./ui/Toast";
import ReactMarkdown from "react-markdown";

interface ProjectEditorProps {
    initialData?: Partial<Project>;
    onSave: (project: Partial<Project>) => Promise<void>;
    onCancel: () => void;
    title?: string;
    isFullPage?: boolean;
    onDirtyChange?: (isDirty: boolean) => void;
}

const Input = ({ label, value, onChange, placeholder }: { label: string, value: any, onChange: (v: string) => void, placeholder?: string }) => (
    <div className="w-full min-w-0">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{label}</label>
        <input
            className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 ring-blue-500 transition-all placeholder:text-slate-400"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ initialData, onSave, onCancel, title, isFullPage, onDirtyChange }) => {
    const { addToast } = useToast();
    const [project, setProject] = useState<Partial<Project>>(initialData || {});
    const [isSaving, setIsSaving] = useState(false);

    // AI README States
    const [showReadmeModal, setShowReadmeModal] = useState(false);
    const [readmeContent, setReadmeContent] = useState("");
    const [isGeneratingReadme, setIsGeneratingReadme] = useState(false);
    const [isPushingReadme, setIsPushingReadme] = useState(false);

    // Track dirty state
    useEffect(() => {
        if (!onDirtyChange) return;
        const isModified = JSON.stringify(project) !== JSON.stringify(initialData || {});
        onDirtyChange(isModified);
    }, [project, initialData, onDirtyChange]);

    const handleSave = async () => {
        if (!project.title?.trim()) {
            addToast("Project Title is required", "error");
            return;
        }

        if (!project.description?.trim()) {
            addToast("Short Summary is required", "error");
            return;
        }

        setIsSaving(true);
        try {
            // Auto-set cover image if missing
            if (!project.image && project.longDescription) {
                const extracted = extractFirstImage(project.longDescription);
                if (extracted) project.image = extracted;
            }
            await onSave(project);
            addToast("Project saved successfully!", "success");
        } catch (error) {
            console.error("Failed to save project:", error);
            addToast("Failed to save project. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateReadme = async () => {
        if (!project.title || !project.description) {
            addToast("Please fill in Title and Summary first.", "info");
            return;
        }

        setIsGeneratingReadme(true);
        try {
            const res = await fetch('/api/admin/github/generate-readme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project)
            });
            const data = await res.json();

            if (res.ok && data.markdown) {
                setReadmeContent(data.markdown);
                setShowReadmeModal(true);
                addToast("README generated successfully!", "success");
            } else {
                addToast(data.error || "Failed to generate README", "error");
            }
        } catch (error) {
            addToast("Network error generating README", "error");
        } finally {
            setIsGeneratingReadme(false);
        }
    };

    const handlePushReadme = async () => {
        if (!project.githubLink || !project.githubLink.includes('github.com')) {
            addToast("Invalid GitHub Link. Please check.", "error");
            return;
        }

        setIsPushingReadme(true);
        try {
            const res = await fetch('/api/admin/github/push-readme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubLink: project.githubLink,
                    content: readmeContent
                })
            });
            const data = await res.json();

            if (res.ok) {
                addToast("README pushed to GitHub successfully!", "success");
                setShowReadmeModal(false);
            } else {
                addToast(data.error || "Failed to push to GitHub", "error");
            }
        } catch (error) {
            addToast("Network error pushing to GitHub", "error");
        } finally {
            setIsPushingReadme(false);
        }
    };

    const containerClasses = isFullPage
        ? "bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 relative"
        : "bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto relative";

    return (
        <div className={containerClasses}>
            {/* Blocking Overlay during Generation */}
            {isGeneratingReadme && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                            <Loader2 size={40} className="text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Generating README...</h3>
                            <p className="text-xs text-slate-500"> analyzing project details & crafting content</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title || "Edit Project"}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateReadme}
                        disabled={isGeneratingReadme}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-bold rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingReadme ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isGeneratingReadme ? "Generating..." : "AI README"}
                    </button>
                    <button onClick={onCancel} disabled={isGeneratingReadme} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <Input label="Project Title *" value={project.title} onChange={v => setProject({ ...project, title: v })} placeholder="e.g. My Awesome App" />

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
                <Input label="Demo Link" value={project.link} onChange={v => setProject({ ...project, link: v })} placeholder="https://demo.com" />
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">GitHub Repository</label>
                    <button
                        onClick={handleGenerateReadme} disabled={isGeneratingReadme}
                        className="sm:hidden text-xs font-bold text-purple-600 flex items-center gap-1"
                    >
                        <Sparkles size={12} /> Auto-Readme
                    </button>
                </div>
                <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all"
                        value={project.githubLink || ''}
                        onChange={e => setProject({ ...project, githubLink: e.target.value })}
                        placeholder="https://github.com/username/repo"
                    />
                    <button
                        onClick={handleGenerateReadme}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-200 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title="Generate README with AI"
                    >
                        <Wand2 size={12} /> Generate
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Provide the GitHub link to enable Auto-README generation.</p>
            </div>

            <Input
                label="Technologies (comma separated)"
                value={Array.isArray(project.tech) ? project.tech.join(', ') : project.tech}
                onChange={v => setProject({ ...project, tech: v.split(',').map(s => s.trim()) })}
                placeholder="React, Next.js, Node.js"
            />
            <FileUploader label="Project Image" value={project.image || ''} onChange={(v: string) => setProject({ ...project, image: v })} folder="projects" />

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Short Summary (Card Preview) *</label>
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

            {/* README PREVIEW MODAL */}
            {showReadmeModal && (
                <ReadmeModal
                    content={readmeContent}
                    onClose={() => setShowReadmeModal(false)}
                    onPush={handlePushReadme}
                    onUpdate={(val) => setReadmeContent(val)}
                    isPushing={isPushingReadme}
                />
            )}
        </div>
    );
};

const ReadmeModal = ({ content, onClose, onPush, onUpdate, isPushing }: {
    content: string,
    onClose: () => void,
    onPush: () => void,
    onUpdate: (v: string) => void,
    isPushing: boolean
}) => {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('preview');
    // Lazy import plugin if needed, or just use basic react-markdown
    // We need to import ReactMarkdown at top level, but for now assuming it's available in scope or we hoist it.

    // NOTE: This sub-component helps keep state clean. 
    // Ideally I should move this to a separate file, but inline is fine for now as requested by the flow.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Github size={20} /> README.md {activeTab === 'preview' ? 'Preview' : 'Editor'}
                        </h3>
                        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('write')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'write' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Write
                            </button>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Preview
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
                    {activeTab === 'write' ? (
                        <textarea
                            className="w-full h-full resize-none p-6 font-mono text-sm leading-relaxed outline-none bg-transparent text-slate-800 dark:text-slate-200"
                            value={content}
                            onChange={e => onUpdate(e.target.value)}
                            placeholder="Type your markdown here..."
                        />
                    ) : (
                        <div className="h-full overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl">
                    <p className="text-xs text-slate-500 hidden sm:block">
                        {activeTab === 'write' ? 'Supports standard Markdown syntax.' : 'Preview mode showing GitHub-style rendering.'}
                    </p>
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onPush}
                            disabled={isPushing}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-purple-500/10"
                        >
                            {isPushing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Push to GitHub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
