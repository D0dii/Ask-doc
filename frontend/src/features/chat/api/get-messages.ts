import { useQuery } from "@tanstack/react-query";
import { conversationsControllerGetMessages } from "@/client";

export const useMessages = (hubId: string) => {
  return useQuery({
    queryKey: ["workspaces", hubId, "messages"],
    queryFn: async () => {
      const { data } = await conversationsControllerGetMessages({ path: { hubId }, throwOnError: true });
      return data ?? [];
    },
  });
};
