/**
 * Types for Usable API interactions
 */

export interface CreateFragmentRequest {
  title: string;
  content: string;
  workspaceId: string;
  fragmentTypeId: string;
  summary?: string;
  tags?: string[];
  repository?: string;
}

export interface CreateFragmentResponse {
  fragmentId: string;
  title: string;
  summary: string;
  fragmentType: string;
  workspaceId: string;
  workspaceName: string;
  authorName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface UpdateFragmentRequest {
  fragmentId: string;
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  fragmentTypeId?: string;
  patchOperations?: PatchOperation[];
}

export type PatchOperation =
  | {
      type: 'replace';
      searchText: string;
      replaceText: string;
      replaceAll: boolean;
    }
  | {
      type: 'add';
      lineNumber: number;
      lines: string[];
    }
  | {
      type: 'delete';
      startLine: number;
      endLine: number;
    };

export interface UsableError {
  error: string;
  message: string;
  statusCode: number;
}
