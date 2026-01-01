import React from "react";
import { Skeleton } from "../ui/Skeleton";

export const HomeSkeleton = () => {
    return (
        <div className="space-y-20 pb-12 overflow-x-hidden w-full max-w-[100vw]">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-start pt-0 pb-12 text-center relative gap-4">
                <div className="relative flex flex-col items-center justify-center">
                    {/* Status Badge */}
                    <Skeleton className="h-8 w-48 rounded-full mb-6" />

                    {/* Avatar */}
                    <div className="relative -mt-2">
                        <Skeleton className="w-40 h-40 rounded-full" />
                    </div>
                </div>

                <div className="space-y-6 max-w-3xl w-full flex flex-col items-center">
                    {/* Tagline */}
                    <Skeleton className="h-4 w-64" />

                    {/* Name */}
                    <Skeleton className="h-16 w-3/4 md:w-1/2" />

                    {/* Roles */}
                    <Skeleton className="h-8 w-64" />

                    {/* Summary */}
                    <div className="space-y-2 w-full max-w-2xl">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mx-auto" />
                        <Skeleton className="h-4 w-4/6 mx-auto" />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col md:flex-row gap-4 mt-12 w-full justify-center items-center">
                    <Skeleton className="h-14 w-48 rounded-full" />
                    <Skeleton className="h-14 w-48 rounded-full" />
                    <Skeleton className="h-14 w-48 rounded-full" />
                </div>
            </section>

            {/* Marquee Skeleton */}
            <Skeleton className="h-20 w-full" />

            {/* Featured Project Skeleton */}
            <section className="max-w-5xl mx-auto w-full px-4">
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>

                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden h-[500px]">
                    <div className="grid md:grid-cols-2 h-full">
                        <div className="p-8 md:p-12 flex flex-col justify-center gap-6">
                            <Skeleton className="h-6 w-24 rounded-lg" />
                            <Skeleton className="h-12 w-3/4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="hidden md:block h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Blog Cards Skeleton */}
            <section className="max-w-5xl mx-auto w-full px-4">
                <div className="flex justify-between items-end mb-10">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-4 w-24 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-4">
                            <Skeleton className="h-48 w-full rounded-lg" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-6 w-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
