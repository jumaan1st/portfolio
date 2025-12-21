import React, { useMemo } from 'react';
import { Coffee, Code, Terminal, BookOpen, PenTool, Hash, Layout, Cpu } from 'lucide-react';

interface BlogPlaceholderProps {
    title: string;
    className?: string;
}

const GRADIENTS = [
    "from-blue-500 to-purple-600",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-600",
    "from-indigo-500 to-blue-600",
    "from-violet-600 to-fuchsia-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
];

const ICONS = [Coffee, Code, Terminal, BookOpen, PenTool, Hash, Layout, Cpu];

export const BlogPlaceholder: React.FC<BlogPlaceholderProps> = ({ title, className }) => {
    // Deterministic selection based on title hash
    const { gradient, Icon } = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }

        const safeHash = Math.abs(hash);
        const gradientIndex = safeHash % GRADIENTS.length;
        const iconIndex = safeHash % ICONS.length;

        return {
            gradient: GRADIENTS[gradientIndex],
            Icon: ICONS[iconIndex]
        };
    }, [title]);

    return (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center ${className || ''}`}>
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/30 text-white">
                <Icon size={32} />
            </div>
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        </div>
    );
};
