import { useQuery } from "@tanstack/react-query";
import { ragControllerGetFiles } from "@/client";
import type { FileResponseDto } from "../types/file";

const getFiles = async (workspaceId: string) => {
  const { data } = await ragControllerGetFiles({ path: { workspaceId }, throwOnError: true });
  return data;
};

const hasProcessingFiles = (files: FileResponseDto[] | undefined) =>
  files?.some((file) => file.status === "processing" || file.status === "pending");

export const useFiles = (workspaceId: string) => {
  const { data: files, isLoading } = useQuery({
    queryKey: ["workspaces", workspaceId, "files"],
    queryFn: () => getFiles(workspaceId),
    refetchInterval: (query) => (hasProcessingFiles(query.state.data) ? 2000 : false),
  });

  const processedFilesCount = files?.filter((f) => f.status === "completed").length ?? 0;

  return { files, isLoading, processedFilesCount };
};
