import type { PermissionKey } from '@/features/profile/model/profile.types.ts';

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  'issue.view': 'Can view project issues and board content.',
  'issue.create': 'Can create new issues in the project.',
  'issue.edit': 'Can update issue details and move allowed issue statuses.',
  'issue.remove': 'Can move issues to trash.',
  'members.view': 'Can open the project member directory.',
  'members.invite': 'Can invite users to the project.',
  'members.remove': 'Can remove users from the project.',
  'members.assignRole': 'Can change project member roles.',
  'settings.manage': 'Can edit project roles, workflow, fields, and settings.',
  'project.archive': 'Can archive the project.',
  'project.restore': 'Can restore an archived project.',
  'template.export': 'Can export this project settings template.',
  'template.apply': 'Can apply another project template to this project.',
};
