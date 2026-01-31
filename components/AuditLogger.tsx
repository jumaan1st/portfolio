"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const BATCH_INTERVAL = 5000; // 5 seconds
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface LogEvent {
    path: string;
    timestamp: string;
}

export default function AuditLogger() {
    const pathname = usePathname();

    // Capture Referral Source
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const source = params.get("ref") || params.get("source") || params.get("utm_source");

        if (source) {
            // Only set if not already set for this session context (first touch attribution)
            if (!localStorage.getItem("portfolio_traffic_source")) {
                localStorage.setItem("portfolio_traffic_source", source);
            }
        }
    }, []);

    const queueRef = useRef<LogEvent[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Helper: Get or Create Session ID
    const getSessionId = () => {
        if (typeof window === "undefined") return null;

        let sessionId = localStorage.getItem("portfolio_session_id");
        const lastActive = parseInt(localStorage.getItem("portfolio_last_active") || "0");
        const now = Date.now();

        // Expire session if inactive for too long
        if (!sessionId || (now - lastActive > SESSION_TIMEOUT)) {
            sessionId = uuidv4();
            localStorage.setItem("portfolio_session_id", sessionId);
        }

        localStorage.setItem("portfolio_last_active", now.toString());
        return sessionId;
    };

    // Helper: Send Batch
    const flushQueue = async () => {
        if (queueRef.current.length === 0) return;

        const eventsToSend = [...queueRef.current];
        queueRef.current = []; // Clear queue locally immediately

        const sessionId = getSessionId();
        const identityString = localStorage.getItem("portfolio_user_identity");
        const identity = identityString ? JSON.parse(identityString) : {};

        // Get stored referral source
        const trafficSource = localStorage.getItem("portfolio_traffic_source");

        const payload = {
            sessionId,
            events: eventsToSend,
            identity,
            deviceInfo: {
                userAgent: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                trafficSource: trafficSource || undefined // Send if exists
            }
        };

        try {
            // Use keepalive for reliability
            // Use keepalive for reliability
            const res = await fetch("/api/audit/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true
            });

            if (res.ok) {
                const data = await res.json();
                // SERVER-SIDE ROTATION HANDLER
                if (data.newSessionId) {
                    localStorage.setItem("portfolio_session_id", data.newSessionId);
                    console.debug("Session rotated by server:", data.newSessionId);
                }
            }
        } catch (e) {
            console.error("Audit flush failed", e);
        }
    };

    const lastVisitedPath = useRef<string | null>(null);

    // 1. Track Path Changes
    useEffect(() => {
        // Use window.location.search to get query params without using the hook
        // This avoids Next.js de-opting static pages to client-side rendering or requiring Suspense
        const search = window.location.search;
        const fullPath = pathname + (search ? search : "");

        // Deduplicate: Don't log if it's the exact same path as the last one we saw in this session context
        if (lastVisitedPath.current === fullPath) {
            return;
        }

        lastVisitedPath.current = fullPath;

        // Add to queue
        queueRef.current.push({
            path: fullPath,
            timestamp: new Date().toISOString()
        });

        // Update last active
        if (typeof window !== "undefined") {
            localStorage.setItem("portfolio_last_active", Date.now().toString());
        }

    }, [pathname]);

    // 2. Setup Flush Timer & Unload Listeners
    useEffect(() => {
        // flush every interval
        timerRef.current = setInterval(flushQueue, BATCH_INTERVAL);

        // flush on visibility hidden (switching tabs/minimizing)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushQueue();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', flushQueue);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', flushQueue);
            flushQueue(); // Final flush on unmount
        };
    }, []);

    return null;
}
