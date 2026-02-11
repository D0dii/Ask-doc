import { useConversations } from "../hooks/use-conversations";
import { useDeleteConversation } from "../hooks/use-delete-conversation";
import { ConversationItem } from "./conversation-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Plus } from "lucide-react";

export function ConversationList({
  workspaceId,
  activeConversationId,
  onSelectConversation,
}: {
  workspaceId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}) {
  const { conversations } = useConversations(workspaceId);
  const { handleDelete, isPending: isDeleting } = useDeleteConversation({
    workspaceId,
    activeConversationId,
    onActiveDeleted: () => onSelectConversation(null),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onSelectConversation(null)}>
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
                  onClick={() => onSelectConversation(conv.id)}
                  onDelete={() => handleDelete(conv.id)}
                  isDeleting={isDeleting}
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
  );
}
