import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileUpload, FileList, useFiles } from "@/features/files";
import { ConversationList, ChatPanel } from "@/features/chat";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId/")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { isLoading: filesLoading, processedFilesCount } = useFiles(workspaceId);

  if (filesLoading) {
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
        <FileUpload workspaceId={workspaceId} />
        <FileList workspaceId={workspaceId} />
        <ConversationList
          workspaceId={workspaceId}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      {/* Right Column - Chat */}
      <ChatPanel
        workspaceId={workspaceId}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        processedFilesCount={processedFilesCount}
      />
    </div>
  );
}
