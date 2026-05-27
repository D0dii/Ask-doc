import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flashcardsControllerCreate,
  flashcardsControllerFindAll,
  flashcardsControllerGenerate,
  notesControllerCreate,
  notesControllerFindAll,
  notesControllerGenerate,
} from "@/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Note = { id: string; title: string; content: string };
type Flashcard = { id: string; front: string; back: string };

export function HubExtrasPanel({ hubId }: { hubId: string }) {
  const queryClient = useQueryClient();
  const notesKey = ["workspaces", hubId, "notes"] as const;
  const flashcardsKey = ["workspaces", hubId, "flashcards"] as const;

  const { data: notes = [] } = useQuery({
    queryKey: notesKey,
    queryFn: async () => {
      const { data } = await notesControllerFindAll({ path: { hubId }, throwOnError: true });
      return (data ?? []) as Note[];
    },
  });

  const { data: flashcards = [] } = useQuery({
    queryKey: flashcardsKey,
    queryFn: async () => {
      const { data } = await flashcardsControllerFindAll({ path: { hubId }, throwOnError: true });
      return (data ?? []) as Flashcard[];
    },
  });

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardQuery, setCardQuery] = useState("");

  const createNote = useMutation({
    mutationFn: () =>
      notesControllerCreate({
        path: { hubId },
        body: { title: noteTitle, content: noteContent },
        throwOnError: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey });
      setNoteTitle("");
      setNoteContent("");
    },
  });

  const generateNote = useMutation({
    mutationFn: () =>
      notesControllerGenerate({
        path: { hubId },
        body: { mode: "from_topic_query", query: noteQuery },
        throwOnError: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey });
      setNoteQuery("");
    },
  });

  const createFlashcard = useMutation({
    mutationFn: () =>
      flashcardsControllerCreate({
        path: { hubId },
        body: { front: cardFront, back: cardBack },
        throwOnError: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardsKey });
      setCardFront("");
      setCardBack("");
    },
  });

  const generateFlashcards = useMutation({
    mutationFn: () =>
      flashcardsControllerGenerate({
        path: { hubId },
        body: { mode: "from_topic_query", query: cardQuery, count: 3 },
        throwOnError: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardsKey });
      setCardQuery("");
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="rounded border p-2 text-sm">
                <p className="font-medium">{note.title}</p>
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">{note.content}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
          </div>
          <Input placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
          <Input placeholder="Content" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
          <Button
            size="sm"
            onClick={() => createNote.mutate()}
            disabled={!noteTitle.trim() || !noteContent.trim() || createNote.isPending}
          >
            Create note
          </Button>
          <Input placeholder="Generate from topic..." value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateNote.mutate()}
            disabled={!noteQuery.trim() || generateNote.isPending}
          >
            {generateNote.isPending ? "Generating..." : "Generate note"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Flashcards ({flashcards.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {flashcards.map((card) => (
              <div key={card.id} className="rounded border p-2 text-sm">
                <p className="font-medium">{card.front}</p>
                <p className="text-muted-foreground">{card.back}</p>
              </div>
            ))}
            {flashcards.length === 0 && <p className="text-sm text-muted-foreground">No flashcards yet.</p>}
          </div>
          <Input placeholder="Front" value={cardFront} onChange={(e) => setCardFront(e.target.value)} />
          <Input placeholder="Back" value={cardBack} onChange={(e) => setCardBack(e.target.value)} />
          <Button
            size="sm"
            onClick={() => createFlashcard.mutate()}
            disabled={!cardFront.trim() || !cardBack.trim() || createFlashcard.isPending}
          >
            Create flashcard
          </Button>
          <Input placeholder="Generate from topic..." value={cardQuery} onChange={(e) => setCardQuery(e.target.value)} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateFlashcards.mutate()}
            disabled={!cardQuery.trim() || generateFlashcards.isPending}
          >
            {generateFlashcards.isPending ? "Generating..." : "Generate flashcards"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
