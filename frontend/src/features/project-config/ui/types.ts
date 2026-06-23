import type { DragEndEvent } from '@dnd-kit/core';
import type { Issue } from '@/features/board/model';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  OrderedIssueFieldEntry,
  ProjectConfig,
  ProjectTemplate,
  Transition,
} from '@/features/project-config/model';
import type { CustomRole, Project } from '@/features/profile';

export interface RolesTabProps {
  draft: ProjectConfig;
  users: Array<{ roleId: string; projectOwner: boolean }>;
  expandedRoleId: string | null;
  setExpandedRoleId: (value: string | null) => void;
  addRole: () => void;
  deleteRole: (roleId: string) => void;
  updateRole: (
    roleId: string,
    updater: (roleItem: CustomRole) => CustomRole
  ) => void;
}

export interface LifecycleTabProps {
  draft: ProjectConfig;
  sortedStatuses: ProjectConfig['lifecycle']['statuses'];
  expandedStatusId: string | null;
  setExpandedStatusId: (value: string | null) => void;
  expandedTransitionId: string | null;
  setExpandedTransitionId: (value: string | null) => void;
  transitionRulesDisabled: boolean;
  getIssueCountForStatus: (statusId: string) => number;
  addStatus: () => void;
  deleteStatus: (statusId: string) => void;
  updateStatus: (
    statusId: string,
    updater: (
      status: ProjectConfig['lifecycle']['statuses'][number]
    ) => ProjectConfig['lifecycle']['statuses'][number]
  ) => void;
  addTransition: () => void;
  updateTransition: (
    transitionId: string,
    updater: (transition: Transition) => Transition
  ) => void;
  removeTransition: (transitionId: string) => void;
  handleStatusDragEnd: (event: DragEndEvent) => void;
  setTransitionRulesDisabled: (disabled: boolean) => void;
  setInitialStatus: (statusId: string) => void;
}

export interface FieldsTabProps {
  draft: ProjectConfig;
  fieldEntries: OrderedIssueFieldEntry[];
  boardCardFieldIds: string[];
  expandedFieldId: string | null;
  setExpandedFieldId: (value: string | null) => void;
  addField: () => void;
  deleteField: (fieldId: string) => void;
  updateField: (
    fieldId: string,
    updater: (field: CustomFieldDefinition) => CustomFieldDefinition
  ) => void;
  switchFieldType: (
    field: CustomFieldDefinition,
    type: CustomFieldType,
    roles: ProjectConfig['roles']
  ) => CustomFieldDefinition;
  handleFieldDragEnd: (event: DragEndEvent) => void;
  toggleBoardCardField: (fieldId: string) => void;
  issues: Issue[];
}

export interface TemplatesTabProps {
  exportedTemplate: ProjectTemplate | null;
  templateLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  selectedTemplateProjectId: string;
  setSelectedTemplateProjectId: (value: string) => void;
  sourceProjects: Project[];
  handleExportTemplate: () => void;
  handleApplyTemplate: () => void;
  handleImportTemplate: (file: File) => void;
}
