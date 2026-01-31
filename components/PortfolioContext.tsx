// components/PortfolioContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initialEmptyData, PortfolioData, Skill } from "@/data/portfolioData";

type PortfolioContextType = {
    data: PortfolioData;
    setData: React.Dispatch<React.SetStateAction<PortfolioData>>;
    projectsMeta?: { total: number; page: number; limit: number; totalPages: number };
    isAuthenticated: boolean;
    setIsAuthenticated: (v: boolean) => void;
    isLoading: boolean;
    updateProfile: (p: Partial<PortfolioData['profile']>) => Promise<void>;
    createProject: (p: Partial<PortfolioData['projects'][0]>) => Promise<PortfolioData['projects'][0]>;
    updateProject: (id: number, p: Partial<PortfolioData['projects'][0]>) => Promise<void>;
    deleteProject: (id: number) => Promise<void>;

    // Skills
    createSkill: (s: { name: string; icon: string }) => Promise<void>;
    deleteSkill: (id: number) => Promise<void>;

    // Experience
    createExperience: (e: Partial<PortfolioData['experience'][0]>) => Promise<void>;
    updateExperience: (id: number, e: Partial<PortfolioData['experience'][0]>) => Promise<void>;
    deleteExperience: (id: number) => Promise<void>;

    // Blogs
    createBlog: (b: any) => Promise<void>;
    updateBlog: (id: number, b: any) => Promise<void>;
    deleteBlog: (id: number) => Promise<void>;

    // Education
    createEducation: (e: any) => Promise<void>;
    updateEducation: (id: number, e: any) => Promise<void>;
    deleteEducation: (id: number) => Promise<void>;

    // Certifications
    createCertification: (c: any) => Promise<void>;
    updateCertification: (id: number, c: any) => Promise<void>;
    deleteCertification: (id: number) => Promise<void>;

    fetchAdminData: () => Promise<void>;
    refreshData: () => Promise<void>;
    fetchAdminProjects: () => Promise<void>;
    fetchAdminBlogs: () => Promise<void>;
    fetchAdminExperience: () => Promise<void>;
    fetchAdminEducation: () => Promise<void>;
    fetchAdminSkills: () => Promise<void>;
    fetchAdminCertifications: () => Promise<void>;
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [data, setData] = useState<PortfolioData>(initialEmptyData);
    const [projectsMeta, setProjectsMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const parseOrNull = async (res: Response, fallback: any) => {
        if (!res.ok) return fallback;
        try {
            return await res.json();
        } catch {
            return fallback;
        }
    }

    // Unified Bootstrap Fetch
    const fetchBootstrap = React.useCallback(async (mode: 'public' | 'admin' = 'public') => {
        try {
            // For admin, we use 'admin' mode which returns Profile + Skills + Exp + Edu
            // Projects and Blogs remain lazy (fetched via tabs)
            const effectiveMode = mode;

            const res = await fetch(`/api/bootstrap?mode=${effectiveMode}`);
            if (!res.ok) throw new Error("Bootstrap failed");

            const bootstrapData = await res.json();

            // Transform/Validate if necessary (Bootstrap API already does most heavy lifting)
            const config = bootstrapData.config || initialEmptyData.config;
            const ui = bootstrapData.ui || initialEmptyData.ui;
            const profile = bootstrapData.profile || initialEmptyData.profile;
            // Ensure array safety
            profile.currentlyLearning = Array.isArray(profile.currentlyLearning) ? profile.currentlyLearning : [];

            // Only populate these if they come back (public mode has limit, admin might want full later)
            const skills = Array.isArray(bootstrapData.skills) ? bootstrapData.skills : [];
            const certifications = Array.isArray(bootstrapData.certifications) ? bootstrapData.certifications : [];
            const projects = Array.isArray(bootstrapData.projects) ? bootstrapData.projects : [];
            const blogs = Array.isArray(bootstrapData.blogs) ? bootstrapData.blogs : [];

            setData(prev => ({
                ...prev,
                config, ui, profile, skills, certifications,
                projects, blogs
                // Don't overwrite experience/education with empty if not present, but init usually happens once
            }));

            if (mode === 'admin') {
                // If admin, we might want to fetch Profile again to get sensitive fields if any? 
                // Currently profile is same for public/admin.
                // We will fetch other lists lazily.
            }
        } catch (e) {
            console.error("Bootstrap fetch failed", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Granular Fetchers for Lazy Loading
    const fetchAdminProjects = React.useCallback(async () => {
        const res = await fetch('/api/projects?limit=1000&summary=false');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, projects: json.data || [] }));
        }
    }, []);

    const fetchAdminBlogs = React.useCallback(async () => {
        const res = await fetch('/api/blogs?limit=1000&include_hidden=true&summary=false');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, blogs: json.data || [] }));
        }
    }, []);

    const fetchAdminExperience = React.useCallback(async () => {
        const res = await fetch('/api/experience');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, experience: json || [] }));
        }
    }, []);

    const fetchAdminEducation = React.useCallback(async () => {
        const res = await fetch('/api/education');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, education: json || [] }));
        }
    }, []);

    const fetchAdminSkills = React.useCallback(async () => {
        const res = await fetch('/api/skills');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, skills: json || [] }));
        }
    }, []);

    const fetchAdminCertifications = React.useCallback(async () => {
        const res = await fetch('/api/certifications');
        if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, certifications: json || [] }));
        }
    }, []);


    // Alias for compatibility - removed legacy monolithic behavior
    // Now it just ensures basic session/profile is loaded
    const fetchAdminData = React.useCallback(async () => {
        await fetchBootstrap('public');
    }, [fetchBootstrap]);

    // Refresh data - re-fetches everything? Or just current context?
    // Let's make it fetch all for now to be safe, or we let components handle it
    const refreshData = React.useCallback(async () => {
        await fetchBootstrap('public');
        // If we are in admin, components will trigger their own re-fetches via useEffect if we want, 
        // but 'refreshData' is often called after mutation. 
        // We should arguably re-fetch everything to be safe or rely on optimistic updates (which we have).
        if (isAuthenticated) {
            await Promise.all([
                fetchAdminProjects(),
                fetchAdminBlogs(),
                fetchAdminExperience(),
                fetchAdminEducation(),
                fetchAdminSkills(),
                fetchAdminCertifications()
            ]);
        }
    }, [fetchBootstrap, isAuthenticated, fetchAdminProjects, fetchAdminBlogs, fetchAdminExperience, fetchAdminEducation, fetchAdminSkills, fetchAdminCertifications]);

    // Initial Load: Public Bootstrap + Auth Check
    useEffect(() => {
        const init = async () => {
            // Start both in parallel to save time
            const authPromise = fetch('/api/auth/check');
            const dataPromise = fetchBootstrap('public');

            await dataPromise;
            try {
                const res = await authPromise;
                if (res.ok) setIsAuthenticated(true);
            } catch (e) { console.error("Auth check failed", e); }
        };
        init();
    }, [fetchBootstrap]);



    const updateProfile = async (newProfile: Partial<PortfolioData['profile']>) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProfile),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            const updated = await res.json();
            if (typeof updated.currentlyLearning === 'string') {
                try { updated.currentlyLearning = JSON.parse(updated.currentlyLearning); } catch (e) { updated.currentlyLearning = []; }
            }
            setData(prev => ({ ...prev, profile: { ...prev.profile, ...updated } }));
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const createProject = async (project: Partial<PortfolioData['projects'][0]>) => {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            if (!res.ok) throw new Error("Failed to create project");
            const newProject = await res.json();
            setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
            return newProject;
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    };

    const updateProject = async (id: number, project: Partial<PortfolioData['projects'][0]>) => {
        // Optimistic update
        setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, ...project } : p)
        }));

        const response = await fetch(`/api/projects?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) {
            refreshData(); // Revert/Refresh on error
            throw new Error("Failed to update project");
        }
        refreshData();
    };

    const deleteProject = async (id: number) => {
        // Optimistic update
        setData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== id)
        }));

        const response = await fetch(`/api/projects?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            // Revert on failure (optional, but good practice usually involves complex revert logic. 
            // For now, simpler to just throw, refresh will eventually fix it if it persisted.)
            refreshData();
            throw new Error("Failed to delete project");
        }
        refreshData();
    };

    const createSkill = async (s: { name: string; icon: string }) => {
        const res = await fetch('/api/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
        if (!res.ok) throw new Error("Failed to create skill");
        refreshData();
    };
    const deleteSkill = async (id: number) => {
        const res = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete skill");
        refreshData();
    };

    const createExperience = async (e: Partial<PortfolioData['experience'][0]>) => {
        const res = await fetch('/api/experience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
        if (!res.ok) throw new Error("Failed to create experience");
        refreshData();
    };
    const updateExperience = async (id: number, e: Partial<PortfolioData['experience'][0]>) => {
        const res = await fetch(`/api/experience?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
        if (!res.ok) throw new Error("Failed to update experience");
        refreshData();
    };
    const deleteExperience = async (id: number) => {
        const res = await fetch(`/api/experience?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete experience");
        refreshData();
    };

    const createBlog = async (b: any) => {
        const res = await fetch('/api/blogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
        if (!res.ok) throw new Error("Failed to create blog");
        refreshData();
    };
    const updateBlog = async (id: number, b: any) => {
        const res = await fetch(`/api/blogs?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
        if (!res.ok) throw new Error("Failed to update blog");
        refreshData();
    };
    const deleteBlog = async (id: number) => {
        const res = await fetch(`/api/blogs?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete blog");
        refreshData();
    };

    const createCertification = async (c: any) => {
        const res = await fetch('/api/certifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        if (!res.ok) throw new Error("Failed to create certification");
        refreshData();
    };

    const updateCertification = async (id: number, c: any) => {
        const res = await fetch(`/api/certifications?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        if (!res.ok) throw new Error("Failed to update certification");
        refreshData();
    };

    const deleteCertification = async (id: number) => {
        const res = await fetch(`/api/certifications?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete certification");
        refreshData();
    };

    // Education
    const createEducation = async (e: any) => {
        const res = await fetch('/api/education', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
        if (!res.ok) throw new Error("Failed to create education");
        refreshData();
    };
    const updateEducation = async (id: number, e: any) => {
        const res = await fetch(`/api/education?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
        if (!res.ok) throw new Error("Failed to update education");
        refreshData();
    };
    const deleteEducation = async (id: number) => {
        const res = await fetch(`/api/education?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete education");
        refreshData();
    };

    const contextValue = React.useMemo(() => ({
        data,
        setData,
        projectsMeta,
        isAuthenticated,
        setIsAuthenticated,
        isLoading,
        updateProfile,
        createProject,
        updateProject,
        deleteProject,
        createSkill,
        deleteSkill,
        createExperience,
        updateExperience,
        deleteExperience,
        createBlog,
        updateBlog,
        deleteBlog,
        createEducation,
        updateEducation,
        deleteEducation,
        createCertification,
        updateCertification,
        deleteCertification,
        fetchAdminData,
        refreshData,
        fetchAdminProjects,
        fetchAdminBlogs,
        fetchAdminExperience,
        fetchAdminEducation,
        fetchAdminSkills,
        fetchAdminCertifications
    }), [data, isAuthenticated, isLoading, fetchAdminData, refreshData, fetchAdminProjects, fetchAdminBlogs, fetchAdminExperience, fetchAdminEducation, fetchAdminSkills, fetchAdminCertifications]);

    return (
        <PortfolioContext.Provider value={contextValue}>
            {children}
        </PortfolioContext.Provider>
    );
};

export const usePortfolio = () => {
    const ctx = useContext(PortfolioContext);
    if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return ctx;
};
