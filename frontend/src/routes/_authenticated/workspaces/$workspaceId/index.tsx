import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/workspaces/pages/workspace-page";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId/")({
  component: () => {
    const { workspaceId } = Route.useParams();
    return <WorkspacePage workspaceId={workspaceId} />;
  },
});
