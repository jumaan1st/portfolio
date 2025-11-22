"use client";

import React from "react";
import { PortfolioData } from "@/data/portfolioData";

type Skill = PortfolioData["skills"][number];

export const Marquee: React.FC<{ items: Skill[] }> = ({ items }) => (
    <div className="w-full overflow-hidden bg-slate-900/50 py-4 border-y border-slate-800">
        <div className="relative flex overflow-x-hidden group">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 px-4">
                {[...items, ...items, ...items].map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 text-slate-400 font-bold text-lg uppercase tracking-wider"
                    >
                        <item.icon size={20} className="text-blue-500" />
                        {item.name}
                    </div>
                ))}
            </div>
        </div>
    </div>
);
