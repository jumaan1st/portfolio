// app/blogs/page.tsx
import { BlogsPage } from "@/components/pages/BlogsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog | Mohammed Jumaan",
    description: "Read technical articles, tutorials, and insights on software engineering shared by Mohammed Jumaan.",
};

export default function Page() {
    return <BlogsPage />;
}
