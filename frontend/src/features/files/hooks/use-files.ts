import { useQuery } from "@tanstack/react-query";
import { ragControllerGetFilesOptions } from "../api/queries";
import { hasProcessingFiles } from "../utils";

export function useFiles(workspaceId: string) {
  const { data: files, isLoading } = useQuery({
    ...ragControllerGetFilesOptions({ path: { workspaceId } }),
    refetchInterval: (query) => (hasProcessingFiles(query.state.data) ? 2000 : false),
  });

  const processedFilesCount = files?.filter((f) => f.status === "completed").length ?? 0;

  return { files, isLoading, processedFilesCount };
}
