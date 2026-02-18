import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragControllerIngest } from "@/client";

const uploadFile = (workspaceId: string, file: File) =>
  ragControllerIngest({ path: { workspaceId }, body: { file }, throwOnError: true }).then(({ data }) => data);

export const useUploadFile = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFile(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "files"] });
    },
  });
};
