import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import {
  Download,
  Plus,
  Save,
  Sparkles,
  Trash,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
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
import { getMyRole } from '@/features/board/api/api.board.ts';
import { getBoard } from '@/features/board/model/board.actions.ts';
import type { Issue } from '@/features/board/model';
import {
  applyProjectTemplate,
  exportProjectTemplate,
  fetchProjectConfig,
  hasPermission,
  PERMISSION_GROUPS,
  saveProjectConfig,
  SYSTEM_ISSUE_FIELDS,
  type CustomFieldDefinition,
  type CustomFieldType,
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

const CONDITION_OPTIONS: Array<TransitionCondition['type']> = [
  'role',
  'author',
  'assignee',
  'field_user_reference',
];

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
    maxLength:
      field.type === 'text'
        ? field.config.maxLength
        : 80,
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

export const ProjectSettingsPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);
  const dispatch = useAppDispatch();
  const { config, loading, saving, error, saveError, templateLoading, templateError, exportedTemplate } =
    useAppSelector((state) => state.projectConfig);
  const { issues } = useAppSelector((state) => state.board);
  const { users } = useAppSelector((state) => state.users);
  const { projects } = useAppSelector((state) => state.profile);

  const [role, setRole] = useState<CustomRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [draft, setDraft] = useState<ProjectConfig | null>(null);
  const [selectedTemplateProjectId, setSelectedTemplateProjectId] = useState('');

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
    () => draft?.customFields.filter((field) => field.type === 'user_reference') ?? [],
    [draft]
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

  const updateRole = (roleId: string, updater: (roleItem: CustomRole) => CustomRole) => {
    updateDraft((current) => ({
      ...current,
      roles: current.roles.map((item) =>
        item.id === roleId ? updater(item) : item
      ),
    }));
  };

  const updateStatus = (
    statusId: string,
    updater: (status: ProjectConfig['lifecycle']['statuses'][number]) => ProjectConfig['lifecycle']['statuses'][number]
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
          statuses: nextStatuses,
          transitions: current.lifecycle.transitions.filter(
            (transition) =>
              transition.fromStatusId !== statusId &&
              transition.toStatusId !== statusId
          ),
        },
      };
    });
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
    updateDraft((current) => ({
      ...current,
      customFields: [...current.customFields, createFieldDraft(current.projectId)],
    }));
  };

  const deleteField = (fieldId: string) => {
    if (hasValuesForField(issues, fieldId)) {
      toast.error('This field already has values in issues');
      return;
    }

    updateDraft((current) => ({
      ...current,
      customFields: current.customFields.filter((field) => field.id !== fieldId),
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

  return (
    <main className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure project roles, lifecycle, issue fields, and reusable templates.
          </p>
        </div>
        <Button onClick={save} disabled={saving === 'pending'}>
          <Save data-icon="inline-start" />
          {saving === 'pending' ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {(saveError || templateError) && (
        <div className="text-destructive text-sm">{saveError || templateError}</div>
      )}

      <Tabs defaultValue="roles" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Roles</CardTitle>
              <Button size="sm" onClick={addRole}>
                <Plus data-icon="inline-start" />
                Add role
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.roles.map((projectRole) => (
                <div key={projectRole.id} className="rounded-md border p-4">
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
                  <div className="grid gap-4 md:grid-cols-2">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.label} className="rounded-md border p-3">
                        <h3 className="mb-3 text-sm font-medium">{group.label}</h3>
                        <div className="space-y-2">
                          {group.permissions.map((permission) => {
                            const checked = projectRole.permissions.includes(permission);

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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Statuses</CardTitle>
              <Button size="sm" onClick={addStatus}>
                <Plus data-icon="inline-start" />
                Add status
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedStatuses.map((status) => (
                <div key={status.id} className="rounded-md border p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_140px_100px_auto]">
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
                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={status.displayOrder}
                        onChange={(event) =>
                          updateStatus(status.id, (current) => ({
                            ...current,
                            displayOrder: Number(event.target.value) || 1,
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
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
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
                                isInitial: item.id === status.id ? true : undefined,
                              })),
                            },
                          }))
                        }
                      />
                      <span>Initial status</span>
                    </label>
                    <span className="text-muted-foreground text-xs">
                      {getIssueCountForStatus(issues, status.id)} issues
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transitions</CardTitle>
              <Button size="sm" onClick={addTransition}>
                <Plus data-icon="inline-start" />
                Add transition
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.lifecycle.transitions.map((transition) => (
                <div key={transition.id} className="rounded-md border p-3">
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
                  <div className="mt-4 space-y-3">
                    {transition.conditions.map((condition, index) => (
                      <div
                        key={`${transition.id}-${condition.type}-${index}`}
                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[180px_1fr_auto]"
                      >
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select
                            value={condition.type}
                            onValueChange={(value) =>
                              updateTransition(transition.id, (current) => ({
                                ...current,
                                conditions: current.conditions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? createCondition(
                                        value as TransitionCondition['type'],
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
                              {CONDITION_OPTIONS.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {formatConditionLabel(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Rule</Label>
                          {condition.type === 'role' ? (
                            <Select
                              value={condition.roleId}
                              onValueChange={(value) =>
                                updateTransition(transition.id, (current) => ({
                                  ...current,
                                  conditions: current.conditions.map((item, itemIndex) =>
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
                                  <SelectItem key={projectRole.id} value={projectRole.id}>
                                    {projectRole.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : condition.type === 'field_user_reference' ? (
                            <Select
                              value={condition.customFieldId}
                              onValueChange={(value) =>
                                updateTransition(transition.id, (current) => ({
                                  ...current,
                                  conditions: current.conditions.map((item, itemIndex) =>
                                    itemIndex === index &&
                                    item.type === 'field_user_reference'
                                      ? { ...item, customFieldId: value }
                                      : item
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose field" />
                              </SelectTrigger>
                              <SelectContent>
                                {userReferenceFields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
                              {formatConditionLabel(condition.type)} can trigger this transition.
                            </div>
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Fields</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {SYSTEM_ISSUE_FIELDS.map((field) => (
                <div key={field.id} className="rounded-md border px-3 py-2">
                  <div className="font-medium">{field.label}</div>
                  <div className="text-muted-foreground text-xs">{field.id}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Custom Fields</CardTitle>
              <Button size="sm" onClick={addField}>
                <Plus data-icon="inline-start" />
                Add field
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.customFields.map((field) => (
                <div key={field.id} className="rounded-md border p-4">
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

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm">
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
                      <span>Required</span>
                    </label>
                    <span className="text-muted-foreground text-xs">
                      {hasValuesForField(issues, field.id) ? 'Has issue values' : 'No issue values yet'}
                    </span>
                  </div>

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
                                checked={field.config.allowedRoleIds.includes(projectRole.id)}
                                onChange={(event) =>
                                  updateField(field.id, (current) =>
                                    current.type === 'user_reference'
                                      ? {
                                          ...current,
                                          config: {
                                            allowedRoleIds: event.target.checked
                                              ? [
                                                  ...current.config.allowedRoleIds,
                                                  projectRole.id,
                                                ]
                                              : current.config.allowedRoleIds.filter(
                                                  (item) => item !== projectRole.id
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Export Template</CardTitle>
              <Button
                size="sm"
                onClick={handleExportTemplate}
                disabled={templateLoading === 'pending'}
              >
                <Download data-icon="inline-start" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Export the current project configuration as template JSON.
              </p>
              <pre
                className="bg-muted max-h-96 overflow-auto rounded-md p-3 text-xs"
              >
                {JSON.stringify(exportedTemplate, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Apply Existing Template</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleApplyTemplate}
                disabled={templateLoading === 'pending'}
              >
                <Sparkles data-icon="inline-start" />
                Apply
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Applying a template replaces roles, lifecycle, and custom fields for this project.
              </p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};
