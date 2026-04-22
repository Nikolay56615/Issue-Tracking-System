import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { Plus, Save, Trash } from 'lucide-react';
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
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProjectConfig,
  PROTECTED_SYSTEM_FIELD_IDS,
  saveProjectConfig,
  sortIssueFields,
  type IssueFieldConfig,
  type IssueFieldSurface,
  type IssueFieldType,
  type LifecycleTransitionConfig,
  type ProjectConfig,
} from '@/features/project-config/model';
import type { UserRole } from '@/features/profile';

const FIELD_TYPES: IssueFieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'checkbox',
  'select',
  'multiSelect',
];

const FIELD_SURFACES: IssueFieldSurface[] = [
  'create',
  'edit',
  'card',
  'dialog',
  'filter',
];

const ROLES: UserRole[] = ['WORKER', 'REVIEWER', 'ADMIN', 'OWNER'];

const isConfigEditorRole = (role: UserRole | null) =>
  role === 'ADMIN' || role === 'OWNER';

const formatTypeLabel = (type: IssueFieldType) =>
  type.replace(/([A-Z])/g, ' $1').toLowerCase();

const parseOptions = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ label: item, value: item }));

const optionsToText = (field: IssueFieldConfig) =>
  field.options?.map((option) => option.value).join(', ') ?? '';

const replaceField = (
  config: ProjectConfig,
  fieldId: string,
  updater: (field: IssueFieldConfig) => IssueFieldConfig
) => ({
  ...config,
  issueFields: config.issueFields.map((field) =>
    field.id === fieldId ? updater(field) : field
  ),
});

const replaceTransition = (
  config: ProjectConfig,
  index: number,
  updater: (transition: LifecycleTransitionConfig) => LifecycleTransitionConfig
) => ({
  ...config,
  lifecycle: {
    ...config.lifecycle,
    transitions: config.lifecycle.transitions.map(
      (transition, transitionIndex) =>
        transitionIndex === index ? updater(transition) : transition
    ),
  },
});

