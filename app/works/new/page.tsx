"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { WorkEditor } from '@/components/pages/WorkEditor';
import { usePortfolio } from '@/components/PortfolioContext';

export default function NewWorkPage() {
    const router = useRouter();
    const { isAuthenticated, user } = usePortfolio();
    const isFullAdmin = isAuthenticated && user?.role === 'admin';

    // Protect Route
    React.useEffect(() => {
        if (!isFullAdmin) {
            router.push('/admin');
        }
    }, [isFullAdmin, router]);

    const handleSave = async (project: any) => {
        if (user?.role === 'view_only_admin') {
            alert('Permission Denied: View-only admin cannot create work');
            return;
        }

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project)
            });

            if (res.ok) {
                router.push('/works');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create work');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating work');
        }
    };

    if (!isFullAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <WorkEditor
                    onSave={handleSave}
                    onCancel={() => router.back()}
                    isCreating={true}
                />
            </div>
        </div>
    );
}
