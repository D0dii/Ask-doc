import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workspacesControllerFindAllOptions,
  workspacesControllerFindAllQueryKey,
  workspacesControllerCreateMutation,
  workspacesControllerRemoveMutation,
} from "@/client/@tanstack/react-query.gen";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, FolderOpen, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspaces/")({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { data: workspaces, isLoading } = useQuery(workspacesControllerFindAllOptions());

  const createMutation = useMutation({
    ...workspacesControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesControllerFindAllQueryKey() });
      setNewWorkspaceName("");
    },
  });

  const deleteMutation = useMutation({
    ...workspacesControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesControllerFindAllQueryKey() });
    },
  });

  const handleCreate = useCallback(() => {
    if (newWorkspaceName.trim()) {
      createMutation.mutate({ body: { name: newWorkspaceName.trim() } });
    }
  }, [newWorkspaceName, createMutation]);

  const handleDelete = useCallback(
    (workspaceId: string) => {
      deleteMutation.mutate({ path: { id: workspaceId } });
    },
    [deleteMutation],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">Manage your document workspaces</p>
        </div>

        {/* Create Workspace Form */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New workspace name..."
            className="w-48"
          />
          <Button onClick={handleCreate} disabled={!newWorkspaceName.trim() || createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      {workspaces && workspaces.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="group relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{workspace.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Created {new Date(workspace.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{workspace.name}&quot; and all its documents.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(workspace.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId: workspace.id }}>
                    Open Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first workspace to start uploading documents
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
