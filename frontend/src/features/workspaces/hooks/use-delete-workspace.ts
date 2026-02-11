import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesControllerRemoveMutation } from "../api/mutations";
import { workspacesControllerFindAllQueryKey } from "../api/queries";

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    ...workspacesControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspacesControllerFindAllQueryKey(),
      });
    },
  });
}
