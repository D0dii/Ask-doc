import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { workspacesControllerFindAllOptions } from "@/client/@tanstack/react-query.gen";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderOpen, Settings, Plus, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: workspaces, isLoading } = useQuery(workspacesControllerFindAllOptions());

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4">
          <nav className="space-y-1">
            <Link
              to="/workspaces"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors [&.active]:bg-muted [&.active]:font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/workspaces"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors [&.active]:bg-muted [&.active]:font-medium"
            >
              <FolderOpen className="h-4 w-4" />
              Workspaces
            </Link>
          </nav>
        </div>

        <Separator />

        {/* Workspaces List */}
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

        <Separator />

        {/* Bottom Nav */}
        <div className="p-4">
          <nav className="space-y-1">
            <Link
              to="/workspaces"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors [&.active]:bg-muted [&.active]:font-medium"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
