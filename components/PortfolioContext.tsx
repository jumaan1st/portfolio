// components/PortfolioContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initialEmptyData, PortfolioData, Skill } from "@/data/portfolioData";

type PortfolioContextType = {
    data: PortfolioData;
    setData: React.Dispatch<React.SetStateAction<PortfolioData>>;
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
    fetchAdminData: () => Promise<void>;
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [data, setData] = useState<PortfolioData>(initialEmptyData);
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

    // Fetches ONLY essential data for public pages (faster load)
    const fetchEssentials = React.useCallback(async () => {
        try {
            const [configRes, uiRes, profileRes, skillsRes, projectRes, blogsRes] = await Promise.all([
                fetch('/api/config'),
                fetch('/api/ui-config'),
                fetch('/api/profile'),
                fetch('/api/skills'),
                fetch('/api/projects?limit=50'),
                fetch('/api/blogs?limit=50')
            ]);

            const config = await parseOrNull(configRes, initialEmptyData.config);
            const ui = await parseOrNull(uiRes, initialEmptyData.ui);
            const profile = await parseOrNull(profileRes, initialEmptyData.profile);
            const skills = await parseOrNull(skillsRes, []);

            const projJson = await parseOrNull(projectRes, { data: [] });
            const blogsJson = await parseOrNull(blogsRes, { data: [] });
            const projects = Array.isArray(projJson) ? projJson : (projJson.data || []);
            const blogs = Array.isArray(blogsJson) ? blogsJson : (blogsJson.data || []);

            setData(prev => ({ ...prev, config, ui, profile, skills, projects, blogs }));
        } catch (e) {
            console.error("Essential data fetch failed", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetches EVERYTHING (for Admin Dashboard)
    // Fetches EVERYTHING (for Admin Dashboard)
    // Fetches EVERYTHING (for Admin Dashboard)
    const fetchAdminData = React.useCallback(async () => {
        // Do not set global isLoading here, as it unmounts the entire app in layout.tsx!
        // AdminPage handles its own loading state.
        try {
            const [
                configRes, uiRes, profileRes,
                projectRes, skillsRes, expRes, eduRes, blogsRes
            ] = await Promise.all([
                fetch('/api/config'),
                fetch('/api/ui-config'),
                fetch('/api/profile'),
                fetch('/api/projects?limit=1000'),
                fetch('/api/skills'),
                fetch('/api/experience'),
                fetch('/api/education'),
                fetch('/api/blogs?limit=1000')
            ]);

            const config = await parseOrNull(configRes, initialEmptyData.config);
            const ui = await parseOrNull(uiRes, initialEmptyData.ui);
            const profile = await parseOrNull(profileRes, initialEmptyData.profile);

            // Handle pagination wrappers if present, though Admin likely wants all
            // Ideally we stick to simple arrays for local state in Admin for now, 
            // or we adapt AdminPage to handle the 'data' property.
            // For now, let's assume the API returns { data: [...] } for paginated endpoints
            // so we extract .data.
            const projJson = await parseOrNull(projectRes, { data: [] });
            const blogsJson = await parseOrNull(blogsRes, { data: [] });

            const projects = Array.isArray(projJson) ? projJson : (projJson.data || []);
            const blogs = Array.isArray(blogsJson) ? blogsJson : (blogsJson.data || []);

            const skills = await parseOrNull(skillsRes, []);
            const experience = await parseOrNull(expRes, []);
            const education = await parseOrNull(eduRes, []);

            setData({
                config, ui, profile,
                projects, skills, experience, education, blogs
            });
        } catch (e) { console.error(e); }
    }, []);

    // Alias for compatibility, but points to full fetch
    const refreshData = fetchAdminData;

    // Initial Load: Essentials Only + Auth Check
    useEffect(() => {
        const init = async () => {
            await fetchEssentials();
            try {
                const res = await fetch('/api/auth/check');
                if (res.ok) setIsAuthenticated(true);
            } catch (e) { console.error("Auth check failed", e); }
        };
        init();
    }, [fetchEssentials]);

    const updateProfile = async (newProfile: Partial<PortfolioData['profile']>) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProfile),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            const updated = await res.json();
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
        const response = await fetch(`/api/projects?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error("Failed to update project");
        refreshData();
    };

    const deleteProject = async (id: number) => {
        const response = await fetch(`/api/projects?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Failed to delete project");
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
        fetchAdminData
    }), [data, isAuthenticated, isLoading, fetchAdminData, fetchEssentials /** included implicitly via closure, but best be safe if used */]);

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
