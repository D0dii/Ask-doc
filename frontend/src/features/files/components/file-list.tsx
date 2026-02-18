import { useFiles } from "../api/get-files";
import { useDeleteFile } from "../api/delete-file";
import { FileItem } from "./file-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export function FileList({ workspaceId }: { workspaceId: string }) {
  const { files, processedFilesCount } = useFiles(workspaceId);
  const deleteMutation = useDeleteFile(workspaceId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
          {files && files.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {processedFilesCount}/{files.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <ScrollArea className="h-45 pr-4">
            <div className="space-y-2">
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
