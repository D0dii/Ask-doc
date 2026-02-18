import { useCallback } from "react";
import { useWorkspaces } from "../api/get-workspaces";
import { useDeleteWorkspace } from "../api/delete-workspace";
import { WorkspaceCard } from "./workspace-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";

export function WorkspaceList() {
  const { workspaces, isLoading } = useWorkspaces();
  const deleteMutation = useDeleteWorkspace();

  const handleDelete = useCallback(
    (workspaceId: string) => {
      deleteMutation.mutate(workspaceId);
    },
    [deleteMutation],
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first workspace to start uploading documents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  );
}
