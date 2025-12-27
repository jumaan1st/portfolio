"use client";

import React from "react";
import { ProjectEditorPage } from "@/components/ProjectEditorPage";
import { usePortfolio } from "@/components/PortfolioContext";

export default function NewProjectPage() {
    const { createProject, isAuthenticated } = usePortfolio();

    // Security check - redirect if not authenticated handled by layout or component? 
    // PortfolioProvider doesn't auto-redirect, but we can return null or message.
    // Ideally authentication should be robust, but let's hide content.
    if (!isAuthenticated) {
        return <div className="p-8 text-center text-slate-500">Access Denied</div>;
    }

    return (
        <ProjectEditorPage
            title="Start a New Project"
            onSaveAction={async (p) => { await createProject(p); }}
        />
    );
}
