"use client";

import React, { useEffect, useState } from "react";
import { ProjectEditorPage } from "@/components/ProjectEditorPage";
import { usePortfolio } from "@/components/PortfolioContext";
import { useRouter } from "next/navigation";
import type { Project } from "@/data/portfolioData";

export default function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { data, updateProject, isAuthenticated, isLoading: contextLoading } = usePortfolio();
    const router = useRouter();

    // Unwrap params using React.use()
    const { slug } = React.use(params);

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProject = async () => {
            // 1. Try finding in Context by slug
            const found = data.projects.find(p => p.slug === slug || String(p.id) === slug);
            if (found) {
                setProject(found);
                setLoading(false);
                return;
            }

            // 2. Fallback: Fetch from API
            if (!contextLoading) {
                try {
                    const res = await fetch(`/api/projects?slug=${slug}`);
                    if (res.ok) {
                        const json = await res.json();
                        // Correctly handle direct object response (from new API) or wrapper
                        let fetched = json;
                        if (json.data) {
                            fetched = Array.isArray(json.data) ? json.data[0] : json.data;
                        }
                        setProject(fetched);
                    }
                } catch (e) {
                    console.error("Failed to fetch project", e);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadProject();
    }, [data.projects, slug, contextLoading]);

    useEffect(() => {
        if (!contextLoading && !isAuthenticated) {
            // Only redirect if effectively loaded and confirmed not auth
            router.push("/projects");
        }
    }, [contextLoading, isAuthenticated, router]);

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
