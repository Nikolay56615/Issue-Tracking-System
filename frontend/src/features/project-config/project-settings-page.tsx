import { useEffect, useMemo, useState } from 'react';
import { useBlocker, useParams } from 'react-router';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { getBoard } from '@/features/board/model/board.actions.ts';
import {
  applyProjectTemplate,
  cloneConfig,
  createFieldDraft,
  createRoleDraft,
  createStatusDraft,
  createTransitionDraft,
  exportProjectTemplate,
  fetchCurrentProjectRole,
  fetchProjectConfig,
  getIssueCountForStatus,
  getNormalizedFieldOrder,
  getOrderedIssueFields,
  getOrderedStatuses,
  hasPermission,
  hasValuesForField,
  saveProjectConfig,
  switchFieldType,
  type CustomFieldDefinition,
  type ProjectConfig,
  type Transition,
} from '@/features/project-config/model';
import {
  FieldsTab,
  LifecycleTab,
  RolesTab,
  TemplatesTab,
} from '@/features/project-config/ui';
import type { CustomRole } from '@/features/profile';
import { fetchProjects } from '@/features/profile/model/profile.actions.ts';
import { useAppDispatch, useAppSelector } from '@/store';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

const omitUpdatedAt = ({ updatedAt: _updatedAt, ...config }: ProjectConfig) =>
  config;

const areConfigsEqual = (
  left: ProjectConfig | null,
  right: ProjectConfig | null
) => {
  if (!left || !right) {
    return left === right;
  }

  return (
    JSON.stringify(omitUpdatedAt(left)) === JSON.stringify(omitUpdatedAt(right))
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
    currentRole,
    currentRoleProjectId,
    currentRoleLoading,
  } = useAppSelector((state) => state.projectConfig);
  const { issues } = useAppSelector((state) => state.board);
  const { users } = useAppSelector((state) => state.users);
  const { projects } = useAppSelector((state) => state.profile);

  const [draft, setDraft] = useState<ProjectConfig | null>(null);
  const [selectedTemplateProjectId, setSelectedTemplateProjectId] =
    useState('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
  const [expandedTransitionId, setExpandedTransitionId] = useState<
    string | null
  >(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) return;

    dispatch(fetchProjectConfig(projectId));
    dispatch(fetchCurrentProjectRole(projectId));
    dispatch(getBoard({ projectId }));
    dispatch(getProjectUsers(projectId));
    dispatch(fetchProjects());
  }, [dispatch, projectId]);

  useEffect(() => {
    setDraft(config ? cloneConfig(config) : null);
  }, [config]);

  const role = currentRoleProjectId === projectId ? currentRole : null;
  const roleLoading =
    currentRoleProjectId !== projectId || currentRoleLoading === 'pending';
  const canManageSettings = hasPermission(role, 'settings.manage');

  const sourceProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.id !== projectId && !project.archived
      ),
    [projectId, projects]
  );

  const sortedStatuses = useMemo(() => getOrderedStatuses(draft), [draft]);
  const fieldEntries = useMemo(() => getOrderedIssueFields(draft), [draft]);
  const hasUnsavedChanges = useMemo(
    () => Boolean(draft && config && !areConfigsEqual(draft, config)),
    [config, draft]
  );
  const navigationBlocker = useBlocker(hasUnsavedChanges);

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

  const setInitialStatus = (statusId: string) => {
    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        statuses: current.lifecycle.statuses.map((item) => ({
          ...item,
          isInitial: item.id === statusId ? true : undefined,
        })),
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

  const removeTransition = (transitionId: string) => {
    updateDraft((current) => ({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        transitions: current.lifecycle.transitions.filter(
          (item) => item.id !== transitionId
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
          createStatusDraft(current.projectId, current.lifecycle.statuses.length + 1),
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
        isInitial: hasInitial
          ? status.isInitial
          : index === 0
            ? true
            : undefined,
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
      fieldOrder: getNormalizedFieldOrder(current).filter(
        (item) => item !== fieldId
      ),
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
      const oldIndex = orderedFields.findIndex(
        (fieldId) => fieldId === active.id
      );
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
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Project Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure roles, lifecycle, fields, and reusable project templates
              in one place.
            </p>
          </div>
          <Button
            className="min-w-30"
            onClick={save}
            disabled={saving === 'pending'}
          >
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
            <RolesTab
              draft={draft}
              users={users}
              expandedRoleId={expandedRoleId}
              setExpandedRoleId={setExpandedRoleId}
              addRole={addRole}
              deleteRole={deleteRole}
              updateRole={updateRole}
            />
          </TabsContent>

          <TabsContent
            value="lifecycle"
            className="mt-0 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"
          >
            <LifecycleTab
              draft={draft}
              sortedStatuses={sortedStatuses}
              expandedStatusId={expandedStatusId}
              setExpandedStatusId={setExpandedStatusId}
              expandedTransitionId={expandedTransitionId}
              setExpandedTransitionId={setExpandedTransitionId}
              transitionRulesDisabled={transitionRulesDisabled}
              getIssueCountForStatus={(statusId: string) =>
                getIssueCountForStatus(issues, statusId)
              }
              addStatus={addStatus}
              deleteStatus={deleteStatus}
              updateStatus={updateStatus}
              addTransition={addTransition}
              updateTransition={updateTransition}
              removeTransition={removeTransition}
              handleStatusDragEnd={handleStatusDragEnd}
              setTransitionRulesDisabled={(disabled) =>
                updateDraft((current) => ({
                  ...current,
                  lifecycle: {
                    ...current.lifecycle,
                    transitionRulesEnabled: !disabled,
                  },
                }))
              }
              setInitialStatus={setInitialStatus}
            />
          </TabsContent>

          <TabsContent value="fields" className="mt-0 space-y-4">
            <FieldsTab
              draft={draft}
              fieldEntries={fieldEntries}
              expandedFieldId={expandedFieldId}
              setExpandedFieldId={setExpandedFieldId}
              addField={addField}
              deleteField={deleteField}
              updateField={updateField}
              switchFieldType={switchFieldType}
              handleFieldDragEnd={handleFieldDragEnd}
              issues={issues}
            />
          </TabsContent>

          <TabsContent
            value="templates"
            className="mt-0 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"
          >
            <TemplatesTab
              exportedTemplate={exportedTemplate}
              templateLoading={templateLoading}
              selectedTemplateProjectId={selectedTemplateProjectId}
              setSelectedTemplateProjectId={setSelectedTemplateProjectId}
              sourceProjects={sourceProjects}
              handleExportTemplate={handleExportTemplate}
              handleApplyTemplate={handleApplyTemplate}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={navigationBlocker.state === 'blocked'}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved project settings. If you leave this page, your
              changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigationBlocker.proceed?.()}
            >
              Leave without saving
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigationBlocker.reset?.()}
            >
              Stay on page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
