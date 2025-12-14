// app/projects/page.tsx
import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Projects | Mohammed Jumaan",
    description: "Discover the technical projects built by Mohammed Jumaan, ranging from scalable backend systems to full-stack applications.",
};

export default function Page() {
    return <ProjectsPage />;
}
