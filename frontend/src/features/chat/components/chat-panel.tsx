import { useState, useCallback, useRef, useEffect } from "react";
import { useActiveConversation } from "../api/get-active-conversation";
import { useAskQuestion } from "../api/ask-question";
import { ChatMessageItem } from "./chat-message-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles, Send, Loader2, ChevronLeft } from "lucide-react";

export function ChatPanel({
  workspaceId,
  activeConversationId,
  onSelectConversation,
  processedFilesCount,
}: {
  workspaceId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  processedFilesCount: number;
}) {
  const [question, setQuestion] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading: messagesLoading,
    getTitle,
  } = useActiveConversation(workspaceId, activeConversationId);

  const queryMutation = useAskQuestion(workspaceId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]);

  const handleNewConversation = useCallback(() => {
    onSelectConversation(null);
    setQuestion("");
  }, [onSelectConversation]);

  const handleAsk = useCallback(() => {
    if (question.trim()) {
      queryMutation.mutate(
        {
          question,
          conversationId: activeConversationId || undefined,
        },
        {
          onSuccess: (data) => {
            if (!activeConversationId) {
              onSelectConversation(data.conversationId);
            }
            setQuestion("");
          },
        },
      );
    }
  }, [question, activeConversationId, queryMutation, onSelectConversation]);

  return (
    <Card className="flex flex-col min-h-150">
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
              {activeConversationId ? getTitle() : "New Conversation"}
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
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-100 mb-4">
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
  );
}
