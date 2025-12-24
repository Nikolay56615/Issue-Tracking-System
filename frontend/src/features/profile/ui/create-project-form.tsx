import { useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useAppDispatch } from '@/store';
import { createProject } from '@/features/profile/model/profile.actions.ts';
import { toast } from 'sonner';

export const CreateProjectForm = () => {
  const dispatch = useAppDispatch();

  const [projectName, setProjectName] = useState('');

  const onSubmit = async () => {
    try {
      await dispatch(createProject({ name: projectName })).unwrap();
      toast.success('Project created successfully');
    } catch (error) {
      toast.error(error as string);
    }
  };

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <Label>New Project</Label>
      <Input
        value={projectName}
        onChange={(event) => setProjectName(event.target.value)}
      />
      <Button onClick={onSubmit}>Create</Button>
    </div>
  );
};
