"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { usePortfolio } from "@/components/PortfolioContext";
import { ProjectDetailPage } from "@/components/pages/ProjectDetailPage";
import { ItemNotFound } from "@/components/ItemNotFound";

import { Project } from "@/data/portfolioData";

interface Props {
    initialProject?: Project;
}

export function ProjectClientRoute({ initialProject }: Props) {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { data } = usePortfolio();

    // Priority: initialProject (SSR) -> Context (Client Cache) -> undefined
    const [project, setProject] = React.useState<Project | undefined>(
        initialProject || data.projects.find((p) => p.slug === slug || String(p.id) === slug)
    );

    // If we have full details (longDescription) in initialProject, we are good.
    const hasFullDetails = project && (project.longDescription || project.features);
    const [loading, setLoading] = React.useState(!hasFullDetails);

    React.useEffect(() => {
        // If we switched project IDs via client routing or missing details
        const currentSlug = params.slug as string;
        if (project && (project.slug === currentSlug || String(project.id) === currentSlug) && hasFullDetails) {
            setLoading(false);
            return;
        }

        async function fetchProject() {
            setLoading(true);
            try {
                const res = await fetch(`/api/projects?slug=${currentSlug}`);
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
    }, [params.slug, project, hasFullDetails]); // Depends on params.slug to detect route changes

    if (loading) return <div className="p-12 text-center text-slate-500">Loading project details...</div>;

    if (!project) {
        return <ItemNotFound type="project" />;
    }

    return (
        <ProjectDetailPage
            project={project}
            onBack={() => router.push("/projects")}
        />
    );
}
