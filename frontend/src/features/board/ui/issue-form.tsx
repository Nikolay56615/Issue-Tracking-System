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
  uploadAttachment,
} from '@/features/board/model/board.actions.ts';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { capitalize } from '@/lib/utils.ts';
import type { IssuePriority, IssueType } from '@/features/board/model';

interface IssueFormProps {
  mode: 'add' | 'edit';
  projectId: number;
}

export const IssueForm = ({ mode, projectId }: IssueFormProps) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [type, setType] = useState<IssueType>('TASK');
  const [priority, setPriority] = useState<IssuePriority>('HIGH');
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
  });

  const title = mode === 'add' ? 'Add Issue' : 'Edit Issue';

  const onSubmit = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      let attachmentFileNames: string[] = [];

      if (file) {
        const fileName = await dispatch(uploadAttachment(file)).unwrap();
        attachmentFileNames = [fileName];
      }

      const markdownContent = editor.api.markdown.serialize();

      await dispatch(
        createIssue({
          projectId: projectId,
          name: name,
          type: type,
          priority: priority,
          description: markdownContent,
          assigneeIds: [],
          attachmentFileNames: attachmentFileNames,
        })
      ).unwrap();

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
        if (isOpen) {
          setName('');
          setType('TASK');
          setPriority('HIGH');
          setFile(null);
          setUploadError(null);
          editor.tf.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">{title}</Button>
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
        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="picture">Picture</Label>
          <Input
            id="picture"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={isUploading || isCreatingIssue === 'pending'}
          />
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
