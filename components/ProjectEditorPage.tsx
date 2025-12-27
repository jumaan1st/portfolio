"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectEditor } from "./ProjectEditor";
import { Modal } from "./Modal";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { Project } from "@/data/portfolioData";

interface ProjectEditorPageProps {
    initialData?: Partial<Project>;
    title: string;
    onSaveAction: (project: Partial<Project>) => Promise<void>;
}

export const ProjectEditorPage: React.FC<ProjectEditorPageProps> = ({ initialData, title, onSaveAction }) => {
    const router = useRouter();
    const [isDirty, setIsDirty] = useState(false);
    const [showExitWarning, setShowExitWarning] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    // Protect against browser refresh/close
    useBeforeUnload(isDirty);

    const handleCancel = () => {
        if (isDirty) {
            setShowExitWarning(true);
            setPendingNavigation(() => () => router.back());
        } else {
            router.back();
        }
    };

    const handleConfirmExit = () => {
        setShowExitWarning(false);
        setIsDirty(false); // Clear dirty state to allow navigation
        if (pendingNavigation) {
            pendingNavigation();
        } else {
            router.back();
        }
    };

    const handleSave = async (project: Partial<Project>) => {
        await onSaveAction(project);
        setIsDirty(false); // Clean state
        router.push("/projects"); // Or back to detail? Let's go to list for now or use history? List is safer.
        router.refresh();
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ProjectEditor
                title={title}
                initialData={initialData}
                onSave={handleSave}
                onCancel={handleCancel}
                isFullPage={true}
                onDirtyChange={setIsDirty}
            />

            <Modal
                isOpen={showExitWarning}
                onClose={() => setShowExitWarning(false)}
                title="Unsaved Changes"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        You have unsaved changes. Are you sure you want to discard them and leave?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowExitWarning(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Keep Editing
                        </button>
                        <button
                            onClick={handleConfirmExit}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Discard Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
