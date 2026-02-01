import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ragControllerGetFilesOptions,
  ragControllerIngestMutation,
  ragControllerGetFilesQueryKey,
  ragControllerDeleteFileMutation,
  chatControllerQueryMutation,
  chatControllerGetConversationsOptions,
  chatControllerGetConversationsQueryKey,
  chatControllerGetConversationOptions,
  chatControllerGetConversationQueryKey,
  chatControllerDeleteConversationMutation,
} from "@/client/@tanstack/react-query.gen";
import { useState, useRef, useCallback, memo, useEffect } from "react";
import type {
  FileResponseDto,
  ChatMessageResponseDto,
  ChatMessageSourceDto,
  ConversationResponseDto,
} from "@/client";
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
  Plus,
  MessageCircle,
  ChevronLeft,
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
const SourceItem = memo(function SourceItem({
  source,
  index,
}: {
  source: ChatMessageSourceDto;
  index: number;
}) {
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

// Memoized conversation list item
const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  isDeleting,
}: {
  conversation: ConversationResponseDto;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const title =
    typeof conversation.title === "string"
      ? conversation.title
      : conversation.title
        ? String(Object.values(conversation.title)[0] ?? "")
        : null;

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        isActive ? "bg-primary/10 border-primary/30" : "bg-card hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MessageCircle
          className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{title || "New conversation"}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.messageCount} messages · {new Date(conversation.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Files query
  const { data: files, isLoading: filesLoading } = useQuery({
    ...ragControllerGetFilesOptions({ path: { workspaceId } }),
    refetchInterval: (query) => (hasProcessingFiles(query.state.data) ? 2000 : false),
  });

  // Conversations list query
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    chatControllerGetConversationsOptions({ path: { workspaceId }, query: { limit: 50 } }),
  );

  // Active conversation with messages query
  const { data: activeConversation, isLoading: messagesLoading } = useQuery({
    ...chatControllerGetConversationOptions({
      path: { workspaceId, conversationId: activeConversationId! },
    }),
    enabled: !!activeConversationId,
  });

  // Mutations
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

  const deleteConversationMutation = useMutation({
    ...chatControllerDeleteConversationMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationsQueryKey({ path: { workspaceId } }),
      });
      if (activeConversationId === variables.path.conversationId) {
        setActiveConversationId(null);
      }
    },
  });

  const queryMutation = useMutation({
    ...chatControllerQueryMutation(),
    onSuccess: (data) => {
      // Update conversation ID if a new one was created
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationsQueryKey({ path: { workspaceId } }),
      });
      queryClient.invalidateQueries({
        queryKey: chatControllerGetConversationQueryKey({
          path: { workspaceId, conversationId: data.conversationId },
        }),
      });
      setQuestion("");
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && activeConversation?.messages?.length) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeConversation?.messages?.length]);

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

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setQuestion("");
  }, []);

  const handleDeleteConversation = useCallback(
    (conversationId: string) => {
      deleteConversationMutation.mutate({ path: { workspaceId, conversationId } });
    },
    [workspaceId, deleteConversationMutation],
  );

  const handleAsk = useCallback(() => {
    if (question.trim()) {
      queryMutation.mutate({
        path: { workspaceId },
        body: {
          question,
          conversationId: activeConversationId || undefined,
        },
      });
    }
  }, [question, workspaceId, activeConversationId, queryMutation]);

  const processedFilesCount = files?.filter((f) => f.status === "completed").length ?? 0;
  const conversations = conversationsData?.conversations ?? [];
  const messages = activeConversation?.messages ?? [];

  // Get conversation title helper
  const getConversationTitle = () => {
    if (!activeConversation?.title) return "Conversation";
    if (typeof activeConversation.title === "string") return activeConversation.title;
    return String(Object.values(activeConversation.title)[0] ?? "Conversation");
  };

  if (filesLoading || conversationsLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      {/* Left Column - Files & Conversations */}
      <div className="space-y-6">
        {/* Upload Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>Add PDF documents to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending} size="sm">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
            {uploadMutation.isError && <p className="text-sm text-destructive mt-2">Upload failed.</p>}
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
                  {processedFilesCount}/{files.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files && files.length > 0 ? (
              <ScrollArea className="h-[180px] pr-4">
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
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversations List Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleNewConversation}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => setActiveConversationId(conv.id)}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      isDeleting={deleteConversationMutation.isPending}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Chat */}
      <Card className="flex flex-col min-h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {activeConversationId && (
              <Button variant="ghost" size="icon-sm" onClick={handleNewConversation}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {activeConversationId ? getConversationTitle() : "New Conversation"}
              </CardTitle>
              <CardDescription>
                {activeConversationId
                  ? `${messages.length} messages`
                  : "Start a new conversation about your documents"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Chat History Display */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-[400px] mb-4">
            {messagesLoading && activeConversationId ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                  />
                ))}
                {queryMutation.isPending && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                {queryMutation.isPending ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing documents...</p>
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Ask a question</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {processedFilesCount > 0
                        ? "Your documents are ready. Ask any question and I'll find the answer."
                        : "Upload and process documents to start asking questions."}
                    </p>
                  </>
                )}
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
              placeholder={
                activeConversationId ? "Ask a follow-up question..." : "Ask something about your documents..."
              }
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
