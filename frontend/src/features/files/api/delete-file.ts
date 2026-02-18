import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragControllerDeleteFile } from "@/client";

const deleteFile = (workspaceId: string, fileId: string) =>
  ragControllerDeleteFile({ path: { workspaceId, fileId }, throwOnError: true });

export const useDeleteFile = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(workspaceId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "files"] });
    },
  });
};
