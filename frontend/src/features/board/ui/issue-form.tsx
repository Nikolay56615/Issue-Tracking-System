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
import type { Issue, IssuePriority, IssueType } from '@/features/board/model';
import type { UserProfile } from '@/features/profile';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.tsx';
import { Loader2, Pencil, User } from 'lucide-react';
import { ProfileRequests } from '@/features/profile/api';

interface IssueFormProps {
  mode: 'add' | 'edit';
  projectId: number;
  issue?: Issue;
}

export const IssueForm = ({ mode, projectId, issue }: IssueFormProps) => {
  const dispatch = useAppDispatch();
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

  const isCreatingIssue = useAppSelector((state) => state.boardReducer.loading);

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

  const onSubmit = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      let attachmentFileNames: string[] = [];

      // Загружаем все файлы параллельно
      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          dispatch(uploadAttachment(file)).unwrap()
        );
        attachmentFileNames = await Promise.all(uploadPromises);
      }

      // Для edit добавляем существующие
      if (mode === 'edit' && issue) {
        const existingFileNames = issue.attachments.map((a) => a.url);
        attachmentFileNames = [...existingFileNames, ...attachmentFileNames];
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
            attachmentFileNames,
          })
        ).unwrap();
      } else if (mode === 'edit' && issue) {
        await dispatch(
          updateIssue({
            id: issue.id,
            data: {
              name,
              type,
              priority,
              description: markdownContent,
              assigneeIds,
              attachmentFileNames,
            },
          })
        ).unwrap();
      }

      setOpen(false);
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen && mode === 'add') {
          setName('');
          setType('TASK');
          setPriority('HIGH');
          setFiles([]); // <— очищаем массив файлов
          setUploadError(null);
          editor.tf.reset();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>Issue Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex gap-4">
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
                    <SelectItem value={type}>{capitalize(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <span className="text-sm font-medium">Priority</span>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as IssuePriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                    <SelectItem value={priority}>
                      {capitalize(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex w-115 flex-col gap-3">
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
                  <MarkToolbarButton nodeType="underline" tooltip="Underline">
                    U
                  </MarkToolbarButton>
                </FixedToolbar>
                <EditorContainer className="h-90">
                  <Editor />
                </EditorContainer>
              </Plate>
            </div>
          </div>
        </div>
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
        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="picture">Picture</Label>
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
          {files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((f, idx) => (
                <span key={idx} className="text-muted-foreground text-xs">
                  {f.name}
                </span>
              ))}
            </div>
          )}
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>
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
