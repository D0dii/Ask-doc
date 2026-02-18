import type { FileResponseDto } from "../types/file";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Trash2, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

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

export function FileItem({
  file,
  onDelete,
  isDeleting,
}: {
  file: FileResponseDto;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
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
}
