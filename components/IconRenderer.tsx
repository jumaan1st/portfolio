
import React from 'react';
import {
    Server,
    Database,
    FileText,
    Globe,
    Code,
    Cpu,
    Monitor,
    Terminal,
    Layout,
    Box,
    Layers,
    Smartphone,
    Cloud,
    GitBranch,
    Shield,
    Zap,
    Briefcase,
    GraduationCap,
    HelpCircle
} from "lucide-react";

const iconMap: { [key: string]: React.ElementType } = {
    "Server": Server,
    "Database": Database,
    "FileText": FileText,
    "Globe": Globe,
    "Code": Code,
    "Cpu": Cpu,
    "Monitor": Monitor,
    "Terminal": Terminal,
    "Layout": Layout,
    "Box": Box,
    "Layers": Layers,
    "Smartphone": Smartphone,
    "Cloud": Cloud,
    "GitBranch": GitBranch,
    "Shield": Shield,
    "Zap": Zap,
    "Briefcase": Briefcase,
    "GraduationCap": GraduationCap
};

interface IconRendererProps {
    iconName: string;
    className?: string;
    size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className, size = 24 }) => {
    // If it's a devicon class (e.g. "devicon-react-original") or contains "devicon-"
    if (iconName?.includes('devicon-') || iconName?.includes('fa-')) {
        return <i className={`${iconName} ${className}`} style={{ fontSize: size }} />;
    }

    const IconComponent = iconMap[iconName] || HelpCircle; // Fallback icon
    return <IconComponent className={className} size={size} />;
};
