import type { Transition } from '@/features/project-config/model/project-config.types.ts';
import type { CustomRole } from '@/features/profile/model/profile.types.ts';

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

export type IssueCustomFieldValue = string | number | boolean | null;

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
  dueDate?: string;
  customFields?: Record<string, IssueCustomFieldValue>;
}

export interface ChangeIssueStatusRequest {
  id: number;
  newStatus: IssueStatus;
}

export interface LifecycleGraph {
  statuses: IssueStatus[];
  transitions: LifecycleGraphTransition[];
}

export interface LifecycleGraphTransition {
  from: IssueStatus;
  to: IssueStatus;
  allowedRoles: string[];
  authorAllowed: boolean;
  assigneeAllowed: boolean;
}

export type LifecycleTransition = Transition;

export interface UpdateIssueRequest {
  name: string;
  description?: string;
  priority?: IssuePriority;
  type?: IssueType;
  status?: IssueStatus;
  assigneeIds?: number[];
  dueDate?: string;
  attachments?: Attachment[];
  customFields?: Record<string, IssueCustomFieldValue>;
}

export interface CurrentProjectRoleResponse {
  role: CustomRole;
}
