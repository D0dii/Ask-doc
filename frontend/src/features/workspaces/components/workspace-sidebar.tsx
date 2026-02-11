import { Link } from "@tanstack/react-router";
import { useWorkspaces } from "../hooks/use-workspaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export function WorkspaceSidebar() {
  const { workspaces, isLoading } = useWorkspaces();

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Your Workspaces
        </h3>
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/workspaces">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)]">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <nav className="space-y-1">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                to="/workspaces/$workspaceId"
                params={{ workspaceId: workspace.id }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-medium truncate"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{workspace.name}</span>
              </Link>
            ))}
          </nav>
        ) : (
          <p className="text-xs text-muted-foreground px-3">No workspaces yet</p>
        )}
      </ScrollArea>
    </div>
  );
}
