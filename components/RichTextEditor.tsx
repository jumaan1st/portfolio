"use client";

import React, { useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import to avoid "document is not defined" error in Next.js SSR
// Dynamic import to avoid "document is not defined" error in Next.js SSR
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as any;

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
    'link', 'image'
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, allowImages = true }) => {

    // Use a ref to access the quill instance
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
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'], // Always allow links
            ['clean']
        ];

        if (allowImages) {
            (toolbarContainer[3] as any[]).push('image');
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
            }
        };
    }, [imageHandler, allowImages]);

    const finalFormats = useMemo(() => allowImages ? formats : formats.filter(f => f !== 'image'), [allowImages]);

    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={finalFormats}
                placeholder={placeholder}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl overflow-hidden"
            />
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
                    color: white;
                }
                .ql-editor {
                    min-height: 150px;
                    font-size: 1rem;
                    line-height: 1.6;
                }
                .ql-editor img {
                    max-width: 100%;
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                    display: block;
                }
                /* FORCE TOOLBAR WRAPPING FOR MOBILE RESPONSIVENESS */
                .ql-toolbar {
                    display: flex !important;
                    flex-wrap: wrap !important;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
