import { FileUpload } from "@/features/files/components/file-upload";
import { FileList } from "@/features/files/components/file-list";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiles } from "@/features/files/api/get-files";

interface WorkspacePageProps {
  workspaceId: string;
}

export function WorkspacePage({ workspaceId }: WorkspacePageProps) {
  const { isLoading: filesLoading } = useFiles(workspaceId);

  if (filesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-150" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <div className="space-y-6">
        <FileUpload workspaceId={workspaceId} />
        <FileList workspaceId={workspaceId} />
      </div>
      <ChatPanel hubId={workspaceId} />
    </div>
  );
}
