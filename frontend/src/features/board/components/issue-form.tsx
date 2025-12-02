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

interface IssueFormProps {
  mode: 'add' | 'edit';
}

export const IssueForm = ({ mode }: IssueFormProps) => {
  const editor = usePlateEditor(); // Initializes the editor instance

  const title = mode === 'add' ? 'Add Issue' : 'Edit Issue';

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="default">{title}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>Issue Name</Label>
            <Input />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Issue Description</Label>
            <Plate editor={editor}>
              <EditorContainer className="border">
                <Editor placeholder="Type your amazing content here..." />
              </EditorContainer>
            </Plate>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
