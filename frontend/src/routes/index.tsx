import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ragControllerGetFilesOptions } from "@/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [user, setUser] = useState<any>(null);
  const { data, isLoading, error } = useQuery({
    ...ragControllerGetFilesOptions(),
  });
  console.log(data);
  useEffect(() => {
    // 1. Check if URL has a token (sent by Backend)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 2. Simple decode (JSON.parse the middle part of JWT)
      // In production, use 'jwt-decode' library
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);

        // Optional: Clean URL
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  return (
    <div className="p-12 text-center">
      <h1 className="text-4xl font-bold mb-6">Simple Google Login</h1>

      {!user ? (
        /* --- STATE 1: NOT LOGGED IN --- */
        <div>
          <a
            href="http://localhost:3000/auth/google"
            className="inline-block bg-red-600 text-white no-underline rounded-md px-5 py-2 text-lg hover:bg-red-700"
          >
            Sign in with Google
          </a>
          <Button>Test Button</Button>
        </div>
      ) : (
        /* --- STATE 2: LOGGED IN (PROFILE) --- */
        <div className="border border-gray-300 p-6 rounded-lg inline-block">
          <img src={user.picture} alt="Profile" className="rounded-full w-24 h-24 mx-auto" />
          <h2 className="text-xl font-semibold mt-4">Welcome, {user.firstName}!</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
          <button
            onClick={() => setUser(null)}
            className="mt-4 bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      )}
      <div className="mt-8">
        {isLoading && <p className="text-sm text-gray-500">Loading files...</p>}
        {error && <p className="text-sm text-red-500">Failed to load files</p>}
        {data && Array.isArray(data) && (
          <div className="mt-4 text-left max-w-xl mx-auto">
            <h3 className="text-lg font-medium mb-2">Files</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {data.map((f: any) => (
                <li key={f.id ?? f.fileId ?? JSON.stringify(f)}>{f.name ?? f.text ?? JSON.stringify(f)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
