import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ragControllerGetFilesOptions,
  ragControllerIngestMutation,
  ragControllerGetFilesQueryKey,
  ragControllerDeleteFileMutation,
  chatControllerQueryMutation,
  chatControllerGetChatHistoryOptions,
  chatControllerGetChatHistoryQueryKey,
} from "@/client/@tanstack/react-query.gen";
import { useState, useRef, useCallback, memo, useEffect } from "react";
import type { FileResponseDto, ChatMessageResponseDto, SourceDto } from "@/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId/")({
  component: WorkspacePage,
});

// Hoisted helper function outside component
const hasProcessingFiles = (files: FileResponseDto[] | undefined) =>
  files?.some((file) => file.status === "processing" || file.status === "pending");

// Memoized file item component to prevent unnecessary re-renders
const FileItem = memo(function FileItem({
  file,
  onDelete,
  isDeleting,
}: {
  file: FileResponseDto;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      variant: "default" as const,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    failed: { icon: XCircle, variant: "destructive" as const, className: "" },
    processing: {
      icon: Loader2,
      variant: "secondary" as const,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    pending: {
      icon: Clock,
      variant: "outline" as const,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
  } as const;

  const status = statusConfig[file.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-md bg-primary/10 shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={status.variant} className={`gap-1 ${status.className}`}>
          <StatusIcon className={`h-3 w-3 ${file.status === "processing" ? "animate-spin" : ""}`} />
          {file.status}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{file.name}&quot; and remove it from the knowledge base.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(file.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

// Memoized source item component
const SourceItem = memo(function SourceItem({ source, index }: { source: SourceDto; index: number }) {
  return (
    <div className="p-3 rounded-md bg-muted/50 border">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          Source {index + 1}
        </Badge>
        <span className="text-xs text-muted-foreground">{(source.score * 100).toFixed(0)}% match</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{source.text}</p>
    </div>
  );
});

// Memoized chat message component
const ChatMessageItem = memo(function ChatMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageResponseDto;
  isLatest: boolean;
}) {
  const [showSources, setShowSources] = useState(isLatest);

  return (
    <div className="space-y-3 pb-4 border-b last:border-b-0">
      {/* Question */}
      <div className="flex gap-3">
        <div className="p-2 rounded-full bg-muted h-8 w-8 flex items-center justify-center shrink-0">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-sm font-medium">{message.question}</p>
          <p className="text-xs text-muted-foreground mt-1">{new Date(message.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="flex gap-3">
        <div className="p-2 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.answer}</p>

          {/* Sources Toggle */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="text-xs text-muted-foreground h-auto py-1 px-2"
              >
                {showSources ? "Hide" : "Show"} {message.sources.length} sources
              </Button>
              {showSources && (
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, index) => (
                    <SourceItem key={index} source={source} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");

  const { data: files, isLoading: filesLoading } = useQuery({
    ...ragControllerGetFilesOptions({ path: { workspaceId } }),
    refetchInterval: (query) => (hasProcessingFiles(query.state.data) ? 2000 : false),
  });

  const { data: chatHistory, isLoading: chatLoading } = useQuery(
    chatControllerGetChatHistoryOptions({ path: { workspaceId }, query: { limit: 50 } }),
  );

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
    ...chatControllerQueryMutation(),
    onSuccess: () => {
      // Invalidate chat history to show the new message
      queryClient.invalidateQueries({
        queryKey: chatControllerGetChatHistoryQueryKey({ path: { workspaceId } }),
      });
      setQuestion("");
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && chatHistory?.messages?.length) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = 0; // Messages are in DESC order, so scroll to top for latest
      }
    }
  }, [chatHistory?.messages?.length]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadMutation.mutate({ path: { workspaceId }, body: { file: selectedFile } });
    }
  }, [selectedFile, workspaceId, uploadMutation]);

  const handleDelete = useCallback(
    (fileId: string) => {
      deleteMutation.mutate({ path: { workspaceId, fileId } });
    },
    [workspaceId, deleteMutation],
  );

  const handleAsk = useCallback(() => {
    if (question.trim()) {
      queryMutation.mutate({ path: { workspaceId }, body: { question } });
    }
  }, [question, workspaceId, queryMutation]);

  const processedFilesCount = files?.filter((f) => f.status === "completed").length ?? 0;
  const messages = chatHistory?.messages ?? [];

  if (filesLoading || chatLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Files */}
      <div className="space-y-6">
        {/* Upload Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>Add PDF documents to your workspace knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            {uploadMutation.isError && (
              <p className="text-sm text-destructive mt-2">Upload failed. Please try again.</p>
            )}
          </CardContent>
        </Card>

        {/* Files List Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
              {files && files.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {processedFilesCount} / {files.length} ready
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files && files.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onDelete={handleDelete}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No documents yet. Upload a PDF to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Chat */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask Questions
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {messages.length} messages
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Ask questions about your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Chat History Display */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-[400px] mb-4">
            {queryMutation.isPending && (
              <div className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-muted/50 border">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing documents...</p>
              </div>
            )}

            {messages.length > 0 ? (
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => (
                  <ChatMessageItem key={message.id} message={message} isLatest={index === 0} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {processedFilesCount > 0
                    ? "Ask a question about your documents"
                    : "Upload and process documents to start asking questions"}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Question Input */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
              placeholder="Ask something about your documents..."
              disabled={processedFilesCount === 0 || queryMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || queryMutation.isPending || processedFilesCount === 0}
            >
              {queryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {queryMutation.isError && (
            <p className="text-sm text-destructive mt-2">Failed to get answer. Please try again.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
