import { useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ragControllerIngestMutation } from "../api/mutations";
import { ragControllerGetFilesQueryKey } from "../api/queries";

export function useUploadFile(workspaceId: string) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...ragControllerIngestMutation({ path: { workspaceId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ragControllerGetFilesQueryKey({ path: { workspaceId } }),
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      mutation.mutate({ path: { workspaceId }, body: { file: selectedFile } });
    }
  }, [selectedFile, workspaceId, mutation]);

  return {
    fileInputRef,
    selectedFile,
    handleFileChange,
    handleUpload,
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
