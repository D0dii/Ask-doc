import { useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeHubsControllerCreate } from "@/client";
import type { CreateWorkspaceDto } from "../types/workspace";

const createWorkspace = async (body: CreateWorkspaceDto) => {
  const { data } = await knowledgeHubsControllerCreate({ body, throwOnError: true });
  return data;
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
