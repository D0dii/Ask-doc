import type { FileResponseDto } from "../types";

export const hasProcessingFiles = (files: FileResponseDto[] | undefined) =>
  files?.some((file) => file.status === "processing" || file.status === "pending");
