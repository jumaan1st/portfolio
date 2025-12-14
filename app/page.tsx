// app/page.tsx (Home)
import { HomePage } from "@/components/pages/HomePage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mohammed Jumaan | Backend Developer & Portfolio",
    description: "Welcome to the personal portfolio of Mohammed Jumaan. Explore my backend engineering projects, skills, and professional experience.",
};

export default function Page() {
    return <HomePage />;
}
