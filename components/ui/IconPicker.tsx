"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

// Curated list of popular icons
const ICON_OPTIONS = [
    { label: "React", value: "devicon-react-original" },
    { label: "Next.js", value: "devicon-nextjs-original-wordmark" }, // Fixed: wordmark for better visibility
    { label: "TypeScript", value: "devicon-typescript-plain" },
    { label: "JavaScript", value: "devicon-javascript-plain" },
    { label: "Node.js", value: "devicon-nodejs-plain" },
    { label: "Python", value: "devicon-python-plain" },
    { label: "Java", value: "devicon-java-plain" },
    { label: "Spring", value: "devicon-spring-plain" },
    { label: "Spring Boot", value: "devicon-spring-original" }, // Added
    { label: "Hibernate", value: "devicon-hibernate-plain" }, // Added
    { label: "Maven", value: "devicon-maven-plain" }, // Added
    { label: "Gradle", value: "devicon-gradle-plain" }, // Added
    { label: "Jenkins", value: "devicon-jenkins-line" }, // Added
    { label: "Docker", value: "devicon-docker-plain" },
    { label: "Kubernetes", value: "devicon-kubernetes-plain" },
    { label: "AWS", value: "devicon-amazonwebservices-original-wordmark" }, // Fixed: wordmark for visibility
    { label: "Azure", value: "devicon-azure-plain" },
    { label: "Google Cloud", value: "devicon-googlecloud-plain" }, // Added
    { label: "PostgreSQL", value: "devicon-postgresql-plain" },
    { label: "MongoDB", value: "devicon-mongodb-plain" },
    { label: "MySQL", value: "devicon-mysql-plain" }, // Added
    { label: "Redis", value: "devicon-redis-plain" },
    { label: "Kafka", value: "devicon-apachekafka-original" }, // Added
    { label: "Git", value: "devicon-git-plain" },
    { label: "Linux", value: "devicon-linux-plain" },
    { label: "HTML5", value: "devicon-html5-plain" },
    { label: "CSS3", value: "devicon-css3-plain" },
    { label: "Tailwind", value: "devicon-tailwindcss-plain" },
    { label: "Bootstrap", value: "devicon-bootstrap-plain" }, // Added
    { label: "Sass", value: "devicon-sass-original" },
    { label: "Vue.js", value: "devicon-vuejs-plain" },
    { label: "Angular", value: "devicon-angularjs-plain" },
    { label: "C++", value: "devicon-cplusplus-plain" },
    { label: "C#", value: "devicon-csharp-plain" },
    { label: "Go", value: "devicon-go-original-wordmark" },
    { label: "Rust", value: "devicon-rust-plain" },
    { label: "Swift", value: "devicon-swift-plain" },
    { label: "Kotlin", value: "devicon-kotlin-plain" },
    { label: "Flutter", value: "devicon-flutter-plain" },
    { label: "Android", value: "devicon-android-plain" },
    { label: "Figma", value: "devicon-figma-plain" },
    { label: "Jira", value: "devicon-jira-plain" },
    { label: "GitLab", value: "devicon-gitlab-plain" },
    { label: "Bitbucket", value: "devicon-bitbucket-original" },
    { label: "IntelliJ", value: "devicon-intellij-plain" }, // Added
    { label: "Eclipse", value: "devicon-eclipse-plain" }, // Added
    { label: "VS Code", value: "devicon-vscode-plain" }, // Added
];

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredIcons = ICON_OPTIONS.filter(icon =>
        icon.label.toLowerCase().includes(search.toLowerCase()) ||
        icon.value.toLowerCase().includes(search.toLowerCase())
    );

    const selectedIcon = ICON_OPTIONS.find(i => i.value === value);

    const handleSelect = (iconValue: string) => {
        onChange(iconValue);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="relative w-full md:w-1/3">
            <div
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer focus-within:ring-2 ring-purple-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedIcon || value ? (
                        <>
                            <i className={`${selectedIcon?.value || value} text-xl`}></i>
                            <span className="truncate">{selectedIcon?.label || value}</span>
                        </>
                    ) : (
                        <span className="text-slate-400">Select Icon</span>
                    )}
                </div>
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-inherit rounded-t-xl">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
                                placeholder="Search icons..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto p-1 flex-1">
                        {filteredIcons.map(icon => (
                            <div
                                key={icon.value}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${value === icon.value ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                onClick={() => handleSelect(icon.value)}
                            >
                                <i className={`${icon.value} text-xl w-6 text-center`}></i>
                                <span className="text-sm font-medium">{icon.label}</span>
                            </div>
                        ))}
                        {filteredIcons.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500">
                                No icons found. <br />
                                <button
                                    className="text-purple-600 font-bold mt-1 hover:underline"
                                    onClick={() => handleSelect(search)}
                                >
                                    Use "{search}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
