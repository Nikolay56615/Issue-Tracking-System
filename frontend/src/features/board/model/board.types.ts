import type { UserRole } from '@/features/profile/model/profile.types.ts';

export interface Issue {
  id: number;
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  description: string;
  assigneeIds: number[];
  authorId: number;
  startDate: string;
  dueDate: string;
  attachments: Attachment[];
}

export type IssueStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'SEARCH';

export type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Attachment {
  originalFileName: string;
  url: string;
}

export interface UploadResponse {
  url: string;
}
export interface GetBoardRequest {
  projectId: number;
  filters?: IssueFilters;
}

export interface IssueFilters {
  types?: IssueType[];
  priorities?: IssuePriority[];
  assigneeId?: number;
  nameQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateIssueRequest {
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  description: string;
  assigneeIds: number[];
  attachmentFileNames: string[];
}

export interface ChangeIssueStatusRequest {
  id: number;
  newStatus: IssueStatus;
}

export interface LifecycleGraph {
  statuses: IssueStatus[];
  transitions: LifecycleTransition[];
}

export interface LifecycleTransition {
  from: IssueStatus;
  to: IssueStatus;
  allowedRoles: UserRole[];
  authorAllowed: boolean;
  assigneeAllowed: boolean;
}
