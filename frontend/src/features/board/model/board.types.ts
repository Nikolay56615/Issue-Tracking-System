import type { UserRole } from '@/features/profile';

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
  customFields?: Record<string, IssueCustomFieldValue>;
}

export type IssueStatus = string;

export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'SEARCH';

export type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IssueCustomFieldValue = string | number | boolean | string[] | null;

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
  customFields?: Record<string, IssueCustomFieldValue>;
}

export interface CreateIssueRequest {
  projectId: number;
  name: string;
  type?: IssueType;
  priority?: IssuePriority;
  description: string;
  assigneeIds: number[];
  attachmentFileNames: string[];
  dueDate?: string; // формат: 'YYYY-MM-DD'
  customFields?: Record<string, IssueCustomFieldValue>;
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

export interface UpdateIssueRequest {
  name: string;
  description?: string;
  priority?: IssuePriority;
  type?: IssueType;
  status?: IssueStatus;
  assigneeIds?: number[];
  attachmentFileNames?: string[];
  attachments?: Attachment[]; // <— добавь это
  customFields?: Record<string, IssueCustomFieldValue>;
}
