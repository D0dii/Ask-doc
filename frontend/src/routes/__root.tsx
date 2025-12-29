import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth } from "../contexts/auth-context";

const RootLayout = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-4">
            <Link to="/" className="font-bold text-xl">
              AskDoc
            </Link>
            {isAuthenticated && (
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Workspaces
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img src={user.picture} alt={user.firstName || "User"} className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm">{user.firstName || user.email}</span>
                <button onClick={logout} className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted">
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Login with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({ component: RootLayout });
