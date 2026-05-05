import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ChevronDown,
  Download,
  GripVertical,
  Plus,
  Save,
  Sparkles,
  Trash,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { cn } from '@/lib/utils.ts';
import { getMyRole } from '@/features/board/api/api.board.ts';
import { getBoard } from '@/features/board/model/board.actions.ts';
import type { Issue } from '@/features/board/model';
import {
  applyProjectTemplate,
  exportProjectTemplate,
  fetchProjectConfig,
  getNormalizedFieldOrder,
  getOrderedIssueFields,
  hasPermission,
  PERMISSION_GROUPS,
  saveProjectConfig,
  type CustomFieldDefinition,
  type CustomFieldType,
  type OrderedIssueFieldEntry,
  type ProjectConfig,
  type Transition,
  type TransitionCondition,
} from '@/features/project-config/model';
import type { CustomRole } from '@/features/profile';
import { fetchProjects } from '@/features/profile/model/profile.actions.ts';
import { useAppDispatch, useAppSelector } from '@/store';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

const FIELD_TYPE_OPTIONS: CustomFieldType[] = [
  'text',
  'number',
  'user_reference',
  'issue_reference',
];

const CONDITION_EDITOR_OPTIONS = [
  { value: 'role', label: 'Role' },
  { value: 'user_source', label: 'User source' },
] as const;

const formatFieldTypeLabel = (type: CustomFieldType) =>
  type.replace('_', ' ');

const formatConditionLabel = (type: TransitionCondition['type']) =>
  type.replace(/_/g, ' ');

const cloneConfig = (config: ProjectConfig) => structuredClone(config);

const getInitialRole = (config: ProjectConfig) =>
  config.roles.find((role) => role.permissions.includes('settings.manage')) ??
  config.roles[0];

const createRoleDraft = (projectId: number): CustomRole => ({
  id: `project-${projectId}-role-${Date.now()}`,
  projectId,
  name: 'New Role',
  permissions: ['issue.view'],
});

const createStatusDraft = (projectId: number, displayOrder: number) => ({
  id: `project-${projectId}-status-${Date.now()}`,
  projectId,
  name: `Status ${displayOrder}`,
  displayOrder,
  color: '#64748b',
});

const createFieldDraft = (projectId: number): CustomFieldDefinition => ({
  id: `project-${projectId}-field-${Date.now()}`,
  projectId,
  name: 'New Field',
  type: 'text',
  required: false,
  config: {
    maxLength: 80,
  },
});

const createTransitionDraft = (config: ProjectConfig): Transition | null => {
  if (config.lifecycle.statuses.length < 2 || config.roles.length === 0) {
    return null;
  }

  return {
    id: `project-${config.projectId}-transition-${Date.now()}`,
    fromStatusId: config.lifecycle.statuses[0].id,
    toStatusId: config.lifecycle.statuses[1].id,
    conditions: [
      {
        type: 'role',
        roleId: getInitialRole(config).id,
      },
    ],
  };
};

const getIssueCountForStatus = (issues: Issue[], statusId: string) =>
  issues.filter((issue) => issue.status === statusId).length;

const hasValuesForField = (issues: Issue[], fieldId: string) =>
  issues.some((issue) => {
    const value = issue.customFields?.[fieldId];
    return value !== null && value !== undefined && value !== '';
  });

const toTextConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'text' as const,
  config: {
    maxLength: field.type === 'text' ? field.config.maxLength : 80,
  },
});

const toNumberConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'number' as const,
  config: {
    min: field.type === 'number' ? field.config.min : 1,
    max: field.type === 'number' ? field.config.max : 100,
    isInteger: field.type === 'number' ? field.config.isInteger ?? true : true,
  },
});

const toUserReferenceConfig = (
  field: CustomFieldDefinition,
  roles: CustomRole[]
) => ({
  ...field,
  type: 'user_reference' as const,
  config: {
    allowedRoleIds:
      field.type === 'user_reference'
        ? field.config.allowedRoleIds
        : roles[0]
          ? [roles[0].id]
          : [],
  },
});

const toIssueReferenceConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'issue_reference' as const,
  config: {},
});

const switchFieldType = (
  field: CustomFieldDefinition,
  type: CustomFieldType,
  roles: CustomRole[]
): CustomFieldDefinition => {
  if (type === 'text') return toTextConfig(field);
  if (type === 'number') return toNumberConfig(field);
  if (type === 'user_reference') return toUserReferenceConfig(field, roles);
  return toIssueReferenceConfig(field);
};

