import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { QueryClientProvider } from "@tanstack/react-query";
import { getContext } from "./lib/tanstack-query/get-context";
import { setupApiClient } from "./lib/api-client";
import { AuthProvider, type AuthContextType } from "./features/auth/auth-provider";

const queryClientContext = getContext();

const defaultAuthState = {
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
  isLoading: true,
} satisfies AuthContextType;

// Create a new router instance
const router = createRouter({ routeTree, context: { ...queryClientContext, auth: defaultAuthState } });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Setup API client with interceptors
// The onAuthFailure callback will be set after AuthProvider mounts via AuthInterceptorSetup
setupApiClient();

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        <QueryClientProvider client={queryClientContext.queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </StrictMode>
  );
}
