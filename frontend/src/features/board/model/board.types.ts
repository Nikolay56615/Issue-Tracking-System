export interface Issue {
  id: number;
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  description: string;
}

export type IssueStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type IssueType = 'TASK' | 'BUG' | 'FEATURE' | 'SEARCH';

export type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface GetBoardRequest {
  projectId: number;
  //filter?: IssueFilter TODO: implement filters
}
export interface CreateIssueRequest {
  projectId: number;
  name: string;
  type: IssueType;
  priority: IssuePriority;
  description: string;
}

export interface ChangeIssueStatusRequest {
  id: number;
  newStatus: IssueStatus;
}
