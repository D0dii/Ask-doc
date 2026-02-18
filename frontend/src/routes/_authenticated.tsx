import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { WorkspaceSidebar } from "@/features/workspaces/components/workspace-sidebar";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, FolderOpen, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
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

        <WorkspaceSidebar />

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
