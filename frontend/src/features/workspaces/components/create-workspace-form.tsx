import { useState } from "react";
import { useCreateWorkspace } from "../api/create-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreateWorkspaceForm() {
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const createMutation = useCreateWorkspace();

  const handleCreate = () => {
    if (newWorkspaceName.trim()) {
      createMutation.mutate({ name: newWorkspaceName.trim() }, { onSuccess: () => setNewWorkspaceName("") });
    }
  };

  return (
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
  );
}
