import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatControllerDeleteConversation } from "@/client";

const deleteConversation = (workspaceId: string, conversationId: string) =>
  chatControllerDeleteConversation({ path: { workspaceId, conversationId }, throwOnError: true });

export const useDeleteConversation = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(workspaceId, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "conversations"],
      });
    },
  });
};
