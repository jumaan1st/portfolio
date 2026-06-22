"use client";

import React, { useEffect, useState } from "react";
import { ProjectEditorPage } from "@/components/ProjectEditorPage";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import type { Project } from "@/data/portfolioData";

export default function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { data, updateProject, isAuthenticated, user, isLoading: contextLoading } = usePortfolio();
    const isFullAdmin = isAuthenticated && user?.role === 'admin';
    const router = useRouter();

    // Unwrap params using React.use()
    const { slug } = React.use(params);

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProject = async () => {
            if (contextLoading) return;
            
            try {
                // Ensure we fetch the full project from the backend. The 'data.projects'
                // context array is usually populated by the bootstrap API which omits heavy
                // fields like 'longDescription' (case study) and 'features' to save payload size.
                // Falling back to context early would cause us to overwrite them.
                const res = await fetch(`/api/projects?slug=${slug}&summary=false`);
                if (res.ok) {
                    const json = await res.json();
                    let fetched = json;
                    if (json.data) {
                        fetched = Array.isArray(json.data) ? json.data[0] : json.data;
                    }
                    if (fetched) {
                        setProject(fetched);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch project full data, attempting fallback", e);
            }

            // Fallback (only reached if API fetch fails or project not found natively above)
            const found = data.projects.find(p => p.slug === slug || String(p.id) === slug);
            if (found) {
                setProject(found);
            }
            setLoading(false);
        };

        if (!contextLoading) {
            loadProject();
        }
    }, [data.projects, slug, contextLoading]);

    useEffect(() => {
        if (!contextLoading && !isFullAdmin && !loading) {
            router.push("/projects");
        }
    }, [contextLoading, isFullAdmin, loading, router]);

    if (loading || contextLoading) return <div className="p-8 text-center flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
    if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

    const handleUpdate = async (updatedData: any) => {
        if (project) {
            await updateProject(project.id, updatedData);
        }
    };

    return (
        <ProjectEditorPage
            title={`Edit Project: ${project.title}`}
            initialData={project}
            onSaveAction={handleUpdate}
        />
    );
}
