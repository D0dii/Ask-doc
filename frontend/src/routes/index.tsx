import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workspacesControllerFindAllOptions,
  workspacesControllerCreateMutation,
} from "@/client/@tanstack/react-query.gen";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    ...workspacesControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspacesControllerFindAll"] });
      onClose();
      setName("");
      setDescription("");
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      body: { name, description: description || undefined },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Workspace</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="My Workspace"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="A workspace for..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HomePage() {
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    ...workspacesControllerFindAllOptions(),
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to AskDoc</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Upload your documents and ask questions. Get AI-powered answers from your own knowledge base.
        </p>
        <button
          onClick={login}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          Get Started with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || "there"}!</h1>
          <p className="text-muted-foreground">Manage your workspaces and documents</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Create Workspace
        </button>
      </div>

      {workspacesLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading workspaces...</div>
      ) : workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to="/workspaces/$workspaceId"
              params={{ workspaceId: workspace.id }}
              className="block border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-semibold mb-1">{workspace.name}</h3>
              {workspace.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{String(workspace.description)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>Your workspaces will appear here.</p>
          <p className="text-sm mt-2">
            Create a workspace to start uploading documents and asking questions.
          </p>
        </div>
      )}

      <CreateWorkspaceDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  );
}
