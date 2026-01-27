import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { workspacesControllerFindAllOptions } from "@/client/@tanstack/react-query.gen";

export const Route = createFileRoute("/_authenticated/workspaces/")({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const { data: workspaces, isLoading } = useQuery(workspacesControllerFindAllOptions());

  if (isLoading) {
    return <p>Loading workspaces...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Workspaces</h1>
      {workspaces && workspaces.length > 0 ? (
        <ul className="space-y-2">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                to="/workspaces/$workspaceId"
                params={{ workspaceId: workspace.id }}
                className="block border rounded-md p-3 hover:bg-muted transition-colors"
              >
                {workspace.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No workspaces yet.</p>
      )}
    </div>
  );
}