const createCondition = (
  type: TransitionCondition['type'],
  config: ProjectConfig
): TransitionCondition => {
  if (type === 'role') {
    return {
      type,
      roleId: getInitialRole(config).id,
    };
  }

  if (type === 'field_user_reference') {
    const field = config.customFields.find(
      (item) => item.type === 'user_reference'
    );
    return {
      type,
      customFieldId: field?.id ?? '',
    };
  }

  return { type };
};

const getConditionEditorKind = (condition: TransitionCondition) =>
  condition.type === 'role' ? 'role' : 'user_source';

const getUserSourceValue = (condition: TransitionCondition) => {
  if (condition.type === 'field_user_reference') {
    return `field:${condition.customFieldId}`;
  }

  return condition.type;
};

const createConditionFromUserSource = (
  value: string,
  config: ProjectConfig
): TransitionCondition => {
  if (value === 'author') {
    return { type: 'author' };
  }

  if (value === 'assignee') {
    return { type: 'assignee' };
  }

  const fallbackField = config.customFields.find(
    (field) => field.type === 'user_reference'
  );

  return {
    type: 'field_user_reference',
    customFieldId:
      value.replace(/^field:/, '') || fallbackField?.id || '',
  };
};

const getStatusName = (config: ProjectConfig, statusId: string) =>
  config.lifecycle.statuses.find((status) => status.id === statusId)?.name ??
  statusId;

const getRoleMemberCount = (
  users: Array<{ roleId: string }>,
  roleId: string
) => users.filter((user) => user.roleId === roleId).length;

const describeTransitionCondition = (
  condition: TransitionCondition,
  config: ProjectConfig
) => {
  if (condition.type === 'role') {
    return (
      config.roles.find((role) => role.id === condition.roleId)?.name ?? 'Role'
    );
  }

  if (condition.type === 'field_user_reference') {
    return (
      config.customFields.find((field) => field.id === condition.customFieldId)
        ?.name ?? 'User field'
    );
  }

  return formatConditionLabel(condition.type);
};

const getFieldEntryMeta = (
  fieldEntry: OrderedIssueFieldEntry,
  issues: Issue[]
) => {
  if (fieldEntry.kind === 'system') {
    if (fieldEntry.systemFieldId === 'author') {
      return 'System field · read only';
    }

    return 'System field';
  }

  const customField = fieldEntry.customField;
  if (!customField) {
    return 'Custom field';
  }

  if (hasValuesForField(issues, customField.id)) {
    return 'Has issue values';
  }

  return customField.required ? 'Required' : 'Optional';
};

