import { Link } from "@tanstack/react-router";
import type { WorkspaceResponseDto } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FolderOpen, Trash2, ArrowRight } from "lucide-react";

export function WorkspaceCard({
  workspace,
  onDelete,
  isDeleting,
}: {
  workspace: WorkspaceResponseDto;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{workspace.name}</CardTitle>
              <CardDescription className="text-xs">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
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
                <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{workspace.name}&quot; and all its documents. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(workspace.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/workspaces/$workspaceId" params={{ workspaceId: workspace.id }}>
            Open Workspace
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
