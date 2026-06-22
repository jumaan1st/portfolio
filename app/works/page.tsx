import { WorksPage } from "@/components/pages/WorksPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Works | Mohammed Jumaan",
    description: "Discover the technical projects and client collaborations delivered by Mohammed Jumaan.",
};

export default function Page() {
    return <WorksPage />;
}
