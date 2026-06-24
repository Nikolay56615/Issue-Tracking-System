import { Copy, Download, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  SectionPlaceholder,
  SettingsSection,
} from './components';
import type { TemplatesTabProps } from './types.ts';

export const TemplatesTab = ({
  exportedTemplate,
  templateLoading,
  selectedTemplateProjectId,
  setSelectedTemplateProjectId,
  sourceProjects,
  handleExportTemplate,
  handleApplyTemplate,
  handleImportTemplate,
}: TemplatesTabProps) => {
  const templateJson = exportedTemplate
    ? JSON.stringify(exportedTemplate, null, 2)
    : '';

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(templateJson);
      toast.success('Template copied');
    } catch {
      toast.error('Could not copy template');
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(
      new Blob([templateJson], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-template-${exportedTemplate?.sourceProjectId ?? 'export'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return <>
    <SettingsSection
      title="Export Template"
      helpText="Export this project configuration so it can be reused by other projects."
      action={
        <Button
          size="sm"
          onClick={handleExportTemplate}
          disabled={templateLoading === 'pending'}
        >
          <Download data-icon="inline-start" />
          Export
        </Button>
      }
    >
      {exportedTemplate ? (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={copyTemplate}>
              <Copy data-icon="inline-start" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download data-icon="inline-start" />
              Download
            </Button>
          </div>
          <pre
            className="bg-muted max-h-96 overflow-auto rounded-lg border p-3
              text-xs"
          >
            {templateJson}
          </pre>
        </div>
      ) : (
        <SectionPlaceholder text="Exported template JSON will appear here." />
      )}
    </SettingsSection>

    <SettingsSection
      title="Import Template"
      helpText="Import an exported JSON template and apply it to this project."
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-file">Template JSON</Label>
        <div className="flex items-center gap-2">
          <Upload className="text-muted-foreground size-4" />
          <Input
            id="template-file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImportTemplate(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Apply Existing Template"
      helpText="Copy settings from another active project into this one."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={handleApplyTemplate}
          disabled={templateLoading === 'pending'}
        >
          <Sparkles data-icon="inline-start" />
          Apply
        </Button>
      }
    >
      <div className="space-y-2">
        <Label>Source project</Label>
        <Select
          value={selectedTemplateProjectId}
          onValueChange={setSelectedTemplateProjectId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a project template" />
          </SelectTrigger>
          <SelectContent>
            {sourceProjects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!sourceProjects.length && (
        <SectionPlaceholder text="No other active projects are available as template sources." />
      )}
    </SettingsSection>
  </>;
};
