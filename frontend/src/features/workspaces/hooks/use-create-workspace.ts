import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesControllerCreateMutation } from "../api/mutations";
import { workspacesControllerFindAllQueryKey } from "../api/queries";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    ...workspacesControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspacesControllerFindAllQueryKey(),
      });
    },
  });
}
