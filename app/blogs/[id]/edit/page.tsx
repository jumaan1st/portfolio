"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BlogEditor } from '@/components/pages/BlogEditor';
import { usePortfolio } from '@/components/PortfolioContext';
import { BlogPost } from '@/data/portfolioData';
import { Loader2 } from 'lucide-react';

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated } = usePortfolio();
    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    const id = params.id as string;

    // Protect Route
    useEffect(() => {
        if (!isAuthenticated && !loading) {
            // wait for loading to finish potentially, or just check auth immediately if known
            // assuming isAuthenticated is reliable
        }
    }, [isAuthenticated, loading]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchBlog = async () => {
            try {
                const res = await fetch(`/api/blogs?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setBlog(data);
                } else {
                    alert('Blog not found');
                    router.push('/blogs');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [id, isAuthenticated, router]);

    const handleSave = async (updatedBlog: BlogPost) => {
        try {
            const res = await fetch(`/api/blogs?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBlog)
            });

            if (res.ok) {
                router.push('/blogs');
            } else {
                alert('Failed to update blog');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating blog');
        }
    };

    if (!isAuthenticated) {
        if (loading) return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
        router.push('/admin'); // Redirect if not auth
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                {blog && (
                    <BlogEditor
                        blog={blog}
                        onSave={handleSave}
                        onCancel={() => router.back()}
                        isCreating={false}
                    />
                )}
            </div>
        </div>
    );
}
