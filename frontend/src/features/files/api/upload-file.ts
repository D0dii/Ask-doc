import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragControllerIngest } from "@/client";

const uploadFile = async (workspaceId: string, file: File) => {
  const { data } = await ragControllerIngest({ path: { workspaceId }, body: { file }, throwOnError: true });
  return data;
};

export const useUploadFile = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFile(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "files"] });
    },
  });
};
