import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatControllerDeleteConversationMutation } from "../api/mutations";
import { chatControllerGetConversationsQueryKey } from "../api/queries";

interface UseDeleteConversationOptions {
  workspaceId: string;
  activeConversationId: string | null;
  onActiveDeleted: () => void;
}

export function useDeleteConversation({
  workspaceId,
  activeConversationId,
  onActiveDeleted,
}: UseDeleteConversationOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...chatControllerDeleteConversationMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationsQueryKey({
          path: { workspaceId },
        }),
      });
      if (activeConversationId === variables.path.conversationId) {
        onActiveDeleted();
      }
    },
  });

  const handleDelete = useCallback(
    (conversationId: string) => {
      mutation.mutate({ path: { workspaceId, conversationId } });
    },
    [workspaceId, mutation],
  );

  return { handleDelete, isPending: mutation.isPending };
}
