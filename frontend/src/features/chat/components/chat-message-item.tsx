import { useState } from "react";
import type { ChatMessageResponseDto } from "../types";
import { SourceItem } from "./source-item";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from "lucide-react";

export function ChatMessageItem({
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
}
