import { useQuery } from "@tanstack/react-query";
import { chatControllerGetConversationOptions } from "../api/queries";

export function useActiveConversation(workspaceId: string, conversationId: string | null) {
  const { data: activeConversation, isLoading } = useQuery({
    ...chatControllerGetConversationOptions({
      path: { workspaceId, conversationId: conversationId! },
    }),
    enabled: !!conversationId,
  });

  const messages = activeConversation?.messages ?? [];

  const getTitle = () => {
    if (!activeConversation?.title) return "Conversation";
    if (typeof activeConversation.title === "string") return activeConversation.title;
    return String(Object.values(activeConversation.title)[0] ?? "Conversation");
  };

  return { activeConversation, messages, isLoading, getTitle };
}
