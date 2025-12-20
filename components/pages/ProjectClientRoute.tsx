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
        if (project) return;

        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects?id=${id}`);
                if (res.ok) {
                    const p = await res.json();
                    setProject(p);
                } else {
                    setProject(undefined);
                }
            } catch (e) {
                console.error("Failed to fetch project", e);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id, project]);

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
