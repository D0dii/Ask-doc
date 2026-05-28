import { useState, useRef, useEffect } from "react";
import { useMessages } from "../api/get-messages";
import { useAskQuestion } from "../api/ask-question";
import { ChatMessageItem } from "./chat-message-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles, Send, Loader2 } from "lucide-react";

export function ChatPanel({ hubId }: { hubId: string }) {
  const [question, setQuestion] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessages(hubId);
  const queryMutation = useAskQuestion(hubId);

  useEffect(() => {
    if (scrollAreaRef.current && messages.length) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length, queryMutation.isPending]);

  const handleAsk = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    queryMutation.mutate(trimmed, {
      onSuccess: () => setQuestion(""),
    });
  };

  return (
    <Card className="flex flex-col min-h-150">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat
        </CardTitle>
        <CardDescription>{messages.length} messages in this hub</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-100 mb-4">
          {isLoading ? (
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
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Ask a question</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Upload documents, then ask anything about them.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
            placeholder="Ask something about your documents..."
            disabled={queryMutation.isPending}
            className="flex-1"
          />
          <Button onClick={handleAsk} disabled={!question.trim() || queryMutation.isPending}>
            {queryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {queryMutation.isError && (
          <p className="text-sm text-destructive mt-2">
            {(queryMutation.error as { message?: string })?.message ??
              "Failed to get answer. Upload a PDF and wait until it shows completed, then try again."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
