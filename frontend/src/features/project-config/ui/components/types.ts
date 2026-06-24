import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { Issue } from '@/features/board/model';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  OrderedIssueFieldEntry,
  ProjectConfig,
  Transition,
  TransitionCondition,
} from '@/features/project-config/model';
import type { CustomRole, Project } from '@/features/profile';

export interface SortableDraggableHandle {
  attributes: object;
  listeners: object | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

export interface RowToggleButtonProps {
  title: string;
  subtitle?: string;
  meta?: string;
  open: boolean;
  onClick?: () => void;
  accent?: ReactNode;
  draggable?: SortableDraggableHandle;
  expandable?: boolean;
  compact?: boolean;
}

export interface SettingsSectionProps {
  title: string;
  description?: string;
  helpText?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface SectionPlaceholderProps {
  text: string;
}

export interface SortableSettingsRowProps {
  id: string;
  children: (params: {
    draggable: SortableDraggableHandle;
    isDragging: boolean;
  }) => ReactNode;
}

export interface PermissionGroupCardProps {
  role: CustomRole;
  disabled?: boolean;
  updateRole: (
    roleId: string,
    updater: (roleItem: CustomRole) => CustomRole
  ) => void;
}

export interface RoleCardProps {
  role: CustomRole;
  isOpen: boolean;
  users: Array<{ roleId: string; projectOwner: boolean }>;
  onToggle: () => void;
  updateRole: (
    roleId: string,
    updater: (roleItem: CustomRole) => CustomRole
  ) => void;
  deleteRole: (roleId: string) => void;
}

export interface StatusRowProps {
  status: ProjectConfig['lifecycle']['statuses'][number];
  isOpen: boolean;
  issueCount: number;
  onToggle: () => void;
  onDelete: (statusId: string) => void;
  onSetInitial: (statusId: string) => void;
  updateStatus: (
    statusId: string,
    updater: (
      status: ProjectConfig['lifecycle']['statuses'][number]
    ) => ProjectConfig['lifecycle']['statuses'][number]
  ) => void;
}

export interface TransitionConditionRowProps {
  condition: TransitionCondition;
  index: number;
  transitionId: string;
  draft: ProjectConfig;
  userReferenceFields: ProjectConfig['customFields'];
  updateTransition: (
    transitionId: string,
    updater: (transition: Transition) => Transition
  ) => void;
}

export interface TransitionCardProps {
  transition: Transition;
  draft: ProjectConfig;
  sortedStatuses: ProjectConfig['lifecycle']['statuses'];
  isOpen: boolean;
  transitionRulesDisabled: boolean;
  onToggle: () => void;
  removeTransition: (transitionId: string) => void;
  updateTransition: (
    transitionId: string,
    updater: (transition: Transition) => Transition
  ) => void;
}

export interface FieldEditorProps {
  field: CustomFieldDefinition;
  roles: ProjectConfig['roles'];
  updateField: (
    fieldId: string,
    updater: (field: CustomFieldDefinition) => CustomFieldDefinition
  ) => void;
  switchFieldType: (
    field: CustomFieldDefinition,
    type: CustomFieldType,
    roles: ProjectConfig['roles']
  ) => CustomFieldDefinition;
  deleteField: (fieldId: string) => void;
}

export interface FieldRowProps {
  fieldEntry: OrderedIssueFieldEntry;
  draft: ProjectConfig;
  issues: Issue[];
  expandedFieldId: string | null;
  setExpandedFieldId: (value: string | null) => void;
  updateField: (
    fieldId: string,
    updater: (field: CustomFieldDefinition) => CustomFieldDefinition
  ) => void;
  switchFieldType: (
    field: CustomFieldDefinition,
    type: CustomFieldType,
    roles: ProjectConfig['roles']
  ) => CustomFieldDefinition;
  deleteField: (fieldId: string) => void;
  shownOnBoardCard: boolean;
  toggleBoardCardField: (fieldId: string) => void;
}

export interface TemplatesContentProps {
  exportedTemplate: unknown;
  templateLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  selectedTemplateProjectId: string;
  setSelectedTemplateProjectId: (value: string) => void;
  sourceProjects: Project[];
  handleExportTemplate: () => void;
  handleApplyTemplate: () => void;
}

export interface LifecycleActions {
  addStatus: () => void;
  deleteStatus: (statusId: string) => void;
  addTransition: () => void;
  removeTransition: (transitionId: string) => void;
  handleStatusDragEnd: (event: DragEndEvent) => void;
  setTransitionRulesDisabled: (disabled: boolean) => void;
  setInitialStatus: (statusId: string) => void;
  getIssueCountForStatus: (statusId: string) => number;
}
