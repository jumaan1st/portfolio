"use client";

import React, { useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import to avoid "document is not defined" error in Next.js SSR
// Dynamic import to avoid "document is not defined" error in Next.js SSR
// Comprehensive dynamic import to handle SSR and Plugin Registration
const ReactQuill = dynamic(async () => {
    const { default: RQ, Quill } = await import('react-quill-new');

    // Dynamic import of plugins to avoid server-side 'document' errors
    const { default: BlotFormatter } = await import('quill-blot-formatter');
    // markdown-shortcuts might be a commonjs export, handling that:
    const MarkdownShortcutsImport = await import('quill-markdown-shortcuts');
    const MarkdownShortcuts = MarkdownShortcutsImport.default || MarkdownShortcutsImport;

    // Register modules safely on client
    if (Quill) { // Ensure Quill exists
        if (!Quill.imports['modules/blotFormatter']) {
            Quill.register('modules/blotFormatter', BlotFormatter);
        }
        if (!Quill.imports['modules/markdownShortcuts']) {
            Quill.register('modules/markdownShortcuts', MarkdownShortcuts);
        }
    }

    // Return the component. forwardRef is handled by Next.js dynamic if the underlying component supports it.
    // However, explicit forwarding is safer if RQ is a class component.
    // For now, returning RQ directly usually works.
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
}, {
    ssr: false,
    loading: () => <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    allowImages?: boolean;
}

// FORMATS MUST BE OUTSIDE TO PREVENT RE-RENDERS/LOOPS
const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'indent',
    'link', 'image',
    'color', 'background',
    'align', 'font', 'size'
];

import { Code, Eye, X } from 'lucide-react';
import { marked } from 'marked';
import { useCodeBlockEnhancer } from '@/hooks/useCodeBlockEnhancer';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

if (typeof window !== 'undefined') {
    (window as any).hljs = hljs;
}


const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, allowImages = true }) => {
    const [isCodeView, setIsCodeView] = React.useState(false);

    // Auto-convert Markdown to HTML if the value doesn't look like HTML
    const displayValue = useMemo(() => {
        if (!value) return '';
        const trimmed = value.trim();
        // If it starts with <, it's likely already HTML (Quill output). 
        // If not, assume it's Markdown/Text and convert it.
        // We use a loose check because simple text "Hello" is also not HTML start.
        if (trimmed && !trimmed.startsWith('<')) {
            try {
                // marked.parse returns a string (Promise<string> in newer versions? No, sync by default unless async option used)
                // Typescript might complain if marked.parse returns Promise. 
                // Using 'await' inside useMemo isn't possible.
                // We'll assume sync version for now or handle it carefully.
                // Check marked version. 12+ is sync by default.
                return marked.parse(trimmed, { async: false }) as string;
            } catch (e) {
                return value;
            }
        }
        return value;
    }, [value]);

    // Use a ref to access the quill instance
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    // Custom File (Image/PDF) Handler
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*, .pdf');
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'blog-content'); // separate folder for content images

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await res.json();

                    if (data.success) {
                        const quill = quillRef.current?.getEditor();
                        const range = quill.getSelection(true) || { index: quill.getLength() };

                        if (file.type === 'application/pdf') {
                            // Insert Link for PDF
                            const linkText = file.name || 'Download PDF';
                            quill.insertText(range.index, linkText, 'link', data.url);
                            quill.setSelection(range.index + linkText.length);
                        } else {
                            // Insert Image embed
                            quill.insertEmbed(range.index, 'image', data.url);
                            quill.setSelection(range.index + 1);
                        }
                    } else {
                        alert('Upload failed');
                    }
                } catch (e) {
                    console.error('Error uploading file', e);
                    alert('Error uploading file');
                }
            }
        };
    }, []);











    const modules = useMemo(() => {
        const toolbarContainer: any[] = [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
        ];

        if (allowImages) {
            // Add image to the insert group (link group)
            // Finding the group with 'link'
            const linkGroupIndex = toolbarContainer.findIndex(group => Array.isArray(group) && group.includes('link'));
            if (linkGroupIndex !== -1) {
                (toolbarContainer[linkGroupIndex] as any[]).push('image');
            } else {
                toolbarContainer.push(['image']);
            }
        }

        return {
            toolbar: {
                container: toolbarContainer,
                handlers: {
                    image: imageHandler
                }
            },
            clipboard: {
                matchVisual: false
            },
            // Enable syntax module with explicit highlight function
            syntax: {
                highlight: (text: string) => hljs.highlightAuto(text).value,
            },
            blotFormatter: {},
            markdownShortcuts: {}
        };
    }, [imageHandler, allowImages]);

    const finalFormats = useMemo(() => allowImages ? formats : formats.filter(f => f !== 'image'), [allowImages]);

    // Apply enhanced code block styling to the editor content
    // We target the .ql-editor class which contains the content
    const editorContentRef = useRef<HTMLElement | null>(null);

    // Use the hook to enhance code blocks in the editor
    useCodeBlockEnhancer(editorContentRef, [value, isCodeView]);

    // Attach the ref to the .ql-editor element once it exists and trigger enhancement
    React.useEffect(() => {
        if (containerRef.current) {
            const editor = containerRef.current.querySelector('.ql-editor');
            if (editor) {
                // @ts-ignore - mutating ref for this specific use case
                editorContentRef.current = editor as HTMLElement;

                // Force a re-scan after a short delay to allow Quill to render
                setTimeout(() => {
                    if (editorContentRef.current) {
                        // We can trigger a mutation by toggling a data attribute or class
                        editorContentRef.current.dataset.enhanced = Date.now().toString();
                    }
                }, 100);
            }
        }
    }, [value, isCodeView]);


    return (
        <div ref={containerRef} className={`rich-text-editor ${className} relative`} >
            {/* Toolbar Actions */}
            < div className="absolute right-2 top-2 z-20 flex gap-2" >

                <button
                    type="button"
                    onClick={() => setIsCodeView(!isCodeView)}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                    title={isCodeView ? "Switch to Visual Editor" : "View Source Code"}
                >
                    {isCodeView ? <Eye size={18} /> : <Code size={18} />}
                </button>
            </div >

            {/* AI Magic Popover */}


            {
                isCodeView ? (
                    <textarea
                        className="w-full h-full min-h-[150px] p-4 font-mono text-sm bg-slate-900 text-slate-50 rounded-xl outline-none resize-y"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Write HTML here..."
                    />
                ) : (
                    <ReactQuill
                        forwardedRef={quillRef}
                        theme="snow"
                        value={displayValue}
                        onChange={onChange}
                        modules={modules}
                        formats={finalFormats}
                        placeholder={placeholder}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl overflow-hidden"
                    />
                )
            }
            {/* Custom Styles for Quill in Dark Mode */}
            <style jsx global>{`
                .ql-toolbar.ql-snow {
                    border-color: #e2e8f0;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    background-color: #f8fafc;
                }
                .dark .ql-toolbar.ql-snow {
                    border-color: #334155;
                    background-color: #1e293b;
                }
                .dark .ql-stroke {
                    stroke: #94a3b8;
                }
                .dark .ql-fill {
                    fill: #94a3b8;
                }
                .dark .ql-picker {
                    color: #94a3b8;
                }
                .ql-container.ql-snow {
                    border-color: #e2e8f0;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    min-height: 150px;
                }
                .dark .ql-container.ql-snow {
                    border-color: #334155;
                    background-color: #0f172a;
                    color: #f8fafc; /* Slate-50 */
                }
                .dark .ql-editor {
                    color: #f8fafc;
                }
                .dark .ql-editor.ql-blank::before {
                    color: #94a3b8; /* Slate-400 */
                    font-style: italic;
                }
                .ql-editor {
                    min-height: 150px;
                    font-size: 1rem;
                    line-height: 1.6;
                }
                .ql-editor img {
                    max-width: 100%;
                    border-radius: 0.5rem;
                }
                /* FORCE TOOLBAR WRAPPING FOR MOBILE RESPONSIVENESS */
                .ql-toolbar {
                    display: flex !important;
                    flex-wrap: wrap !important;
                }
                
                /* ========================================
                   ENHANCED CODE BLOCK STYLES IN EDITOR
                   ======================================== */

                /* Base code block styling with enhanced appearance */
                .ql-editor pre.ql-syntax {
                    background-color: #1e293b !important;
                    color: #f8fafc !important;
                    padding: 1rem !important;
                    padding-top: 2.5rem !important; /* Space for header */
                    border-radius: 0.75rem !important;
                    overflow-x: auto !important;
                    font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace !important;
                    margin: 1.5rem 0 !important;
                    position: relative;
                    border: 1px solid #334155 !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
                    font-size: 0.875rem !important;
                    line-height: 1.7 !important;
                }

                .dark .ql-editor pre.ql-syntax {
                    background-color: #020617 !important;
                    border-color: #1e293b !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3) !important;
                }

                /* Code block header with language label */
                .ql-editor pre.ql-syntax::before {
                    content: attr(data-language, 'Code Block');
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding: 0.5rem 1rem;
                    background-color: #334155;
                    color: #94a3b8;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    border-bottom: 1px solid #475569;
                    border-radius: 0.75rem 0.75rem 0 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .dark .ql-editor pre.ql-syntax::before {
                    background-color: #1e293b;
                    border-color: #334155;
                    color: #cbd5e1;
                }

                /* Language-specific labels */
                .ql-editor pre.ql-syntax.language-javascript::before { content: '⚡ JavaScript'; color: #fbbf24; }
                .ql-editor pre.ql-syntax.language-typescript::before { content: '🔷 TypeScript'; color: #3b82f6; }
                .ql-editor pre.ql-syntax.language-python::before { content: '🐍 Python'; color: #3b82f6; }
                .ql-editor pre.ql-syntax.language-java::before { content: '☕ Java'; color: #ef4444; }
                .ql-editor pre.ql-syntax.language-cpp::before { content: '⚙️ C++'; color: #06b6d4; }
                .ql-editor pre.ql-syntax.language-csharp::before { content: '💎 C#'; color: #a855f7; }
                .ql-editor pre.ql-syntax.language-php::before { content: '🐘 PHP'; color: #8b5cf6; }
                .ql-editor pre.ql-syntax.language-ruby::before { content: '💎 Ruby'; color: #ef4444; }
                .ql-editor pre.ql-syntax.language-go::before { content: '🔵 Go'; color: #06b6d4; }
                .ql-editor pre.ql-syntax.language-rust::before { content: '🦀 Rust'; color: #f59e0b; }
                .ql-editor pre.ql-syntax.language-swift::before { content: '🍎 Swift'; color: #f97316; }
                .ql-editor pre.ql-syntax.language-kotlin::before { content: '🟣 Kotlin'; color: #a855f7; }
                .ql-editor pre.ql-syntax.language-sql::before { content: '🗄️ SQL'; color: #ec4899; }
                .ql-editor pre.ql-syntax.language-html::before { content: '🌐 HTML'; color: #f97316; }
                .ql-editor pre.ql-syntax.language-css::before { content: '🎨 CSS'; color: #3b82f6; }
                .ql-editor pre.ql-syntax.language-json::before { content: '📦 JSON'; color: #10b981; }
                .ql-editor pre.ql-syntax.language-bash::before { content: '💻 Bash'; color: #10b981; }
                .ql-editor pre.ql-syntax.language-shell::before { content: '🐚 Shell'; color: #10b981; }

                /* Custom scrollbar for code blocks */
                .ql-editor pre.ql-syntax {
                    scrollbar-width: thin;
                    scrollbar-color: #475569 #1e293b;
                }

                .ql-editor pre.ql-syntax::-webkit-scrollbar {
                    height: 8px;
                }

                .ql-editor pre.ql-syntax::-webkit-scrollbar-track {
                    background: #1e293b;
                    border-radius: 0 0 0.75rem 0.75rem;
                }

                .ql-editor pre.ql-syntax::-webkit-scrollbar-thumb {
                    background: #475569;
                    border-radius: 4px;
                }

                .ql-editor pre.ql-syntax::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }

                /* Syntax highlighting colors */
                .ql-editor pre.ql-syntax .hljs-keyword,
                .ql-editor pre.ql-syntax .hljs-selector-tag,
                .ql-editor pre.ql-syntax .hljs-title {
                    color: #c792ea !important;
                    font-weight: 600;
                }

                .ql-editor pre.ql-syntax .hljs-string,
                .ql-editor pre.ql-syntax .hljs-attr {
                    color: #c3e88d !important;
                }

                .ql-editor pre.ql-syntax .hljs-number,
                .ql-editor pre.ql-syntax .hljs-literal {
                    color: #f78c6c !important;
                }

                .ql-editor pre.ql-syntax .hljs-comment {
                    color: #546e7a !important;
                    font-style: italic;
                }

                .ql-editor pre.ql-syntax .hljs-function,
                .ql-editor pre.ql-syntax .hljs-params {
                    color: #82aaff !important;
                }

                .ql-editor pre.ql-syntax .hljs-built_in,
                .ql-editor pre.ql-syntax .hljs-class .hljs-title {
                    color: #ffcb6b !important;
                }

                .ql-editor pre.ql-syntax .hljs-variable,
                .ql-editor pre.ql-syntax .hljs-template-variable {
                    color: #f07178 !important;
                }

                .ql-editor pre.ql-syntax .hljs-tag,
                .ql-editor pre.ql-syntax .hljs-name {
                    color: #f07178 !important;
                }

                .ql-editor pre.ql-syntax .hljs-attribute {
                    color: #c792ea !important;
                }

                .ql-editor pre.ql-syntax .hljs-regexp,
                .ql-editor pre.ql-syntax .hljs-link {
                    color: #89ddff !important;
                }

                .ql-editor pre.ql-syntax .hljs-symbol,
                .ql-editor pre.ql-syntax .hljs-bullet {
                    color: #f78c6c !important;
                }

                /* Line highlighting on hover */
                .ql-editor pre.ql-syntax:hover {
                    border-color: #475569 !important;
                }

                /* Focus state */
                .ql-editor:focus pre.ql-syntax {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                /* Inline code styling */
                .ql-editor code:not(pre code) {
                    padding: 0.125rem 0.375rem;
                    background-color: #334155;
                    color: #fbbf24;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                    font-family: 'Fira Code', ui-monospace, monospace;
                    font-weight: 500;
                    border: 1px solid #475569;
                }

                .dark .ql-editor code:not(pre code) {
                    background-color: #1e293b;
                    border-color: #334155;
                    color: #fcd34d;
                }
                
                /* Hide the duplicate "Plain" dropdown if our enhancer is working */
                /* But keep it if the enhancer fails for some reason */
                
            `}</style>
        </div >
    );
};

export default RichTextEditor;
