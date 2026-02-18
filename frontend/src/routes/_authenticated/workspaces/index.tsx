import { createFileRoute } from "@tanstack/react-router";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { WorkspaceList } from "@/features/workspaces/components/workspace-list";

export const Route = createFileRoute("/_authenticated/workspaces/")({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">Manage your document workspaces</p>
        </div>
        <CreateWorkspaceForm />
      </div>

      <WorkspaceList />
    </div>
  );
}