const RowToggleButton = ({
  title,
  subtitle,
  meta,
  open,
  onClick,
  accent,
  draggable,
  expandable = true,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  open: boolean;
  onClick?: () => void;
  accent?: ReactNode;
  draggable?: {
    attributes: object;
    listeners: object | undefined;
    setActivatorNodeRef: (element: HTMLElement | null) => void;
  };
  expandable?: boolean;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5">
    {draggable ? (
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted inline-flex size-8 shrink-0
          cursor-grab items-center justify-center rounded-md active:cursor-grabbing"
        ref={draggable.setActivatorNodeRef}
        {...draggable.attributes}
        {...draggable.listeners}
      >
        <GripVertical className="size-4" />
      </button>
    ) : null}
    {expandable ? (
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-3
          rounded-lg px-2 py-2.5 text-left transition-colors"
      >
        {accent}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{title}</div>
          {(subtitle || meta) && (
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {subtitle ? <span>{subtitle}</span> : null}
              {meta ? <span>{meta}</span> : null}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
    ) : (
      <div
        className="flex min-w-0 flex-1 items-center justify-between gap-3
          rounded-lg px-2 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {accent}
          <div className="truncate text-sm font-medium">{title}</div>
        </div>
        {meta || subtitle ? (
          <span className="text-muted-foreground shrink-0 text-xs">
            {meta ?? subtitle}
          </span>
        ) : null}
      </div>
    )}
  </div>
);

const SettingsSection = ({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn('rounded-xl border bg-background', className)}>
    <div
      className="flex min-h-15 flex-wrap justify-between gap-3 border-b px-4
        py-3"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    <div className="space-y-2 p-3">{children}</div>
  </section>
);

const SectionPlaceholder = ({ text }: { text: string }) => (
  <div
    className="text-muted-foreground bg-muted/20 rounded-lg border border-dashed
      px-3 py-4 text-sm"
  >
    {text}
  </div>
);

const SortableSettingsRow = ({
  id,
  children,
}: {
  id: string;
  children: (params: {
    draggable: {
      attributes: object;
      listeners: object | undefined;
      setActivatorNodeRef: (element: HTMLElement | null) => void;
    };
    isDragging: boolean;
  }) => ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && 'z-10')}
    >
      {children({
        draggable: {
          attributes,
          listeners,
          setActivatorNodeRef,
        },
        isDragging,
      })}
    </div>
  );
};

export const ProjectSettingsPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);
  const dispatch = useAppDispatch();
  const {
    config,
    loading,
    saving,
    error,
    saveError,
    templateLoading,
    templateError,
    exportedTemplate,
  } = useAppSelector((state) => state.projectConfig);
  const { issues } = useAppSelector((state) => state.board);
  const { users } = useAppSelector((state) => state.users);
  const { projects } = useAppSelector((state) => state.profile);

  const [role, setRole] = useState<CustomRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [draft, setDraft] = useState<ProjectConfig | null>(null);
  const [selectedTemplateProjectId, setSelectedTemplateProjectId] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
  const [expandedTransitionId, setExpandedTransitionId] = useState<string | null>(
    null
  );
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) return;

    dispatch(fetchProjectConfig(projectId));
    dispatch(getBoard({ projectId }));
    dispatch(getProjectUsers(projectId));
    dispatch(fetchProjects());
  }, [dispatch, projectId]);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      setRoleLoading(true);
      try {
        const response = await getMyRole(projectId);
        if (!cancelled) {
          setRole(response.role);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setDraft(config ? cloneConfig(config) : null);
  }, [config]);

  const canManageSettings = hasPermission(role, 'settings.manage');

  const sourceProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.id !== projectId && !project.archived
      ),
    [projectId, projects]
  );

  const sortedStatuses = useMemo(
    () =>
      [...(draft?.lifecycle.statuses ?? [])].sort(
        (left, right) => left.displayOrder - right.displayOrder
      ),
    [draft]
  );

  const userReferenceFields = useMemo(
    () =>
      draft?.customFields.filter((field) => field.type === 'user_reference') ??
      [],
    [draft]
  );
  const fieldEntries = useMemo(() => getOrderedIssueFields(draft), [draft]);
  const statusSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  if (loading === 'pending' || roleLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  if (!canManageSettings) {
    return (
      <div className="p-8">
        Project settings are available only for roles with settings access.
      </div>
    );
  }

  if (!draft) {
    return <div className="p-8">Project config is empty.</div>;
  }

  const transitionRulesDisabled = !draft.lifecycle.transitionRulesEnabled;

  const updateDraft = (updater: (current: ProjectConfig) => ProjectConfig) => {
    setDraft((current) =>
      current
        ? {
            ...updater(current),
            updatedAt: new Date().toISOString(),
          }
        : current
    );
  };

  const updateRole = (
    roleId: string,
    updater: (roleItem: CustomRole) => CustomRole
  ) => {
    updateDraft((current) => ({
      ...current,
      roles: current.roles.map((item) =>
        item.id === roleId ? updater(item) : item
      ),
    }));
  };

  const updateStatus = (
    statusId: string,
    updater: (
      status: ProjectConfig['lifecycle']['statuses'][number]
    ) => ProjectConfig['lifecycle']['statuses'][number]
  ) => {
    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        statuses: current.lifecycle.statuses.map((item) =>
          item.id === statusId ? updater(item) : item
        ),
      },
    }));
  };

  const updateField = (
    fieldId: string,
    updater: (field: CustomFieldDefinition) => CustomFieldDefinition
  ) => {
    updateDraft((current) => ({
      ...current,
      customFields: current.customFields.map((item) =>
        item.id === fieldId ? updater(item) : item
      ),
    }));
  };

  const updateTransition = (
    transitionId: string,
    updater: (transition: Transition) => Transition
  ) => {
    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        transitions: current.lifecycle.transitions.map((item) =>
          item.id === transitionId ? updater(item) : item
        ),
      },
    }));
  };

  const addRole = () => {
    updateDraft((current) => ({
      ...current,
      roles: [...current.roles, createRoleDraft(current.projectId)],
    }));
  };

  const deleteRole = (roleId: string) => {
    if (users.some((user) => user.roleId === roleId)) {
      toast.error('Role is assigned to project members');
      return;
    }

    if (draft.roles.length <= 1) {
      toast.error('Project must keep at least one role');
      return;
    }

    updateDraft((current) => ({
      ...current,
      roles: current.roles.filter((item) => item.id !== roleId),
      customFields: current.customFields.map((field) =>
        field.type === 'user_reference'
          ? {
              ...field,
              config: {
                allowedRoleIds: field.config.allowedRoleIds.filter(
                  (item) => item !== roleId
                ),
              },
            }
          : field
      ),
      lifecycle: {
        ...current.lifecycle,
        transitions: current.lifecycle.transitions.map((transition) => ({
          ...transition,
          conditions: transition.conditions.filter(
            (condition) =>
              condition.type !== 'role' || condition.roleId !== roleId
          ),
        })),
      },
    }));
    if (expandedRoleId === roleId) {
      setExpandedRoleId(null);
    }
  };

  const addStatus = () => {
    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        statuses: [
          ...current.lifecycle.statuses,
          createStatusDraft(
            current.projectId,
            current.lifecycle.statuses.length + 1
          ),
        ],
      },
    }));
  };

  const deleteStatus = (statusId: string) => {
    if (getIssueCountForStatus(issues, statusId) > 0) {
      toast.error('Move issues before removing this status');
      return;
    }

    if (draft.lifecycle.statuses.length <= 1) {
      toast.error('Project must keep at least one status');
      return;
    }

    updateDraft((current) => {
      const remainingStatuses = current.lifecycle.statuses.filter(
        (item) => item.id !== statusId
      );
      const hasInitial = remainingStatuses.some((item) => item.isInitial);
      const nextStatuses = remainingStatuses.map((status, index) => ({
        ...status,
        displayOrder: index + 1,
        isInitial:
          hasInitial ? status.isInitial : index === 0 ? true : undefined,
      }));

      return {
        ...current,
        lifecycle: {
          ...current.lifecycle,
          statuses: nextStatuses,
          transitions: current.lifecycle.transitions.filter(
            (transition) =>
              transition.fromStatusId !== statusId &&
              transition.toStatusId !== statusId
          ),
        },
      };
    });
    if (expandedStatusId === statusId) {
      setExpandedStatusId(null);
    }
  };

  const addTransition = () => {
    const nextTransition = createTransitionDraft(draft);
    if (!nextTransition) {
      toast.error('Create at least two statuses and one role first');
      return;
    }

    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        transitions: [...current.lifecycle.transitions, nextTransition],
      },
    }));
  };

  const addField = () => {
    updateDraft((current) => {
      const nextField = createFieldDraft(current.projectId);

      return {
        ...current,
        customFields: [...current.customFields, nextField],
        fieldOrder: [...getNormalizedFieldOrder(current), nextField.id],
      };
    });
  };

  const deleteField = (fieldId: string) => {
    if (hasValuesForField(issues, fieldId)) {
      toast.error('This field already has values in issues');
      return;
    }

    updateDraft((current) => ({
      ...current,
      customFields: current.customFields.filter((field) => field.id !== fieldId),
      fieldOrder: getNormalizedFieldOrder(current).filter((item) => item !== fieldId),
      lifecycle: {
        ...current.lifecycle,
        transitions: current.lifecycle.transitions.map((transition) => ({
          ...transition,
          conditions: transition.conditions.filter(
            (condition) =>
              condition.type !== 'field_user_reference' ||
              condition.customFieldId !== fieldId
          ),
        })),
      },
    }));
    if (expandedFieldId === fieldId) {
      setExpandedFieldId(null);
    }
  };

  const save = async () => {
    try {
      await dispatch(saveProjectConfig({ projectId, config: draft })).unwrap();
      toast.success('Project config saved');
    } catch (saveErrorValue) {
      toast.error(String(saveErrorValue));
    }
  };

  const handleExportTemplate = async () => {
    try {
      await dispatch(exportProjectTemplate(projectId)).unwrap();
      toast.success('Template exported');
    } catch (exportErrorValue) {
      toast.error(String(exportErrorValue));
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateProjectId) {
      toast.error('Select a source project first');
      return;
    }

    try {
      const appliedConfig = await dispatch(
        applyProjectTemplate({
          projectId,
          sourceProjectId: Number(selectedTemplateProjectId),
        })
      ).unwrap();
      setDraft(cloneConfig(appliedConfig));
      toast.success('Template applied');
    } catch (applyErrorValue) {
      toast.error(String(applyErrorValue));
    }
  };

  const handleStatusDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    updateDraft((current) => {
      const orderedStatuses = [...current.lifecycle.statuses].sort(
        (left, right) => left.displayOrder - right.displayOrder
      );
      const oldIndex = orderedStatuses.findIndex(
        (status) => status.id === active.id
      );
      const newIndex = orderedStatuses.findIndex(
        (status) => status.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }

      return {
        ...current,
        lifecycle: {
          ...current.lifecycle,
          statuses: arrayMove(orderedStatuses, oldIndex, newIndex).map(
            (status, index) => ({
              ...status,
              displayOrder: index + 1,
            })
          ),
        },
      };
    });
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    updateDraft((current) => {
      const orderedFields = getNormalizedFieldOrder(current);
      const oldIndex = orderedFields.findIndex((fieldId) => fieldId === active.id);
      const newIndex = orderedFields.findIndex((fieldId) => fieldId === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }

      return {
        ...current,
        fieldOrder: arrayMove(orderedFields, oldIndex, newIndex),
      };
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure roles, lifecycle, fields, and reusable project templates
            in one place.
          </p>
        </div>
        <Button className="min-w-30" onClick={save} disabled={saving === 'pending'}>
          <Save data-icon="inline-start" />
          {saving === 'pending' ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {(saveError || templateError) && (
        <div
          className="text-destructive bg-destructive/10 border-destructive/20
            rounded-lg border px-3 py-2 text-sm"
        >
          {saveError || templateError}
        </div>
      )}

      <Tabs defaultValue="roles" className="flex flex-col gap-4">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-0 space-y-4">
          <SettingsSection
            title="Project Roles"
            description="Compact overview of each role, its permissions, and assigned members."
            action={
              <Button size="sm" onClick={addRole}>
                <Plus data-icon="inline-start" />
                Add role
              </Button>
            }
          >
            {draft.roles.map((projectRole) => {
              const isOpen = expandedRoleId === projectRole.id;

              return (
                <div key={projectRole.id} className="rounded-lg border">
                  <RowToggleButton
                    title={projectRole.name}
                    subtitle={`${projectRole.permissions.length} permissions`}
                    meta={`${getRoleMemberCount(users, projectRole.id)} members`}
                    open={isOpen}
                    onClick={() =>
                      setExpandedRoleId(isOpen ? null : projectRole.id)
                    }
                  />
                  {isOpen && (
                    <div className="border-t px-3 py-3">
                      <div className="mb-4 flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Role name</Label>
                          <Input
                            value={projectRole.name}
                            onChange={(event) =>
                              updateRole(projectRole.id, (current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRole(projectRole.id)}
                        >
                          <Trash data-icon="inline-start" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {PERMISSION_GROUPS.map((group) => (
                          <div key={group.label} className="rounded-md border p-3">
                            <div className="mb-2 text-sm font-medium">
                              {group.label}
                            </div>
                            <div className="space-y-2">
                              {group.permissions.map((permission) => {
                                const checked =
                                  projectRole.permissions.includes(permission);

                                return (
                                  <label
                                    key={permission}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(event) =>
                                        updateRole(projectRole.id, (current) => ({
                                          ...current,
                                          permissions: event.target.checked
                                            ? [...current.permissions, permission]
                                            : current.permissions.filter(
                                                (item) => item !== permission
                                              ),
                                        }))
                                      }
                                    />
                                    <span>{permission}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </SettingsSection>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-0 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <SettingsSection
            title="Statuses"
            description="Status summary stays visible; expand a row to edit details."
            action={
              <Button size="sm" onClick={addStatus}>
                <Plus data-icon="inline-start" />
                Add status
              </Button>
            }
          >
            <DndContext
              sensors={statusSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleStatusDragEnd}
            >
              <SortableContext
                items={sortedStatuses.map((status) => status.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedStatuses.map((status) => {
                  const isOpen = expandedStatusId === status.id;

                  return (
                    <SortableSettingsRow key={status.id} id={status.id}>
                      {({ draggable, isDragging }) => (
                        <div
                          className={cn(
                            'rounded-lg border bg-background',
                            isDragging && 'shadow-sm'
                          )}
                        >
                          <RowToggleButton
                            title={status.name}
                            subtitle={
                              status.isInitial
                                ? 'Initial status'
                                : 'Lifecycle status'
                            }
                            meta={`${getIssueCountForStatus(issues, status.id)} issues`}
                            open={isOpen}
                            onClick={() =>
                              setExpandedStatusId(isOpen ? null : status.id)
                            }
                            accent={
                              <span
                                className="h-3 w-3 shrink-0 rounded-full border"
                                style={{ backgroundColor: status.color }}
                              />
                            }
                            draggable={draggable}
                          />
                          {isOpen && (
                            <div className="border-t px-3 py-3">
                              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={status.name}
                                    onChange={(event) =>
                                      updateStatus(status.id, (current) => ({
                                        ...current,
                                        name: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Color</Label>
                                  <Input
                                    type="color"
                                    value={status.color}
                                    onChange={(event) =>
                                      updateStatus(status.id, (current) => ({
                                        ...current,
                                        color: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex items-end justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteStatus(status.id)}
                                  >
                                    <Trash data-icon="inline-start" />
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              <label className="mt-4 flex items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  checked={Boolean(status.isInitial)}
                                  onChange={() =>
                                    updateDraft((current) => ({
                                      ...current,
                                      lifecycle: {
                                        ...current.lifecycle,
                                        statuses: current.lifecycle.statuses.map((item) => ({
                                          ...item,
                                          isInitial:
                                            item.id === status.id
                                              ? true
                                              : undefined,
                                        })),
                                      },
                                    }))
                                  }
                                />
                                <span>Initial status</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableSettingsRow>
                  );
                })}
              </SortableContext>
            </DndContext>
          </SettingsSection>

          <SettingsSection
            title="Transitions"
            description="Keep transitions readable in a compact list and expand rows only when needed."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={transitionRulesDisabled}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        lifecycle: {
                          ...current.lifecycle,
                          transitionRulesEnabled: !event.target.checked,
                        },
                      }))
                    }
                  />
                  <span>Disable transition rules</span>
                </label>
                <Button
                  size="sm"
                  onClick={addTransition}
                  disabled={transitionRulesDisabled}
                >
                  <Plus data-icon="inline-start" />
                  Add transition
                </Button>
              </div>
            }
          >
            {transitionRulesDisabled ? (
              <div
                className="bg-muted/20 text-muted-foreground rounded-lg border
                  px-3 py-2 text-sm"
              >
                Transition graph stays saved, but any project member can move an
                issue from any status to any status while rules are disabled.
              </div>
            ) : null}
            {draft.lifecycle.transitions.map((transition) => {
              const isOpen = expandedTransitionId === transition.id;
              const conditionSummary = transition.conditions
                .map((condition) =>
                  describeTransitionCondition(condition, draft)
                )
                .join(', ');

              return (
                <div key={transition.id} className="rounded-lg border">
                  <RowToggleButton
                    title={`${getStatusName(
                      draft,
                      transition.fromStatusId
                    )} -> ${getStatusName(draft, transition.toStatusId)}`}
                    subtitle={`${transition.conditions.length} conditions`}
                    meta={conditionSummary || 'No conditions yet'}
                    open={isOpen}
                    onClick={() =>
                      setExpandedTransitionId(
                        isOpen ? null : transition.id
                      )
                    }
                  />
                  {isOpen && (
                    <div className="border-t px-3 py-3">
                      <fieldset
                        disabled={transitionRulesDisabled}
                        className={cn(
                          'space-y-4',
                          transitionRulesDisabled && 'opacity-60'
                        )}
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <div className="space-y-2">
                            <Label>From</Label>
                            <Select
                              value={transition.fromStatusId}
                              onValueChange={(value) =>
                                updateTransition(transition.id, (current) => ({
                                  ...current,
                                  fromStatusId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sortedStatuses.map((status) => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>To</Label>
                            <Select
                              value={transition.toStatusId}
                              onValueChange={(value) =>
                                updateTransition(transition.id, (current) => ({
                                  ...current,
                                  toStatusId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sortedStatuses.map((status) => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  lifecycle: {
                                    ...current.lifecycle,
                                    transitions: current.lifecycle.transitions.filter(
                                      (item) => item.id !== transition.id
                                    ),
                                  },
                                }))
                              }
                            >
                              <Trash data-icon="inline-start" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {transition.conditions.map((condition, index) => (
                            <div
                              key={`${transition.id}-${condition.type}-${index}`}
                              className="grid gap-3 rounded-md border p-3 md:grid-cols-[180px_1fr_auto]"
                            >
                              <div className="space-y-2">
                                <Label>Condition</Label>
                                <Select
                                  value={getConditionEditorKind(condition)}
                                  onValueChange={(value) =>
                                    updateTransition(transition.id, (current) => ({
                                      ...current,
                                      conditions: current.conditions.map(
                                        (item, itemIndex) =>
                                          itemIndex === index
                                            ? value === 'role'
                                              ? createCondition('role', draft)
                                              : createConditionFromUserSource(
                                                  'assignee',
                                                  draft
                                                )
                                            : item
                                      ),
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CONDITION_EDITOR_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>
                                  {condition.type === 'role'
                                    ? 'Role'
                                    : 'User source'}
                                </Label>
                                {condition.type === 'role' ? (
                                  <Select
                                    value={condition.roleId}
                                    onValueChange={(value) =>
                                      updateTransition(transition.id, (current) => ({
                                        ...current,
                                        conditions: current.conditions.map(
                                          (item, itemIndex) =>
                                            itemIndex === index &&
                                            item.type === 'role'
                                              ? { ...item, roleId: value }
                                              : item
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {draft.roles.map((projectRole) => (
                                        <SelectItem
                                          key={projectRole.id}
                                          value={projectRole.id}
                                        >
                                          {projectRole.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Select
                                    value={getUserSourceValue(condition)}
                                    onValueChange={(value) =>
                                      updateTransition(transition.id, (current) => ({
                                        ...current,
                                        conditions: current.conditions.map(
                                          (item, itemIndex) =>
                                            itemIndex === index
                                              ? createConditionFromUserSource(
                                                  value,
                                                  draft
                                                )
                                              : item
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="author">
                                        Author
                                      </SelectItem>
                                      <SelectItem value="assignee">
                                        Assignee
                                      </SelectItem>
                                      {userReferenceFields.map((field) => (
                                        <SelectItem
                                          key={field.id}
                                          value={`field:${field.id}`}
                                        >
                                          {field.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              <div className="flex items-end justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateTransition(transition.id, (current) => ({
                                    ...current,
                                    conditions: current.conditions.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    ),
                                  }))
                                }
                              >
                                <Trash data-icon="inline-start" />
                                Delete
                              </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateTransition(transition.id, (current) => ({
                                ...current,
                                conditions: [
                                  ...current.conditions,
                                  createCondition('role', draft),
                                ],
                              }))
                            }
                          >
                            <Plus data-icon="inline-start" />
                            Add condition
                          </Button>
                        </div>
                      </fieldset>
                    </div>
                  )}
                </div>
              );
            })}
          </SettingsSection>
        </TabsContent>

        <TabsContent value="fields" className="mt-0 space-y-4">
          <SettingsSection
            title="Issue Fields"
            description="System and custom fields share one ordered list. Drag rows to control field order."
            action={
              <Button size="sm" onClick={addField}>
                <Plus data-icon="inline-start" />
                Add field
              </Button>
            }
          >
            <DndContext
              sensors={fieldSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext
                items={fieldEntries.map((fieldEntry) => fieldEntry.id)}
                strategy={verticalListSortingStrategy}
              >
                {fieldEntries.map((fieldEntry) => {
                  const isCustomField = fieldEntry.kind === 'custom';
                  const field = fieldEntry.customField;
                  const isOpen = field != null && expandedFieldId === field.id;

                  return (
                    <SortableSettingsRow key={fieldEntry.id} id={fieldEntry.id}>
                      {({ draggable, isDragging }) => (
                        <div
                          className={cn(
                            'rounded-lg border bg-background',
                            isDragging && 'shadow-sm'
                          )}
                        >
                          <RowToggleButton
                            title={fieldEntry.label}
                            subtitle={
                              isCustomField && field
                                ? formatFieldTypeLabel(field.type)
                                : undefined
                            }
                            meta={getFieldEntryMeta(fieldEntry, issues)}
                            open={isOpen}
                            onClick={
                              field
                                ? () =>
                                    setExpandedFieldId(isOpen ? null : field.id)
                                : undefined
                            }
                            draggable={draggable}
                            expandable={Boolean(field)}
                          />
                          {field && isOpen && (
                            <div className="border-t px-3 py-3">
                              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={field.name}
                                    onChange={(event) =>
                                      updateField(field.id, (current) => ({
                                        ...current,
                                        name: event.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Type</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) =>
                                      updateField(field.id, (current) =>
                                        switchFieldType(
                                          current,
                                          value as CustomFieldType,
                                          draft.roles
                                        )
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FIELD_TYPE_OPTIONS.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {formatFieldTypeLabel(type)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-end justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteField(field.id)}
                                  >
                                    <Trash data-icon="inline-start" />
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              <label className="mt-4 flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(event) =>
                                    updateField(field.id, (current) => ({
                                      ...current,
                                      required: event.target.checked,
                                    }))
                                  }
                                />
                                <span>Required field</span>
                              </label>

                              <div className="mt-4">
                                {field.type === 'text' && (
                                  <div className="space-y-2">
                                    <Label>Max length</Label>
                                    <Input
                                      type="number"
                                      value={field.config.maxLength ?? ''}
                                      onChange={(event) =>
                                        updateField(field.id, (current) =>
                                          current.type === 'text'
                                            ? {
                                                ...current,
                                                config: {
                                                  maxLength:
                                                    event.target.value === ''
                                                      ? undefined
                                                      : Number(event.target.value),
                                                },
                                              }
                                            : current
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {field.type === 'number' && (
                                  <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                      <Label>Min</Label>
                                      <Input
                                        type="number"
                                        value={field.config.min ?? ''}
                                        onChange={(event) =>
                                          updateField(field.id, (current) =>
                                            current.type === 'number'
                                              ? {
                                                  ...current,
                                                  config: {
                                                    ...current.config,
                                                    min:
                                                      event.target.value === ''
                                                        ? undefined
                                                        : Number(event.target.value),
                                                  },
                                                }
                                              : current
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Max</Label>
                                      <Input
                                        type="number"
                                        value={field.config.max ?? ''}
                                        onChange={(event) =>
                                          updateField(field.id, (current) =>
                                            current.type === 'number'
                                              ? {
                                                  ...current,
                                                  config: {
                                                    ...current.config,
                                                    max:
                                                      event.target.value === ''
                                                        ? undefined
                                                        : Number(event.target.value),
                                                  },
                                                }
                                              : current
                                          )
                                        }
                                      />
                                    </div>
                                    <label className="flex items-end gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(field.config.isInteger)}
                                        onChange={(event) =>
                                          updateField(field.id, (current) =>
                                            current.type === 'number'
                                              ? {
                                                  ...current,
                                                  config: {
                                                    ...current.config,
                                                    isInteger: event.target.checked,
                                                  },
                                                }
                                              : current
                                          )
                                        }
                                      />
                                      <span>Integer only</span>
                                    </label>
                                  </div>
                                )}

                                {field.type === 'user_reference' && (
                                  <div className="space-y-2">
                                    <Label>Allowed roles</Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      {draft.roles.map((projectRole) => (
                                        <label
                                          key={projectRole.id}
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={field.config.allowedRoleIds.includes(
                                              projectRole.id
                                            )}
                                            onChange={(event) =>
                                              updateField(field.id, (current) =>
                                                current.type === 'user_reference'
                                                  ? {
                                                      ...current,
                                                      config: {
                                                        allowedRoleIds:
                                                          event.target.checked
                                                            ? [
                                                                ...current.config
                                                                  .allowedRoleIds,
                                                                projectRole.id,
                                                              ]
                                                            : current.config.allowedRoleIds.filter(
                                                                (item) =>
                                                                  item !==
                                                                  projectRole.id
                                                              ),
                                                      },
                                                    }
                                                  : current
                                              )
                                            }
                                          />
                                          <span>{projectRole.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {field.type === 'issue_reference' && (
                                  <div className="text-muted-foreground text-sm">
                                    This field can reference only issues from the same project.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableSettingsRow>
                  );
                })}
              </SortableContext>
            </DndContext>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="templates" className="mt-0 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SettingsSection
            title="Export Template"
            description="Export the current project configuration as reusable JSON."
            action={
              <Button
                size="sm"
                onClick={handleExportTemplate}
                disabled={templateLoading === 'pending'}
              >
                <Download data-icon="inline-start" />
                Export
              </Button>
            }
          >
            {exportedTemplate ? (
              <pre
                className="bg-muted max-h-96 overflow-auto rounded-lg border p-3 text-xs"
              >
                {JSON.stringify(exportedTemplate, null, 2)}
              </pre>
            ) : (
              <SectionPlaceholder text="Exported template JSON will appear here." />
            )}
          </SettingsSection>

          <SettingsSection
            title="Apply Existing Template"
            description="Replace roles, lifecycle, and custom fields from another accessible project."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={handleApplyTemplate}
                disabled={templateLoading === 'pending'}
              >
                <Sparkles data-icon="inline-start" />
                Apply
              </Button>
            }
          >
            <div className="space-y-2">
              <Label>Source project</Label>
              <Select
                value={selectedTemplateProjectId}
                onValueChange={setSelectedTemplateProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project template" />
                </SelectTrigger>
                <SelectContent>
                  {sourceProjects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!sourceProjects.length ? (
              <SectionPlaceholder text="No other active projects are available as template sources." />
            ) : null}
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </main>
  );
};
