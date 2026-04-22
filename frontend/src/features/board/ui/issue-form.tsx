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
import { useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { capitalize, cn } from '@/lib/utils.ts';
import type {
  Issue,
  IssueCustomFieldValue,
  IssuePriority,
  IssueType,
} from '@/features/board/model';
import type { UserProfile } from '@/features/profile';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.tsx';
import { Loader2, Pencil, User } from 'lucide-react';
import { ProfileRequests } from '@/features/profile';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import {
  getEditableFields,
  type IssueFieldConfig,
} from '@/features/project-config/model';

interface IssueFormProps {
  mode: 'add' | 'edit';
  projectId: number;
  issue?: Issue;
}

export const IssueForm = ({ mode, projectId, issue }: IssueFormProps) => {
  const dispatch = useAppDispatch();
  const { config: projectConfig } = useAppSelector(
    (state) => state.projectConfig
  );
  const editableFields = getEditableFields(
    projectConfig,
    mode === 'add' ? 'create' : 'edit'
  );
  const [name, setName] = useState(issue?.name || '');
  const [type, setType] = useState<IssueType>(issue?.type || 'TASK');
  const [priority, setPriority] = useState<IssuePriority>(
    issue?.priority || 'HIGH'
  );
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Предзаполняем assignee (берём первого, если есть)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>(
    issue?.dueDate ? issue.dueDate.split('T')[0] : ''
  );
  const [customFields, setCustomFields] = useState<
    Record<string, IssueCustomFieldValue>
  >(issue?.customFields ?? {});

  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUserOptions([]);
        return;
      }

      setUsersLoading(true);
      setError(null);

      try {
        const response = await ProfileRequests.searchUsers(searchQuery);
        setUserOptions(response);
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
        setUserOptions([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(fetchUsers, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const showEmpty =
    open &&
    !usersLoading &&
    searchQuery.trim().length > 0 &&
    userOptions.length === 0;

  const isCreatingIssue = useAppSelector((state) => state.board.loading);

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

  const title = mode === 'add' ? 'Add Issue' : 'Edit Issue';

  const isFieldVisible = (fieldId: string) =>
    editableFields.some((field) => field.id === fieldId);

  const setCustomFieldValue = (
    fieldId: string,
    value: IssueCustomFieldValue
  ) => {
    setCustomFields((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getCustomFieldValue = (fieldId: string) =>
    customFields[fieldId] ?? null;

  const isEmptyValue = (value: IssueCustomFieldValue | string | number[]) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
  };

  const validateRequiredFields = () => {
    const missingField = editableFields.find((field) => {
      if (!field.required) return false;

      if (field.source === 'custom') {
        return isEmptyValue(getCustomFieldValue(field.id));
      }

      if (field.id === 'name') return isEmptyValue(name);
      if (field.id === 'type') return isEmptyValue(type);
      if (field.id === 'priority') return isEmptyValue(priority);
      if (field.id === 'description') {
        return isEmptyValue(editor.api.markdown.serialize());
      }
      if (field.id === 'assigneeIds')
        return isEmptyValue(selectedUser ? [selectedUser.id] : []);
      if (field.id === 'dueDate') return isEmptyValue(dueDate);
      if (field.id === 'attachments')
        return files.length === 0 && !issue?.attachments.length;

      return false;
    });

    if (missingField) {
      setUploadError(`${missingField.label} is required`);
      return false;
    }

    return true;
  };

  const renderCustomField = (field: IssueFieldConfig) => {
    const value = getCustomFieldValue(field.id);

    if (field.type === 'textarea') {
      return (
        <textarea
          className="border-input bg-background min-h-24 rounded-md border px-3
            py-2 text-sm"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) =>
            setCustomFieldValue(field.id, event.target.value)
          }
        />
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            setCustomFieldValue(
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
            setCustomFieldValue(field.id, event.target.value)
          }
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              setCustomFieldValue(field.id, event.target.checked)
            }
          />
          <span>Enabled</span>
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(nextValue) =>
            setCustomFieldValue(field.id, nextValue)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'multiSelect') {
      const selectedValues = Array.isArray(value) ? value : [];

      return (
        <div className="flex flex-wrap gap-3">
          {(field.options ?? []).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={(event) => {
                  setCustomFieldValue(
                    field.id,
                    event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((item) => item !== option.value)
                  );
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <Input
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => setCustomFieldValue(field.id, event.target.value)}
      />
    );
  };

  const onSubmit = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      if (!validateRequiredFields()) {
        return;
      }

      let attachmentFileNames: string[] = [];

      // Загружаем все файлы параллельно
      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          dispatch(uploadAttachment(file)).unwrap()
        );
        attachmentFileNames = await Promise.all(uploadPromises);
      }

      const markdownContent = editor.api.markdown.serialize();
      const assigneeIds = selectedUser ? [selectedUser.id] : [];

      if (mode === 'add') {
        await dispatch(
          createIssue({
            projectId,
            name,
            type,
            priority,
            description: markdownContent,
            assigneeIds,
            attachmentFileNames, // <— для create используем attachmentFileNames
            dueDate: dueDate || undefined, // если бэк не поддерживает - закомментируй
            customFields,
          })
        ).unwrap();
      } else if (mode === 'edit' && issue) {
        // Для edit собираем attachments как AttachmentDto[]
        const existingAttachments = issue.attachments;
        const newAttachments = attachmentFileNames.map((url) => ({
          originalFileName: url.split('/').pop() || url, // извлекаем имя файла из URL
          url,
        }));

        await dispatch(
          updateIssue({
            id: issue.id,
            data: {
              name,
              type,
              priority,
              description: markdownContent,
              assigneeIds,
              attachments: [...existingAttachments, ...newAttachments], // <— для update используем attachments,
              customFields,
            },
          })
        ).unwrap();
      }

      setOpen(false);
    } catch (error: unknown) {
      setUploadError(getApiErrorMessage(error, 'Upload failed'));
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
          // При открытии сбрасываем поля в зависимости от режима
          if (mode === 'add') {
            setName('');
            setType('TASK');
            setPriority('HIGH');
            setFiles([]);
            setUploadError(null);
            setSelectedUser(null);
            setSearchQuery('');
            setCustomFields({});
            editor.tf.reset();
          } else {
            // В режиме edit сбрасываем только выбранные файлы
            setFiles([]);
            setUploadError(null);
            setCustomFields(issue?.customFields ?? {});
          }
        }
      }}
    >
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button variant="default">{title}</Button>
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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {isFieldVisible('name') && (
            <div className="flex flex-col gap-3">
              <Label>Issue Name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          )}
          {(isFieldVisible('type') || isFieldVisible('priority')) && (
            <div className="flex gap-4">
              {isFieldVisible('type') && (
                <div className="flex flex-1 flex-col gap-3">
                  <span className="text-sm font-medium">Type</span>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as IssueType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['TASK', 'BUG', 'FEATURE', 'SEARCH'].map((type) => (
                        <SelectItem key={type} value={type}>
                          {capitalize(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isFieldVisible('priority') && (
                <div className="flex flex-1 flex-col gap-3">
                  <span className="text-sm font-medium">Priority</span>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as IssuePriority)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {capitalize(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          {isFieldVisible('description') && (
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
                    <ToolbarButton
                      onClick={() => editor.tf.blockquote.toggle()}
                    >
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
          )}
          {editableFields
            .filter((field) => field.source === 'custom')
            .map((field) => (
              <div key={field.id} className="flex flex-col gap-3">
                <Label>{field.label}</Label>
                {renderCustomField(field)}
              </div>
            ))}
        </div>
        {isFieldVisible('assigneeIds') && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Select Assignee
            </label>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by name or email..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />

              {usersLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground ml-2 text-sm">
                    Searching...
                  </span>
                </div>
              )}

              {error && (
                <div className="text-destructive p-3 text-sm">{error}</div>
              )}

              {showEmpty && <CommandEmpty>No users found.</CommandEmpty>}

              {!usersLoading && !error && userOptions.length > 0 && (
                <CommandGroup className="max-h-60 overflow-auto">
                  {userOptions.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => setSelectedUser(user)}
                      className={cn(
                        'flex items-center gap-2',
                        selectedUser?.id === user.id && 'bg-accent'
                      )}
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{user.username}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </Command>
          </div>
        )}
        {isFieldVisible('dueDate') && (
          <div className="flex flex-col gap-3">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              className="text-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        {isFieldVisible('attachments') && (
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="picture">Attachments</Label>
            <Input
              id="picture"
              type="file"
              multiple
              onChange={(e) => {
                const fileList = e.target.files;
                if (fileList) {
                  setFiles(Array.from(fileList));
                }
              }}
              disabled={isUploading || isCreatingIssue === 'pending'}
            />

            {/* Показываем новые выбранные файлы */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">New files:</span>
                {files.map((f, idx) => (
                  <span key={idx} className="text-muted-foreground text-xs">
                    {f.name}
                  </span>
                ))}
              </div>
            )}

            {/* Показываем существующие attachments в режиме edit */}
            {mode === 'edit' && issue && issue.attachments.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  Current attachments:
                </span>
                {issue.attachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {attachment.originalFileName}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      ({attachment.url})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isUploading || isCreatingIssue === 'pending' || !name}
          >
            {isUploading
              ? 'Uploading...'
              : isCreatingIssue === 'pending'
                ? 'Creating...'
                : mode === 'add'
                  ? 'Create'
                  : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
