"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkEditor } from '@/components/pages/WorkEditor';
import { usePortfolio } from '@/components/PortfolioContext';
import { Loader2 } from 'lucide-react';

export default function EditWorkPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated, user } = usePortfolio();
    const isFullAdmin = isAuthenticated && user?.role === 'admin';
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const slug = params.slug as string;

    useEffect(() => {
        if (!isFullAdmin) return;

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects?slug=${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                } else {
                    alert('Work not found');
                    router.push('/works');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [slug, isFullAdmin, router]);

    const handleSave = async (updatedProject: any) => {
        if (!project) return;
        if (user?.role === 'view_only_admin') {
            alert('Permission Denied: View-only admin cannot modify work');
            return;
        }

        try {
            const res = await fetch(`/api/projects?id=${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProject)
            });

            if (res.ok) {
                router.push('/works');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update work');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating work');
        }
    };

    if (!isFullAdmin) {
        if (loading) return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-955">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
        router.push('/admin'); // Redirect if not auth
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-955">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                {project && (
                    <WorkEditor
                        project={project}
                        onSave={handleSave}
                        onCancel={() => router.back()}
                        isCreating={false}
                    />
                )}
            </div>
        </div>
    );
}
