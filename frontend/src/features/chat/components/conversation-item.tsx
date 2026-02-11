import type { ConversationResponseDto } from "../types";
import { Button } from "@/components/ui/button";
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
import { MessageCircle, Trash2 } from "lucide-react";

export function ConversationItem({
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
}
