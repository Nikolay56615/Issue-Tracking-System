export interface Issue {
  id: number;
  title: string;
  status: IssueStatus;
}

export type IssueStatus = 'backlog' | 'inProgress' | 'review' | 'done';
