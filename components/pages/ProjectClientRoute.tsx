"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { ProjectDetailPage } from "@/components/pages/ProjectDetailPage";

export function ProjectClientRoute() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const { data } = usePortfolio();
    const [project, setProject] = React.useState(data.projects.find((p) => p.id === id));
    const [loading, setLoading] = React.useState(!project);

    React.useEffect(() => {
        // If we have the project but are missing details (like longDescription), we MUST fetch.
        // If we don't have the project at all, we MUST fetch.
        const needsFetch = !project || (!project.longDescription && !project.features);

        if (!needsFetch) {
            setLoading(false);
            return;
        }

        async function fetchProject() {
            setLoading(true);
            try {
                const res = await fetch(`/api/projects?id=${id}`);
                if (res.ok) {
                    const p = await res.json();
                    setProject(p);
                } else {
                    // If fetch fails but we had partial data, maybe keep it? 
                    // Or set undefined if we really need full data.
                    if (!project) setProject(undefined);
                }
            } catch (e) {
                console.error("Failed to fetch project", e);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id]); // Removed 'project' from dependency array to prevent loops, relying on explicit checks

    if (loading) return <div className="p-12 text-center text-slate-500">Loading project details...</div>;

    if (!project) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center text-slate-300">
                Project not found.
            </div>
        );
    }

    return (
        <ProjectDetailPage
            project={project}
            onBack={() => router.push("/projects")}
        />
    );
}
