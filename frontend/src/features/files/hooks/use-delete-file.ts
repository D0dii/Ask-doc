import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragControllerDeleteFileMutation } from "../api/mutations";
import { ragControllerGetFilesQueryKey } from "../api/queries";

export function useDeleteFile(workspaceId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...ragControllerDeleteFileMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ragControllerGetFilesQueryKey({ path: { workspaceId } }),
      });
    },
  });

  const handleDelete = useCallback(
    (fileId: string) => {
      mutation.mutate({ path: { workspaceId, fileId } });
    },
    [workspaceId, mutation],
  );

  return { handleDelete, isPending: mutation.isPending };
}
