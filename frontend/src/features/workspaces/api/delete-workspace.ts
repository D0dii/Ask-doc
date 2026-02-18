import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesControllerRemove } from "@/client";

const deleteWorkspace = (id: string) => workspacesControllerRemove({ path: { id }, throwOnError: true });

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
