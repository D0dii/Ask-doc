import { Link } from "@tanstack/react-router";
import { FileUpload } from "@/features/files/components/file-upload";
import { FileList } from "@/features/files/components/file-list";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiles } from "@/features/files/api/get-files";
import { ArrowLeft } from "lucide-react";

interface WorkspacePageProps {
  workspaceId: string;
}

export function WorkspacePage({ workspaceId }: WorkspacePageProps) {
  const { isLoading: filesLoading } = useFiles(workspaceId);

  if (filesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-150" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/workspaces"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workspaces
      </Link>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <div className="space-y-6">
          <FileUpload workspaceId={workspaceId} />
          <FileList workspaceId={workspaceId} />
        </div>
        <ChatPanel hubId={workspaceId} />
      </div>
    </div>
  );
}
