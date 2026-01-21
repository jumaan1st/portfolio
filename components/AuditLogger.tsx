"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AuditLogger() {
    const pathname = usePathname();
    const lastLoggedPath = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname) return;
        if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/admin")) return;
        if (pathname === lastLoggedPath.current) return;

        const logVisit = (type: string, resourceId: string | null = null) => {
            // Get User Identity from LocalStorage
            let identity = { name: null, email: null, phone: null };
            try {
                const stored = localStorage.getItem("portfolio_user_identity");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    identity.name = parsed.name || null;
                    identity.email = parsed.email || null;
                    // Check if phone is stored separately or in object
                    // Layout.tsx only stores {name, email}, but let's try to be safe
                    // If phone isn't there, it remains null.
                    // We could check if there's a specific key for phone? 
                    // Looking at Layout.tsx, it sets: localStorage.setItem("portfolio_user_identity", JSON.stringify({ name: reviewForm.name, email: reviewForm.email }));
                    // It does NOT store phone. 
                    // However, the USER asked to store phone if available. 
                    // I will assume if I update Layout.tsx later to store phone, it would be here.
                    // For now, I'll attempt to read it from identity object if present.
                    // @ts-ignore
                    identity.phone = parsed.phone || null;
                }
            } catch (e) {
                // ignore
            }

            fetch("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: pathname,
                    type,
                    resourceId,
                    browser: {
                        userAgent: navigator.userAgent,
                        width: window.innerWidth,
                        height: window.innerHeight,
                        language: navigator.language,
                        // @ts-ignore
                        connectionType: navigator.connection?.effectiveType || null,
                    },
                    referrer: document.referrer || null,
                    userName: identity.name,
                    userEmail: identity.email,
                    userPhone: identity.phone
                }),
            }).catch((err) => console.error("Audit log failed", err));
        };

        // 1. Global "Website Visit" (Once per session)
        const hasVisitedWebsite = sessionStorage.getItem("audit_seen_website_visit");
        if (!hasVisitedWebsite) {
            logVisit("website_visit");
            sessionStorage.setItem("audit_seen_website_visit", "true");
        }

        // 2. Resource Specific Logging (Once per resource per session)
        if (pathname.startsWith("/blogs/")) {
            const parts = pathname.split("/");
            if (parts.length > 2) {
                const blogSlug = parts[2];
                const key = `audit_seen_blog_${blogSlug}`;
                if (!sessionStorage.getItem(key)) {
                    logVisit("blog", blogSlug);
                    sessionStorage.setItem(key, "true");
                }
            }
        } else if (pathname.startsWith("/projects/")) {
            const parts = pathname.split("/");
            if (parts.length > 2) {
                const projectId = parts[2];
                const key = `audit_seen_project_${projectId}`;
                // filter out 'new' or non-id routes if necessary, but /projects/new is admin only usually?
                // If it is 'new', we probably skip or log as page?
                // But user said "Projects they visit".
                if (projectId !== 'new' && !sessionStorage.getItem(key)) {
                    logVisit("project", projectId);
                    sessionStorage.setItem(key, "true");
                }
            }
        }

        lastLoggedPath.current = pathname;
    }, [pathname]);

    return null;
}
