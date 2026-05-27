import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsControllerDeleteFile } from "@/client";

const deleteFile = (hubId: string, fileId: string) =>
  documentsControllerDeleteFile({ path: { hubId, fileId }, throwOnError: true });

export const useDeleteFile = (hubId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(hubId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", hubId, "files"] });
    },
  });
};
