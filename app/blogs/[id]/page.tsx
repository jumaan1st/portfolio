// app/blogs/[id]/page.tsx
import { Metadata } from 'next';
import { BlogClientRoute } from "@/components/pages/BlogClientRoute";

export const metadata: Metadata = {
    title: 'Blog Details | Mohammed Jumaan',
    description: 'Tech insights and tutorials.',
};

export default function Page() {
    return <BlogClientRoute />;
}
