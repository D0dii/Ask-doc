import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ragControllerGetFilesOptions,
  ragControllerIngestMutation,
  ragControllerGetFilesQueryKey,
  ragControllerDeleteFileMutation,
  queryControllerQueryMutation,
} from "@/client/@tanstack/react-query.gen";
import { useState, useRef } from "react";
import type { FileResponseDto, SourceDto } from "@/client";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId/")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceDto[] | null>(null);

  const hasProcessingFiles = (files: FileResponseDto[]) =>
    files?.some((file) => file.status === "processing" || file.status === "pending");

  const { data: files, isLoading } = useQuery({
    ...ragControllerGetFilesOptions({ path: { workspaceId } }),
    refetchInterval: (query) => (hasProcessingFiles(query.state.data || []) ? 2000 : false),
  });

  const uploadMutation = useMutation({
    ...ragControllerIngestMutation({ path: { workspaceId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragControllerGetFilesQueryKey({ path: { workspaceId } }) });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const deleteMutation = useMutation({
    ...ragControllerDeleteFileMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragControllerGetFilesQueryKey({ path: { workspaceId } }) });
    },
  });

  const queryMutation = useMutation({
    ...queryControllerQueryMutation({ path: { workspaceId } }),
    onSuccess: (data) => {
      setAnswer(data.answer);
      setSources(data.sources);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate({ path: { workspaceId }, body: { file: selectedFile } });
    }
  };

  const handleDelete = (fileId: string) => {
    deleteMutation.mutate({ path: { workspaceId, fileId } });
  };

  const handleAsk = () => {
    if (question.trim()) {
      setAnswer(null);
      setSources(null);
      queryMutation.mutate({ path: { workspaceId }, body: { question } });
    }
  };

  if (isLoading) {
    return <p>Loading files...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Workspace Files</h1>

      {/* Upload Form */}
      <div className="border rounded-md p-4 mb-6 space-y-3">
        <h2 className="font-medium">Upload PDF</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
        {uploadMutation.isError && (
          <p className="text-sm text-destructive">Upload failed. Please try again.</p>
        )}
      </div>

      {/* Files List */}
      {files && files.length > 0 ? (
        <ul className="space-y-2 mb-6">
          {files.map((file) => (
            <li key={file.id} className="border rounded-md p-3 flex items-center justify-between">
              <span>{file.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    file.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : file.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {file.status}
                </span>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs px-2 py-1 rounded border text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mb-6">No files yet.</p>
      )}

      {/* Question Form */}
      <div className="border rounded-md p-4 space-y-3">
        <h2 className="font-medium">Ask a Question</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask something about your documents..."
            className="flex-1 px-3 py-2 text-sm border rounded-md"
          />
          <button
            onClick={handleAsk}
            disabled={!question.trim() || queryMutation.isPending}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {queryMutation.isPending ? "Asking..." : "Ask"}
          </button>
        </div>
        {queryMutation.isError && (
          <p className="text-sm text-destructive">Failed to get answer. Please try again.</p>
        )}
        {answer && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        )}
        {sources && sources.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Sources:</h3>
            <ul className="list-disc list-inside text-sm">
              {sources.map((source, index) => (
                <li key={index}>
                  {source.text} - {source.score}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
