import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Article...</p>
        </div>
    );
}
