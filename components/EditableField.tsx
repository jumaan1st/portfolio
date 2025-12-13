"use client";

import React, { useEffect, useState } from "react";
import { Check, Edit3, X } from "lucide-react";

type Props = {
    value: string;
    onSave: (v: string) => void;
    isEditing: boolean;
    type?: "input" | "textarea";
    className?: string;
};

export const EditableField: React.FC<Props> = ({
    value,
    onSave,
    isEditing,
    type = "input",
    className = "",
}) => {
    const [isEditingField, setIsEditingField] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setTempValue(value), [value]);

    if (!isEditing) return <span className={className}>{value}</span>;

    if (isEditingField) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
                {type === "textarea" ? (
                    <textarea
                        className="bg-slate-800 text-white p-2 rounded border border-blue-500 w-full min-w-[300px]"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        rows={4}
                    />
                ) : (
                    <input
                        className="bg-slate-800 text-white p-2 rounded border border-blue-500 w-full"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                    />
                )}
                <button
                    onClick={() => {
                        onSave(tempValue);
                        setIsEditingField(false);
                    }}
                    className="p-2 bg-green-600 rounded hover:bg-green-500"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={() => {
                        setTempValue(value);
                        setIsEditingField(false);
                    }}
                    className="p-2 bg-red-600 rounded hover:bg-red-500"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="group relative inline-block">
            <span
                className={`${className} group-hover:bg-slate-800/50 rounded px-1 transition-colors`}
            >
                {value}
            </span>
            <button
                onClick={() => setIsEditingField(true)}
                className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-white"
            >
                <Edit3 size={14} />
            </button>
        </div>
    );
};
