import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatControllerQuery } from "@/client";

const askQuestion = async (workspaceId: string, body: { question: string; conversationId?: string }) => {
  const { data } = await chatControllerQuery({ path: { workspaceId }, body, throwOnError: true });
  return data;
};

export const useAskQuestion = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { question: string; conversationId?: string }) => askQuestion(workspaceId, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "conversations", data.conversationId],
      });
    },
  });
};
