import { useQuery } from "@tanstack/react-query";
import { chatControllerGetConversation } from "@/client";

const getConversation = async (workspaceId: string, conversationId: string) => {
  const { data } = await chatControllerGetConversation({
    path: { workspaceId, conversationId },
    throwOnError: true,
  });
  return data;
};

export const useActiveConversation = (workspaceId: string, conversationId: string | null) => {
  const { data: activeConversation, isLoading } = useQuery({
    queryKey: ["workspaces", workspaceId, "conversations", conversationId],
    queryFn: () => getConversation(workspaceId, conversationId!),
    enabled: !!conversationId,
  });

  const messages = activeConversation?.messages ?? [];

  const getTitle = () => {
    if (!activeConversation?.title) return "Conversation";
    if (typeof activeConversation.title === "string") return activeConversation.title;
    return String(Object.values(activeConversation.title)[0] ?? "Conversation");
  };

  return { activeConversation, messages, isLoading, getTitle };
};
