import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4">
        <nav className="space-y-2">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
          >
            Workspaces
          </Link>
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
