import { Outlet } from "@tanstack/react-router";

export function AuthenticatedLayout() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Outlet />
    </div>
  );
}
