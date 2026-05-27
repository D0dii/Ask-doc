import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryControllerQuery } from "@/client";

export const useAskQuestion = (hubId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: string) => {
      const { data } = await queryControllerQuery({
        path: { hubId },
        body: { question },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", hubId, "messages"] });
    },
  });
};
