import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useAppDispatch, useAppSelector } from '@/store';
import { createProject } from '@/features/profile/model/profile.actions.ts';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

export const CreateProjectForm = () => {
  const dispatch = useAppDispatch();
  const { projects, createProjectLoading } = useAppSelector(
    (state) => state.profile
  );
  const [projectName, setProjectName] = useState('');
  const [templateProjectId, setTemplateProjectId] = useState<string>('default');

  const templateProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects]
  );

  const onSubmit = async () => {
    try {
      await dispatch(
        createProject({
          name: projectName,
          templateProjectId:
            templateProjectId === 'default'
              ? undefined
              : Number(templateProjectId),
        })
      ).unwrap();
      toast.success('Project created successfully');
      setProjectName('');
      setTemplateProjectId('default');
    } catch (error) {
      toast.error(error as string);
    }
  };

  return (
    <div className="flex items-end gap-4 rounded-lg border p-4">
      <div className="flex flex-1 flex-col gap-2">
        <Label>New Project</Label>
        <Input
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
        />
      </div>
      <div className="flex min-w-60 flex-col gap-2">
        <Label>Template</Label>
        <Select value={templateProjectId} onValueChange={setTemplateProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Default template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default template</SelectItem>
            {templateProjects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={onSubmit}
        disabled={!projectName.trim() || createProjectLoading === 'pending'}
      >
        {createProjectLoading === 'pending' ? 'Creating...' : 'Create'}
      </Button>
    </div>
  );
};
