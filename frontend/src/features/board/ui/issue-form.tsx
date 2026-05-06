import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Editor, EditorContainer } from '@/components/ui/editor.tsx';
import { Plate, usePlateEditor } from 'platejs/react';
import { FixedToolbar } from '@/components/ui/fixed-toolbar.tsx';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button.tsx';
import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import {
  H1Element,
  H2Element,
  H3Element,
} from '@/components/ui/heading-node.tsx';
import { BlockquoteElement } from '@/components/ui/blockquote-node.tsx';
import { ToolbarButton } from '@/components/ui/toolbar.tsx';
import { MarkdownPlugin } from '@platejs/markdown';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createIssue,
  updateIssue,
  uploadAttachment,
} from '@/features/board/model/board.actions.ts';
import { useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { capitalize } from '@/lib/utils.ts';
import type {
  Issue,
  IssueCustomFieldValue,
  IssuePriority,
  IssueType,
} from '@/features/board/model';
import { Loader2, Pencil } from 'lucide-react';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import type { CustomFieldDefinition } from '@/features/project-config/model/project-config.types.ts';
import {
  formatCustomFieldValue,
  getAssignableMembersForField,
  getOrderedCustomFields,
} from '@/features/project-config/model';
import {
  UserSelectField,
  UserValueCard,
} from '@/features/board/ui/user-field.tsx';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

interface IssueFormProps {
  mode: 'add' | 'edit';
  projectId: number;
  issue?: Issue;
}

const ISSUE_TYPES: IssueType[] = ['TASK', 'BUG', 'FEATURE', 'SEARCH'];
const ISSUE_PRIORITIES: IssuePriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export const IssueForm = ({ mode, projectId, issue }: IssueFormProps) => {
  const dispatch = useAppDispatch();
  const { issues, loading } = useAppSelector((state) => state.board);
  const {
    users,
    loading: usersLoading,
    projectId: usersProjectId,
  } = useAppSelector((state) => state.users);
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );

  const customFields = getOrderedCustomFields(projectConfig);
  const [name, setName] = useState(issue?.name ?? '');
  const [type, setType] = useState<IssueType>(issue?.type ?? 'TASK');
  const [priority, setPriority] = useState<IssuePriority>(
    issue?.priority ?? 'HIGH'
  );
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(
    issue?.assigneeIds[0] ?? null
  );
  const [dueDate, setDueDate] = useState(
    issue?.dueDate ? issue.dueDate.split('T')[0] : ''
  );
  const [fieldValues, setFieldValues] = useState<
    Record<string, IssueCustomFieldValue>
  >(issue?.customFields ?? {});

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      MarkdownPlugin,
    ],
    value: issue?.description
      ? [{ type: 'p', children: [{ text: issue.description }] }]
      : undefined,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    dispatch(getProjectUsers(projectId));
  }, [dispatch, open, projectId]);

  const projectMembers = useMemo(
    () => (usersProjectId === projectId ? users : []),
    [projectId, users, usersProjectId]
  );
  const membersLoading =
    open && (usersLoading === 'pending' || usersProjectId !== projectId);

  const issueReferenceOptions = useMemo(
    () => issues.filter((item) => item.projectId === projectId && item.id !== issue?.id),
    [issues, projectId, issue?.id]
  );
  const authorMember = useMemo(
    () =>
      projectMembers.find((member) => member.id === issue?.authorId) ?? null,
    [issue?.authorId, projectMembers]
  );

  const resetState = () => {
    setName(issue?.name ?? '');
    setType(issue?.type ?? 'TASK');
    setPriority(issue?.priority ?? 'HIGH');
    setFiles([]);
    setSubmitError(null);
    setAssigneeId(issue?.assigneeIds[0] ?? null);
    setDueDate(issue?.dueDate ? issue.dueDate.split('T')[0] : '');
    setFieldValues(issue?.customFields ?? {});
  };

  const setFieldValue = (fieldId: string, value: IssueCustomFieldValue) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getFieldValue = (fieldId: string) => fieldValues[fieldId] ?? null;

  const validateCustomField = (field: CustomFieldDefinition) => {
    const value = getFieldValue(field.id);

    if (field.required && (value === null || value === '' || value === undefined)) {
      return `${field.name} is required`;
    }

    if (field.type === 'text' && typeof value === 'string') {
      if (field.config.maxLength && value.length > field.config.maxLength) {
        return `${field.name} is too long`;
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (field.config.isInteger && !Number.isInteger(value)) {
        return `${field.name} must be an integer`;
      }
      if (field.config.min != null && value < field.config.min) {
        return `${field.name} is below minimum`;
      }
      if (field.config.max != null && value > field.config.max) {
        return `${field.name} is above maximum`;
      }
    }

    if (field.type === 'date' && value != null && typeof value !== 'string') {
      return `${field.name} must be a date`;
    }

    if (field.type === 'user_reference' && value != null) {
      const availableMembers = getAssignableMembersForField(field, projectMembers);
      if (!availableMembers.some((member) => member.id === value)) {
        return `${field.name} references an unavailable member`;
      }
    }

    if (field.type === 'issue_reference' && value != null) {
      if (!issueReferenceOptions.some((item) => item.id === value)) {
        return `${field.name} references an unavailable issue`;
      }
    }

    return null;
  };

  const renderFieldControl = (field: CustomFieldDefinition) => {
    const value = getFieldValue(field.id);

    if (field.type === 'text') {
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setFieldValue(field.id, event.target.value)}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) =>
            setFieldValue(
              field.id,
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
        />
      );
    }

    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) =>
            setFieldValue(field.id, event.target.value || null)
          }
        />
      );
    }

    if (field.type === 'user_reference') {
      const availableMembers = getAssignableMembersForField(field, projectMembers);

      return (
        <UserSelectField
          members={availableMembers}
          value={typeof value === 'number' ? value : null}
          onChange={(nextValue) => setFieldValue(field.id, nextValue)}
          placeholder={field.name}
          emptyLabel="Not set"
          disabled={membersLoading}
        />
      );
    }

    return (
      <Select
        value={value == null ? 'none' : String(value)}
        onValueChange={(nextValue) =>
          setFieldValue(field.id, nextValue === 'none' ? null : Number(nextValue))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={field.name} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not set</SelectItem>
          {issueReferenceOptions.map((relatedIssue) => (
            <SelectItem key={relatedIssue.id} value={String(relatedIssue.id)}>
              {relatedIssue.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const onSubmit = async () => {
    try {
      setIsUploading(true);
      setSubmitError(null);

      if (!name.trim()) {
        setSubmitError('Name is required');
        return;
      }

      for (const field of customFields) {
        const fieldError = validateCustomField(field);
        if (fieldError) {
          setSubmitError(fieldError);
          return;
        }
      }

      let attachmentFileNames: string[] = [];

      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          dispatch(uploadAttachment(file)).unwrap()
        );
        attachmentFileNames = await Promise.all(uploadPromises);
      }

      const description = editor.api.markdown.serialize();
      const assigneeIds = assigneeId == null ? [] : [assigneeId];

      if (mode === 'add') {
        await dispatch(
          createIssue({
            projectId,
            name,
            type,
            priority,
            description,
            assigneeIds,
            attachmentFileNames,
            dueDate: dueDate || undefined,
            customFields: fieldValues,
          })
        ).unwrap();
      } else if (issue) {
        const existingAttachments = issue.attachments;
        const newAttachments = attachmentFileNames.map((url) => ({
          originalFileName: url.split('/').pop() || url,
          url,
        }));

        await dispatch(
          updateIssue({
            id: issue.id,
            data: {
              name,
              type,
              priority,
              description,
              assigneeIds,
              attachments: [...existingAttachments, ...newAttachments],
              customFields: fieldValues,
              dueDate: dueDate || undefined,
            },
          })
        ).unwrap();
      }

      setOpen(false);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Failed to save issue'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button variant="default">Add Issue</Button>
        ) : (
          <Button className="ml-auto" size="sm" variant="ghost">
            <Pencil />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[95vh] min-w-[60vw] overflow-x-hidden overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Issue' : 'Edit Issue'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>Issue Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-3">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as IssueType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {capitalize(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as IssuePriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_PRIORITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {capitalize(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex w-full max-w-[54vw] flex-col gap-3">
            <Label>Issue Description</Label>
            <div className="rounded-lg border">
              <Plate editor={editor}>
                <FixedToolbar className="justify-start rounded-t-lg">
                  <ToolbarButton onClick={() => editor.tf.h1.toggle()}>
                    H1
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.tf.h2.toggle()}>
                    H2
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.tf.h3.toggle()}>
                    H3
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>
                    Quote
                  </ToolbarButton>
                  <MarkToolbarButton nodeType="bold" tooltip="Bold">
                    B
                  </MarkToolbarButton>
                  <MarkToolbarButton nodeType="italic" tooltip="Italic">
                    I
                  </MarkToolbarButton>
                </FixedToolbar>
                <EditorContainer className="h-90">
                  <Editor />
                </EditorContainer>
              </Plate>
            </div>
          </div>

          {mode === 'edit' && (
            <div className="flex flex-col gap-3">
              <Label>Author</Label>
              <UserValueCard
                member={authorMember}
                loading={membersLoading}
                emptyLabel="Unknown author"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Label>Assignee</Label>
            {membersLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading members...</span>
              </div>
            ) : (
              <UserSelectField
                members={projectMembers}
                value={assigneeId}
                onChange={setAssigneeId}
                placeholder="Assignee"
                emptyLabel="Not set"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              className="text-sm"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="picture">Attachments</Label>
            <Input
              id="picture"
              type="file"
              multiple
              onChange={(event) => {
                const fileList = event.target.files;
                if (fileList) {
                  setFiles(Array.from(fileList));
                }
              }}
              disabled={isUploading || loading === 'pending'}
            />
            {files.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">New files:</span>
                {files.map((file) => (
                  <span key={file.name} className="text-muted-foreground text-xs">
                    {file.name}
                  </span>
                ))}
              </div>
            )}
            {mode === 'edit' && issue && issue.attachments.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Current attachments:</span>
                {issue.attachments.map((attachment) => (
                  <span key={attachment.url} className="text-muted-foreground text-xs">
                    {attachment.originalFileName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {customFields.length > 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium">Custom fields</h3>
                <p className="text-muted-foreground text-sm">
                  These fields are configured for the current project.
                </p>
              </div>
              {customFields.map((field) => (
                <div key={field.id} className="flex flex-col gap-2">
                  <Label>{field.name}</Label>
                  {renderFieldControl(field)}
                  {getFieldValue(field.id) != null && (
                    <span className="text-muted-foreground text-xs">
                      Value:{' '}
                      {formatCustomFieldValue(field, getFieldValue(field.id), {
                        issues,
                        members: projectMembers,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isUploading || loading === 'pending' || !name.trim()}
          >
            {isUploading
              ? 'Uploading...'
              : loading === 'pending'
                ? 'Saving...'
                : mode === 'add'
                  ? 'Create'
                  : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
