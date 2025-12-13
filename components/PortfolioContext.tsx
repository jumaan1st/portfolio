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
};

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [data, setData] = useState<PortfolioData>(initialEmptyData);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    configRes,
                    uiRes,
                    profileRes,
                    experienceRes,
                    projectsRes,
                    blogsRes,
                    educationRes,
                    skillsRes
                ] = await Promise.all([
                    fetch('/api/config'),
                    fetch('/api/ui-config'),
                    fetch('/api/profile'),
                    fetch('/api/experience'),
                    fetch('/api/projects'),
                    fetch('/api/blogs'),
                    fetch('/api/education'),
                    fetch('/api/skills')
                ]);

                const parseOrNull = async (res: Response, fallback: any) => {
                    if (!res.ok) return fallback;
                    try {
                        return await res.json();
                    } catch {
                        return fallback;
                    }
                }

                const config = await parseOrNull(configRes, initialEmptyData.config);
                const ui = await parseOrNull(uiRes, initialEmptyData.ui);
                const profile = await parseOrNull(profileRes, initialEmptyData.profile);
                const experience = await parseOrNull(experienceRes, []);
                const projects = await parseOrNull(projectsRes, []);
                const blogs = await parseOrNull(blogsRes, []);
                const education = await parseOrNull(educationRes, []);
                const skills = await parseOrNull(skillsRes, []);

                console.log("Loaded projects from API:", projects);

                setData({
                    config,
                    ui,
                    profile,
                    experience,
                    projects,
                    blogs,
                    education,
                    skills
                });
            } catch (error) {
                console.error("Failed to fetch portfolio data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <PortfolioContext.Provider
            value={{ data, setData, isAuthenticated, setIsAuthenticated, isLoading }}
        >
            {children}
        </PortfolioContext.Provider>
    );
};

export const usePortfolio = () => {
    const ctx = useContext(PortfolioContext);
    if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return ctx;
};
