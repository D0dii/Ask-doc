import { useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeHubsControllerRemove } from "@/client";

const deleteWorkspace = (id: string) => knowledgeHubsControllerRemove({ path: { id }, throwOnError: true });

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
