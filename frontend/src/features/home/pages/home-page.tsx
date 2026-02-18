import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MessageSquare, Upload } from "lucide-react";

const FEATURES = [
  {
    icon: Upload,
    title: "Upload Documents",
    description: "Upload PDF documents to your workspaces for AI-powered analysis.",
  },
  {
    icon: MessageSquare,
    title: "Ask Questions",
    description: "Ask natural language questions about your documents and get instant answers.",
  },
  {
    icon: FileText,
    title: "Source Citations",
    description: "Every answer includes citations to the original document sources.",
  },
] as const;

export function HomePage() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ask questions about your documents
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your PDF documents and use AI to extract insights, answer questions, and find information
              instantly.
            </p>
          </div>

          <Button onClick={login} size="lg" className="text-base">
            Get Started with Google
          </Button>

          <div className="grid gap-6 sm:grid-cols-3 pt-8">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="text-left">
                <CardHeader className="pb-3">
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">Select a workspace from the sidebar to get started.</p>
      </div>
    </div>
  );
}
