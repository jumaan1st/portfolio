import { useEffect } from 'react';
import hljs from 'highlight.js';

export const useCodeBlockEnhancer = (
    containerRef: React.RefObject<HTMLElement | null>,
    contentDependencies: any[]
) => {
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        const enhance = () => {
            const container = containerRef.current;
            if (!container) return;

            // Target existing Quill blocks or raw pre blocks
            const blocks = container.querySelectorAll('pre.ql-syntax, pre:not(.code-block-wrapper pre)');

            blocks.forEach((block) => {
                const el = block as HTMLElement;
                const isWrapped = block.parentElement?.classList.contains('code-block-wrapper');

                // 1. Language Detection
                let lang = 'Text';
                let detectedClass = '';

                // Explicit Class Check
                el.classList.forEach(cls => {
                    if (cls.startsWith('language-')) {
                        lang = cls.replace('language-', '');
                        detectedClass = cls;
                    } else if (['csharp', 'cs', 'cpp', 'c++', 'python', 'py', 'javascript', 'js', 'typescript', 'ts', 'html', 'xml', 'css', 'java', 'sql', 'bash', 'sh'].includes(cls)) {
                        lang = cls;
                        detectedClass = `language-${cls}`;
                    }
                });

                // Quill Data Attribute Check
                if (!detectedClass && el.dataset.language && el.dataset.language !== 'uni') {
                    lang = el.dataset.language;
                }

                // Auto-Detect if strictly "Text" or missing
                // We use highlightElement to let it try its best, then see what class it added
                if (!el.dataset.highlighted) {
                    hljs.highlightElement(el);
                    el.dataset.highlighted = 'true';
                }

                // Check for HLJS added class
                if (lang === 'Text' || lang === 'undefined') {
                    const match = el.className.match(/language-([a-z0-9]+)/);
                    if (match) {
                        lang = match[1];
                    } else {
                        // Fallback to searching all classes for known langs
                        const classes = Array.from(el.classList);
                        const known = classes.find(c => !c.startsWith('ql-') && c !== 'hljs');
                        if (known) lang = known;
                    }
                }

                // Normalization
                const langMap: Record<string, string> = {
                    'cs': 'C#', 'csharp': 'C#', 'cpp': 'C++', 'c++': 'C++',
                    'js': 'JavaScript', 'javascript': 'JavaScript',
                    'ts': 'TypeScript', 'typescript': 'TypeScript',
                    'py': 'Python', 'python': 'Python',
                    'html': 'HTML', 'xml': 'HTML', 'css': 'CSS',
                    'java': 'Java', 'bash': 'Bash', 'sh': 'Bash', 'shell': 'Bash',
                    'json': 'JSON', 'sql': 'SQL', 'ini': 'Text', 'makefile': 'Text'
                };

                if (langMap[lang.toLowerCase()]) {
                    lang = langMap[lang.toLowerCase()];
                } else {
                    lang = lang.charAt(0).toUpperCase() + lang.slice(1);
                }

                // 2. Line Numbers (Optional Enhancement)
                // Only add if not already present and content has multiple lines
                const lines = el.innerHTML.split(/\n/);
                if (lines.length > 2 && !el.classList.contains('has-line-numbers')) {
                    // Adding line numbers can be tricky with HLJS structure. 
                    // Simple approach: don't touch HTML structure, rely on CSS counters?
                    // Or basic wrapper?
                    // For stability with Quill, we skip complex line number injection for now 
                    // to avoid breaking edit functionality, as Quill hates DOM meddling.
                }

                // 3. Update Existing Wrapper
                if (isWrapped) {
                    const wrapper = block.parentElement as HTMLElement;
                    const langLabel = wrapper.querySelector('.lang-label');
                    if (langLabel && langLabel.textContent !== lang) {
                        langLabel.textContent = lang;
                    }
                    return;
                }

                // 4. Create New Wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper relative group my-8 rounded-xl overflow-hidden border border-slate-700 shadow-2xl transition-all bg-[#0f172a]';
                wrapper.contentEditable = "false"; // Protect wrapper structure

                // Header
                const header = document.createElement('div');
                header.className = 'flex justify-between items-center px-4 py-2 bg-[#1e293b] border-b border-slate-700 text-xs font-mono select-none';
                header.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="flex gap-1.5">
                            <span class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                            <span class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                            <span class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                        </div>
                        <span class="ml-3 font-semibold text-slate-400 lang-label">${lang}</span>
                    </div>
                    <button class="copy-btn text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-700 font-medium focus:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy
                    </button>
                `;

                // Wrapper Insertion
                // We must be careful not to break Quill's internal reconciliation
                // Inserting *around* the block is risky in Quill. 
                // But since we set contentEditable=false on the wrapper, Quill ignores it? 
                // Quill might delete the wrapper on next edit. 
                // For Editor, we might need to be less aggressive than Display.
                // However, the user specifically asked for Editor styling.

                block.parentNode?.insertBefore(wrapper, block);
                wrapper.appendChild(header);
                wrapper.appendChild(block);

                // CSS styling is handled by globals.css now

                // Copy Logic
                const btn = header.querySelector('.copy-btn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        const code = el.textContent || '';
                        navigator.clipboard.writeText(code).then(() => {
                            const originalHTML = btn.innerHTML;
                            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg> <span class="text-green-400">Copied!</span>`;
                            setTimeout(() => {
                                btn.innerHTML = originalHTML;
                            }, 2000);
                        });
                    });
                }
            });
        };

        enhance();

        // Polling to catch late renders or updates
        const timer1 = setTimeout(enhance, 100);
        const timer2 = setTimeout(enhance, 500);

        // Mutation Observer for dynamic changes (typing in editor)
        if (containerRef.current) {
            const observer = new MutationObserver((mutations) => {
                let shouldEnhance = false;
                mutations.forEach((m) => {
                    if (m.addedNodes.length > 0 || m.type === 'characterData') shouldEnhance = true;
                });
                if (shouldEnhance) enhance();
            });
            observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });

            return () => {
                observer.disconnect();
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [containerRef, ...contentDependencies]);
};
