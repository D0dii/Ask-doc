export interface VectorPayload {
  [key: string]: unknown;
  text: string;
  fileId: string;
  workspaceId: string;
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: VectorPayload;
}

export interface VectorSearchResult {
  fileId: string;
  text: string;
  score: number;
}

export interface VectorStorePort {
  upsertPoints(points: VectorPoint[]): Promise<void>;
  searchByVector(params: {
    workspaceId: string;
    vector: number[];
    limit: number;
  }): Promise<VectorSearchResult[]>;
  deleteByFileId(fileId: string): Promise<void>;
  deleteByWorkspaceId(workspaceId: string): Promise<void>;
}

export const VECTOR_STORE = Symbol('VECTOR_STORE');
