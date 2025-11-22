// components/PortfolioContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";
import { initialData, PortfolioData } from "@/data/portfolioData";

type PortfolioContextType = {
    data: PortfolioData;
    setData: React.Dispatch<React.SetStateAction<PortfolioData>>;
    isAuthenticated: boolean;
    setIsAuthenticated: (v: boolean) => void;
};

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                               children,
                                                                           }) => {
    const [data, setData] = useState<PortfolioData>(initialData);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    return (
        <PortfolioContext.Provider
            value={{ data, setData, isAuthenticated, setIsAuthenticated }}
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
