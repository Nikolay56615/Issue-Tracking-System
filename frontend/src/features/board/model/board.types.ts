export interface Issue {
  id: number;
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  description: string;
}

export type IssueStatus = 'backlog' | 'inProgress' | 'review' | 'done';
export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'SEARCH';
export type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
