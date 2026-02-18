import type { ChatMessageSourceDto } from "../types/chat";
import { Badge } from "@/components/ui/badge";

export function SourceItem({ source, index }: { source: ChatMessageSourceDto; index: number }) {
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
}
