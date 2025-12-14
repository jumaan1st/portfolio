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
    const project = data.projects.find((p) => p.id === id);

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
