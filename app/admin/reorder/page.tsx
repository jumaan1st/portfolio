import { GenericReorderPage } from "@/components/pages/GenericReorderPage";

export default function Page() {
    return (
        <GenericReorderPage
            title="Reorder Projects"
            fetchEndpoint="/api/projects"
            saveEndpoint="/api/projects/reorder"
            backUrl="/projects"
            itemType="project"
        />
    );
}
