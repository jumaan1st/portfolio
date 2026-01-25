"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { ProjectDetailPage } from "@/components/pages/ProjectDetailPage";

import { Project } from "@/data/portfolioData";

interface Props {
    initialProject?: Project;
}

export function ProjectClientRoute({ initialProject }: Props) {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const { data } = usePortfolio();

    // Priority: initialProject (SSR) -> Context (Client Cache) -> undefined
    const [project, setProject] = React.useState<Project | undefined>(
        initialProject || data.projects.find((p) => p.id === id)
    );

    // If we have full details (longDescription) in initialProject, we are good.
    const hasFullDetails = project && (project.longDescription || project.features);
    const [loading, setLoading] = React.useState(!hasFullDetails);

    React.useEffect(() => {
        // If we switched project IDs via client routing or missing details
        const currentId = Number(params.id);
        if (project && project.id === currentId && hasFullDetails) {
            setLoading(false);
            return;
        }

        async function fetchProject() {
            setLoading(true);
            try {
                const res = await fetch(`/api/projects?id=${currentId}`);
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
    }, [params.id, project, hasFullDetails]); // Depends on params.id to detect route changes

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
