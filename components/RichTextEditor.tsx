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
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'image',
    'color', 'background',
    'align', 'font', 'size'
];

import { Code, Eye, X } from 'lucide-react';
import { marked } from 'marked';


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
        const toolbarContainer = [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
            ['link'], // Always allow links
            ['clean']
        ];

        if (allowImages) {
            // With the new additions, the list/bullet/align line is at index 5
            (toolbarContainer[5] as any[]).push('image');
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
            blotFormatter: {},
            markdownShortcuts: {}
        };
    }, [imageHandler, allowImages]);

    const finalFormats = useMemo(() => allowImages ? formats : formats.filter(f => f !== 'image'), [allowImages]);


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
            `}</style>
        </div >
    );
};

export default RichTextEditor;
