import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsControllerIngest } from "@/client";

const uploadFile = async (hubId: string, file: File) => {
  const { data } = await documentsControllerIngest({ path: { hubId }, body: { file }, throwOnError: true });
  return data;
};

export const useUploadFile = (hubId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFile(hubId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", hubId, "files"] });
    },
  });
};
