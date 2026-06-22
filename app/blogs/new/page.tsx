"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditor } from '@/components/pages/BlogEditor';
import { usePortfolio } from '@/components/PortfolioContext';
import { BlogPost } from '@/data/portfolioData';

export default function NewBlogPage() {
    const router = useRouter();
    const { createBlog, isAuthenticated, user } = usePortfolio();
    const isFullAdmin = isAuthenticated && user?.role === 'admin';

    // Protect Route
    React.useEffect(() => {
        if (!isFullAdmin) {
            router.push('/admin');
        }
    }, [isFullAdmin, router]);

    const handleSave = async (blog: BlogPost) => {
        try {
            // Context createBlog might not return the new ID depending on implementation, 
            // but we can use the API directly if we want to be sure, or trust createBlog.
            // Let's use the API directly to be consistent with the plan.
            const res = await fetch('/api/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blog)
            });

            if (res.ok) {
                router.push('/blogs');
            } else {
                alert('Failed to create blog');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating blog');
        }
    };

    if (!isFullAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <BlogEditor
                    onSave={handleSave}
                    onCancel={() => router.back()}
                    isCreating={true}
                />
            </div>
        </div>
    );
}
