import { useQuery } from "@tanstack/react-query";
import { knowledgeHubsControllerFindAll } from "@/client";

const getWorkspaces = async () => {
  const { data } = await knowledgeHubsControllerFindAll({ throwOnError: true });
  return data;
};

export const useWorkspaces = () => {
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  return { workspaces, isLoading };
};
