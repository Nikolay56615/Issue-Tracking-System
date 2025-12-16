export interface CreateIssueRequest {
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  description: string;
}

type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'SEARCH';

type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
