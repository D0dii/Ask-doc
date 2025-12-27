import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ragControllerGetFilesOptions } from "@/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: App,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type MeResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  isAdmin: boolean;
};

async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });

  if (res.ok) {
    return res.json();
  }

  if (res.status === 401) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refresh.ok) {
      const res2 = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });
      const me = await res2.json();
      console.log(me);
      return res2.ok ? me : null;
    }
  }

  return null;
}

async function logoutRequest() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

function App() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const { data, isLoading, error } = useQuery({
    ...ragControllerGetFilesOptions(),
  });

  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="p-12 text-center">
      <h1 className="text-4xl font-bold mb-6">Simple Google Login</h1>

      {!user ? (
        /* --- STATE 1: NOT LOGGED IN --- */
        <div>
          <a
            href={`${API_URL}/auth/google`}
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
            onClick={async () => {
              await logoutRequest();
              setUser(null);
            }}
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
