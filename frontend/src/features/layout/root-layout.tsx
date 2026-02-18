import { useAuth } from "@/features/auth/auth-provider";
import { UserMenu } from "@/features/auth/components/user-menu";
import { Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export function RootLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link to="/" className="font-bold text-xl tracking-tight">
              AskDoc
            </Link>
            {isAuthenticated && (
              <Link
                to="/workspaces"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Workspaces
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-57px)]">
        <Outlet />
      </main>

      <TanStackRouterDevtools />
    </>
  );
}
