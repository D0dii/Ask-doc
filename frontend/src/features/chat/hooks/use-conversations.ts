import { useQuery } from "@tanstack/react-query";
import { chatControllerGetConversationsOptions } from "../api/queries";

export function useConversations(workspaceId: string) {
  const { data: conversationsData, isLoading } = useQuery(
    chatControllerGetConversationsOptions({
      path: { workspaceId },
      query: { limit: 50 },
    }),
  );

  const conversations = conversationsData?.conversations ?? [];

  return { conversations, isLoading };
}
