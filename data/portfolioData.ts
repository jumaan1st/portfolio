
import type { ComponentType, SVGProps } from "react";

export interface Skill {
    id: number;
    name: string;
    icon: string; // Changed from ComponentType to string for API response
}

export interface Experience {
    id: number;
    role: string;
    company: string;
    period: string;
    description: string;
}

export interface Project {
    id: number;
    title: string;
    category: string;
    tech: string[];
    description: string;
    longDescription?: string;
    features?: string[];
    challenges?: string;
    link: string;
    githubLink?: string;
    color: string;
    image?: string;
}

export interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tags: string[];
    content?: string;
    image?: string; // Cover image URL
    is_hidden?: boolean;
}

export interface Education {
    id: number;
    degree: string;
    school: string;
    year: string;
    grade: string;
}

export interface Profile {
    name: string;
    roles: string[];
    currentRole: string;
    currentCompany: string;
    currentCompanyUrl: string;
    summary: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    twitter: string;
    resumeUrl: string;
    photoLightUrl?: string; // New field
    photoDarkUrl?: string;  // New field
    currentlyLearning?: CurrentlyLearningItem[];
}

export interface CurrentlyLearningItem {
    topic: string;
    category?: string;
    level?: string;
    status?: string;
    referenceUrl?: string;
}

export interface UIConfig {
    heroTagline: string;
    statusLabel: string;
    blogTitle: string;
    blogSubtitle: string;
    projectTitle: string;
    projectSubtitle: string;
}

export interface Config {
    adminEmail: string;
    showWelcomeModal: boolean;
}

export interface PortfolioData {
    config: Config;
    ui: UIConfig;
    profile: Profile;
    experience: Experience[];
    projects: Project[];
    blogs: BlogPost[];
    education: Education[];
    skills: Skill[];
}

export const initialEmptyData: PortfolioData = {
    config: {
        adminEmail: "",
        showWelcomeModal: false,
    },
    ui: {
        heroTagline: "",
        statusLabel: "",
        blogTitle: "",
        blogSubtitle: "",
        projectTitle: "",
        projectSubtitle: "",
    },
    profile: {
        name: "",
        roles: [],
        currentRole: "",
        currentCompany: "",
        currentCompanyUrl: "",
        summary: "",
        location: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        twitter: "",
        resumeUrl: "",
    },
    experience: [],
    projects: [],
    blogs: [],
    education: [],
    skills: [],
};
