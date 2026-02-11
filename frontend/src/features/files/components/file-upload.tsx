import { useUploadFile } from "../hooks/use-upload-file";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";

export function FileUpload({ workspaceId }: { workspaceId: string }) {
  const { fileInputRef, selectedFile, handleFileChange, handleUpload, isPending, isError } =
    useUploadFile(workspaceId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>Add PDF documents to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button onClick={handleUpload} disabled={!selectedFile || isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </div>
        {isError && <p className="text-sm text-destructive mt-2">Upload failed.</p>}
      </CardContent>
    </Card>
  );
}
