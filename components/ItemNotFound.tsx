
import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

interface ItemNotFoundProps {
    type: 'blog' | 'project';
}

export const ItemNotFound: React.FC<ItemNotFoundProps> = ({ type }) => {
    const isBlog = type === 'blog';
    const label = isBlog ? 'Blog Post' : 'Project';
    const backLink = isBlog ? '/blogs' : '/projects';
    const backLabel = isBlog ? 'Back to Articles' : 'Back to Projects';

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-full mb-6 relative group">
                <FileQuestion size={48} className="text-slate-400 dark:text-slate-500" />
                <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping opacity-75 hidden group-hover:block" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {label} Not Found
            </h1>

            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
                The link you followed may be broken, or the page may have been moved.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href={backLink}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    <ArrowLeft size={18} />
                    {backLabel}
                </Link>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold transition-all"
                >
                    <Home size={18} />
                    Home
                </Link>
            </div>
        </div>
    );
};
