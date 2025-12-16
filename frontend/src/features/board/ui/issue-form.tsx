import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { DialogClose, DialogTitle } from '@radix-ui/react-dialog';
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
import {ToolbarButton} from "@/components/ui/toolbar.tsx";
import { MarkdownPlugin } from '@platejs/markdown';
import {useAppDispatch} from "@/store";
import {createIssue} from "@/features/board/model/board.actions.ts";
import {useState} from "react";

interface IssueFormProps {
  mode: 'add' | 'edit';
}

export const IssueForm = ({ mode }: IssueFormProps) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('')

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      MarkdownPlugin
    ],
  });

  const title = mode === 'add' ? 'Add Issue' : 'Edit Issue';

  const onSubmit = () => {
    const markdownContent = editor.api.markdown.serialize();

    dispatch(createIssue({projectId: 1, name: 'name', type: 'FEATURE', priority: 'HIGH', description: markdownContent}))
  }

  return (
    <Dialog>
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
            <Input value={name} onChange={(event) => setName(event.target.value)}/>
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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={onSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
