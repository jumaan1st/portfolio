import { GenericReorderPage } from "@/components/pages/GenericReorderPage";

export default function Page() {
    return (
        <GenericReorderPage
            title="Reorder Blogs"
            fetchEndpoint="/api/blogs"
            saveEndpoint="/api/blogs/reorder"
            backUrl="/blogs"
            itemType="blog"
        />
    );
}
