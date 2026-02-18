import { useQuery } from "@tanstack/react-query";
import { chatControllerGetConversations } from "@/client";

const getConversations = (workspaceId: string) =>
  chatControllerGetConversations({ path: { workspaceId }, query: { limit: 50 }, throwOnError: true }).then(
    ({ data }) => data,
  );

export const useConversations = (workspaceId: string) => {
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["workspaces", workspaceId, "conversations"],
    queryFn: () => getConversations(workspaceId),
  });

  const conversations = conversationsData?.conversations ?? [];

  return { conversations, isLoading };
};
