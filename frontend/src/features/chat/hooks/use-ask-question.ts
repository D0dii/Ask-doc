import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatControllerQueryMutation } from "../api/mutations";
import {
  chatControllerGetConversationsQueryKey,
  chatControllerGetConversationQueryKey,
} from "../api/queries";

interface UseAskQuestionOptions {
  workspaceId: string;
  activeConversationId: string | null;
  onConversationCreated: (conversationId: string) => void;
  onSuccess?: () => void;
}

export function useAskQuestion({
  workspaceId,
  activeConversationId,
  onConversationCreated,
  onSuccess,
}: UseAskQuestionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...chatControllerQueryMutation(),
    onSuccess: (data) => {
      if (!activeConversationId) {
        onConversationCreated(data.conversationId);
      }
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationsQueryKey({
          path: { workspaceId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationQueryKey({
          path: { workspaceId, conversationId: data.conversationId },
        }),
      });
      onSuccess?.();
    },
  });
}
