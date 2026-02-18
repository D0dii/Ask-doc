import { useQuery } from "@tanstack/react-query";
import { workspacesControllerFindAll } from "@/client";

const getWorkspaces = async () => {
  const { data } = await workspacesControllerFindAll({ throwOnError: true });
  return data;
};

export const useWorkspaces = () => {
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  return { workspaces, isLoading };
};
