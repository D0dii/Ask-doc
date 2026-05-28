import { useQuery } from "@tanstack/react-query";
import { chatMessagesControllerGetMessages } from "@/client";

export const useMessages = (hubId: string) => {
  return useQuery({
    queryKey: ["workspaces", hubId, "messages"],
    queryFn: async () => {
      const { data } = await chatMessagesControllerGetMessages({ path: { hubId }, throwOnError: true });
      return data ?? [];
    },
  });
};