const CheckboxInput = ({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{label}</span>
  </label>
);

export const ProjectSettingsPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);
  const dispatch = useAppDispatch();
  const { config, loading, saving, error, saveError } = useAppSelector(
    (state) => state.projectConfig
  );
  const { issues } = useAppSelector((state) => state.board);

  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [draft, setDraft] = useState<ProjectConfig | null>(null);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) return;

    dispatch(fetchProjectConfig(projectId));
    dispatch(getBoard({ projectId }));
  }, [dispatch, projectId]);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      setRoleLoading(true);
      try {
        const response = await getMyRole(projectId);
        if (!cancelled) setRole(response);
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const statuses = useMemo(
    () =>
      [...(draft?.lifecycle.statuses ?? [])].sort((a, b) => a.order - b.order),
    [draft]
  );

  if (loading === 'pending' || roleLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  if (!isConfigEditorRole(role)) {
    return (
      <div className="p-8">
        Project settings are available only for ADMIN and OWNER roles.
      </div>
    );
  }

  if (!draft) {
    return <div className="p-8">Project config is empty.</div>;
  }

  const updateDraft = (nextDraft: ProjectConfig) => {
    setDraft({ ...nextDraft, updatedAt: new Date().toISOString() });
  };

  const addCustomField = () => {
    const nextIndex =
      draft.issueFields.filter((field) => field.source === 'custom').length + 1;
    const id = `custom_${Date.now()}`;

    updateDraft({
      ...draft,
      issueFields: [
        ...draft.issueFields,
        {
          id,
          source: 'custom',
          label: `Custom field ${nextIndex}`,
          type: 'text',
          required: false,
          editable: true,
          order: draft.issueFields.length + 1,
          visibleOn: ['create', 'edit', 'dialog'],
        },
      ],
    });
  };

  const addStatus = () => {
    const nextOrder = statuses.length + 1;
    const id = `CUSTOM_${Date.now()}`;
    updateDraft({
      ...draft,
      lifecycle: {
        ...draft.lifecycle,
        statuses: [
          ...draft.lifecycle.statuses,
          { id, label: `Custom status ${nextOrder}`, order: nextOrder },
        ],
      },
    });
  };

  const deleteStatus = (statusId: string) => {
    if (issues.some((issue) => issue.status === statusId)) {
      toast.error('Status has issues', {
        description: 'Move issues to another status before deleting it.',
      });
      return;
    }

    updateDraft({
      ...draft,
      lifecycle: {
        statuses: draft.lifecycle.statuses.filter(
          (status) => status.id !== statusId
        ),
        transitions: draft.lifecycle.transitions.filter(
          (transition) =>
            transition.from !== statusId && transition.to !== statusId
        ),
      },
    });
  };

  const addTransition = () => {
    if (statuses.length < 2) return;

    updateDraft({
      ...draft,
      lifecycle: {
        ...draft.lifecycle,
        transitions: [
          ...draft.lifecycle.transitions,
          {
            from: statuses[0].id,
            to: statuses[1].id,
            allowedRoles: ['ADMIN', 'OWNER'],
            authorAllowed: false,
            assigneeAllowed: false,
          },
        ],
      },
    });
  };

  const save = async () => {
    try {
      await dispatch(saveProjectConfig({ projectId, config: draft })).unwrap();
      toast.success('Project config saved');
    } catch (error: unknown) {
      toast.error(String(error));
    }
  };

  return (
    <main className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Project Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure issue fields and lifecycle rules for this project.
          </p>
        </div>
        <Button onClick={save} disabled={saving === 'pending'}>
          <Save data-icon="inline-start" />
          {saving === 'pending' ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {saveError && <div className="text-destructive text-sm">{saveError}</div>}

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issue Fields</CardTitle>
              <Button size="sm" onClick={addCustomField}>
                <Plus data-icon="inline-start" />
                Add field
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {sortIssueFields(draft.issueFields).map((field) => {
                const protectedField = PROTECTED_SYSTEM_FIELD_IDS.includes(
                  field.id as never
                );

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1.2fr_0.8fr_0.5fr_1.5fr_auto]
                      gap-3 rounded-md border p-3"
                  >
                    <div className="flex flex-col gap-2">
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        disabled={protectedField}
                        onChange={(event) =>
                          updateDraft(
                            replaceField(draft, field.id, (current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          )
                        }
                      />
                      <span className="text-muted-foreground text-xs">
                        {field.source} / {field.id}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Type</Label>
                      <Select
                        value={field.type}
                        disabled={field.source === 'system'}
                        onValueChange={(value) =>
                          updateDraft(
                            replaceField(draft, field.id, (current) => ({
                              ...current,
                              type: value as IssueFieldType,
                              options:
                                value === 'select' || value === 'multiSelect'
                                  ? (current.options ?? [])
                                  : undefined,
                            }))
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(field.type === 'select' ||
                        field.type === 'multiSelect') && (
                        <Input
                          placeholder="Option A, Option B"
                          value={optionsToText(field)}
                          onChange={(event) =>
                            updateDraft(
                              replaceField(draft, field.id, (current) => ({
                                ...current,
                                options: parseOptions(event.target.value),
                              }))
                            )
                          }
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={field.order}
                        onChange={(event) =>
                          updateDraft(
                            replaceField(draft, field.id, (current) => ({
                              ...current,
                              order: Number(event.target.value),
                            }))
                          )
                        }
                      />
                      <CheckboxInput
                        label="Required"
                        checked={field.required}
                        disabled={protectedField}
                        onChange={(checked) =>
                          updateDraft(
                            replaceField(draft, field.id, (current) => ({
                              ...current,
                              required: checked,
                            }))
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Visible on</Label>
                      <div className="flex flex-wrap gap-3">
                        {FIELD_SURFACES.map((surface) => (
                          <CheckboxInput
                            key={surface}
                            label={surface}
                            checked={field.visibleOn.includes(surface)}
                            disabled={
                              protectedField &&
                              ['create', 'edit'].includes(surface)
                            }
                            onChange={(checked) =>
                              updateDraft(
                                replaceField(draft, field.id, (current) => ({
                                  ...current,
                                  visibleOn: checked
                                    ? [...current.visibleOn, surface]
                                    : current.visibleOn.filter(
                                        (item) => item !== surface
                                      ),
                                }))
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={field.source === 'system'}
                        onClick={() =>
                          updateDraft({
                            ...draft,
                            issueFields: draft.issueFields.filter(
                              (item) => item.id !== field.id
                            ),
                          })
                        }
                      >
                        <Trash data-icon="inline-start" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle">
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Statuses</CardTitle>
                <Button size="sm" onClick={addStatus}>
                  <Plus data-icon="inline-start" />
                  Add status
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-end gap-3 rounded-md border p-3"
                  >
                    <div className="flex flex-1 flex-col gap-2">
                      <Label>Label</Label>
                      <Input
                        value={status.label}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            lifecycle: {
                              ...draft.lifecycle,
                              statuses: draft.lifecycle.statuses.map((item) =>
                                item.id === status.id
                                  ? { ...item, label: event.target.value }
                                  : item
                              ),
                            },
                          })
                        }
                      />
                      <span className="text-muted-foreground text-xs">
                        {status.id}
                      </span>
                    </div>
                    <div className="flex w-24 flex-col gap-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={status.order}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            lifecycle: {
                              ...draft.lifecycle,
                              statuses: draft.lifecycle.statuses.map((item) =>
                                item.id === status.id
                                  ? {
                                      ...item,
                                      order: Number(event.target.value),
                                    }
                                  : item
                              ),
                            },
                          })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={status.isInitial}
                      onClick={() => deleteStatus(status.id)}
                    >
                      <Trash data-icon="inline-start" />
                      Delete
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transitions</CardTitle>
                <Button
                  size="sm"
                  onClick={addTransition}
                  disabled={statuses.length < 2}
                >
                  <Plus data-icon="inline-start" />
                  Add transition
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {draft.lifecycle.transitions.map((transition, index) => (
                  <div
                    key={`${transition.from}-${transition.to}-${index}`}
                    className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-3
                      rounded-md border p-3"
                  >
                    <div className="flex flex-col gap-2">
                      <Label>From</Label>
                      <Select
                        value={transition.from}
                        onValueChange={(value) =>
                          updateDraft(
                            replaceTransition(draft, index, (current) => ({
                              ...current,
                              from: value,
                            }))
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>To</Label>
                      <Select
                        value={transition.to}
                        onValueChange={(value) =>
                          updateDraft(
                            replaceTransition(draft, index, (current) => ({
                              ...current,
                              to: value,
                            }))
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Access</Label>
                      <div className="flex flex-wrap gap-3">
                        {ROLES.map((role) => (
                          <CheckboxInput
                            key={role}
                            label={role}
                            checked={transition.allowedRoles.includes(role)}
                            onChange={(checked) =>
                              updateDraft(
                                replaceTransition(draft, index, (current) => ({
                                  ...current,
                                  allowedRoles: checked
                                    ? [...current.allowedRoles, role]
                                    : current.allowedRoles.filter(
                                        (item) => item !== role
                                      ),
                                }))
                              )
                            }
                          />
                        ))}
                        <CheckboxInput
                          label="author"
                          checked={transition.authorAllowed}
                          onChange={(checked) =>
                            updateDraft(
                              replaceTransition(draft, index, (current) => ({
                                ...current,
                                authorAllowed: checked,
                              }))
                            )
                          }
                        />
                        <CheckboxInput
                          label="assignee"
                          checked={transition.assigneeAllowed}
                          onChange={(checked) =>
                            updateDraft(
                              replaceTransition(draft, index, (current) => ({
                                ...current,
                                assigneeAllowed: checked,
                              }))
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-start justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateDraft({
                            ...draft,
                            lifecycle: {
                              ...draft.lifecycle,
                              transitions: draft.lifecycle.transitions.filter(
                                (_, transitionIndex) =>
                                  transitionIndex !== index
                              ),
                            },
                          })
                        }
                      >
                        <Trash data-icon="inline-start" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};
