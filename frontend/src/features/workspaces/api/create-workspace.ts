import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesControllerCreate } from "@/client";
import type { CreateWorkspaceDto } from "../types/workspace";

const createWorkspace = (body: CreateWorkspaceDto) =>
  workspacesControllerCreate({ body, throwOnError: true }).then(({ data }) => data);

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
