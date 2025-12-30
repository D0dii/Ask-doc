import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { workspacesControllerFindAllOptions } from "@/client/@tanstack/react-query.gen";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    ...workspacesControllerFindAllOptions(),
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Sign up with Google
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span>{user?.email}</span>
        <button onClick={logout} className="px-4 py-2 rounded-md border hover:bg-muted">
          Logout
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Workspaces</h2>
        {workspacesLoading ? (
          <p>Loading workspaces...</p>
        ) : workspaces && workspaces.length > 0 ? (
          <ul className="space-y-2">
            {workspaces.map((workspace) => (
              <li key={workspace.id} className="border rounded-md p-2">
                {workspace.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No workspaces yet.</p>
        )}
      </div>
    </div>
  );
}
