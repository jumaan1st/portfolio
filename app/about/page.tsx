// app/about/page.tsx
import { AboutPage } from "@/components/pages/AboutPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Me | Mohammed Jumaan",
    description: "Learn more about Mohammed Jumaan, his background in backend development, education, and career journey.",
};

export default function Page() {
    return <AboutPage />;
}
