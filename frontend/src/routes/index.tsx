import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/auth-provider";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isLoading, isAuthenticated, login } = useAuth();

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
      <h1 className="text-2xl font-semibold">Welcome back!</h1>
      <p className="text-muted-foreground">Select a workspace from the sidebar to get started.</p>
    </div>
  );
}
