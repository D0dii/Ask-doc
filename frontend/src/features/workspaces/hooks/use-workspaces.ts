import { useQuery } from "@tanstack/react-query";
import { workspacesControllerFindAllOptions } from "../api/queries";

export function useWorkspaces() {
  const { data: workspaces, isLoading } = useQuery(workspacesControllerFindAllOptions());

  return { workspaces, isLoading };
}
