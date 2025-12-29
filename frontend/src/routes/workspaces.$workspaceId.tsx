import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workspacesControllerFindOneOptions,
  workspacesControllerRemoveMutation,
  ragControllerGetFilesOptions,
  ragControllerIngestMutation,
  ragControllerDeleteFileMutation,
  queryControllerQueryMutation,
} from "@/client/@tanstack/react-query.gen";
import { useState, useRef } from "react";
import type { FileResponseDto, SourceDto } from "@/client/types.gen";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  component: WorkspacePage,
});

function FileUpload({ workspaceId }: { workspaceId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    ...ragControllerIngestMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragControllerGetFiles"],
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate({
      path: { workspaceId },
      body: { file },
    });
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <svg
          className="w-10 h-10 text-muted-foreground mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {uploadMutation.isPending ? (
          <span className="text-sm text-muted-foreground">Uploading...</span>
        ) : (
          <>
            <span className="text-sm font-medium">Click to upload PDF</span>
            <span className="text-xs text-muted-foreground">PDF files only</span>
          </>
        )}
      </label>
      {uploadMutation.isError && (
        <p className="text-sm text-red-500 mt-2">Upload failed. Please try again.</p>
      )}
    </div>
  );
}

function FileList({ files, workspaceId }: { files: FileResponseDto[]; workspaceId: string }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...ragControllerDeleteFileMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragControllerGetFiles"],
      });
    },
  });

  const getStatusBadge = (status: FileResponseDto["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>{status}</span>;
  };

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet.</p>;
  }

  return (
    <ul className="divide-y">
      {files.map((file) => (
        <li key={file.id} className="py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
            </p>
            {file.errorMessage && <p className="text-xs text-red-500">{file.errorMessage}</p>}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(file.status)}
            <button
              onClick={() =>
                deleteMutation.mutate({
                  path: { workspaceId, fileId: file.id },
                })
              }
              disabled={deleteMutation.isPending}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChatSection({ workspaceId }: { workspaceId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceDto[]>([]);

  const queryMutation = useMutation({
    ...queryControllerQueryMutation(),
    onSuccess: (data) => {
      setAnswer(data.answer);
      setSources(data.sources);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    queryMutation.mutate({
      path: { workspaceId },
      body: { question },
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          disabled={queryMutation.isPending || !question.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {queryMutation.isPending ? "Thinking..." : "Ask"}
        </button>
      </form>

      {queryMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-sm text-red-700">
            Failed to get answer. Make sure you have processed documents.
          </p>
        </div>
      )}

      {answer && (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Answer</h4>
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>

          {sources.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Sources ({sources.length})</h4>
              <div className="space-y-2">
                {sources.map((source, idx) => (
                  <details key={idx} className="border rounded-md p-2 text-sm">
                    <summary className="cursor-pointer text-muted-foreground">
                      Source {idx + 1} (Score: {(source.score * 100).toFixed(1)}
                      %)
                    </summary>
                    <p className="mt-2 text-xs whitespace-pre-wrap">{source.text}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    ...workspacesControllerFindOneOptions({
      path: { id: workspaceId },
    }),
    enabled: isAuthenticated,
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    ...ragControllerGetFilesOptions({
      path: { workspaceId },
    }),
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5s to get file status updates
  });

  const deleteMutation = useMutation({
    ...workspacesControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspacesControllerFindAll"],
      });
      navigate({ to: "/" });
    },
  });

  if (authLoading || workspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view this workspace.</p>
        <Link to="/" className="text-primary hover:underline">
          Go to home
        </Link>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-8">
        <p>Workspace not found.</p>
        <Link to="/" className="text-primary hover:underline">
          Go to home
        </Link>
      </div>
    );
  }

  const hasCompletedFiles = files?.some((f) => f.status === "completed");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to workspaces
          </Link>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          {workspace.description && <p className="text-muted-foreground">{String(workspace.description)}</p>}
        </div>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this workspace?")) {
              deleteMutation.mutate({ path: { id: workspaceId } });
            }
          }}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files Section */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Documents</h2>
          <FileUpload workspaceId={workspaceId} />
          <div className="mt-4">
            {filesLoading ? (
              <p className="text-sm text-muted-foreground">Loading files...</p>
            ) : (
              <FileList files={files || []} workspaceId={workspaceId} />
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Ask Questions</h2>
          {hasCompletedFiles ? (
            <ChatSection workspaceId={workspaceId} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Upload and wait for documents to be processed before asking questions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
