import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedLayout } from "@/features/layout/authenticated-layout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});
