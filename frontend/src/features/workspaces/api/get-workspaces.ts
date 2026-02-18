import { useQuery } from "@tanstack/react-query";
import { workspacesControllerFindAll } from "@/client";

const getWorkspaces = () => workspacesControllerFindAll({ throwOnError: true }).then(({ data }) => data);

export const useWorkspaces = () => {
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  return { workspaces, isLoading };
};
