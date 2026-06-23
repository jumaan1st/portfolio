import { GenericReorderPage } from "@/components/pages/GenericReorderPage";

export default function Page() {
    return (
        <GenericReorderPage
            title="Reorder Works"
            fetchEndpoint="/api/projects"
            saveEndpoint="/api/projects/reorder"
            backUrl="/works"
            itemType="project"
        />
    );
}
