import { Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
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
}: TemplatesTabProps) => (
  <>
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
        <pre
          className="bg-muted max-h-96 overflow-auto rounded-lg border p-3
            text-xs"
        >
          {JSON.stringify(exportedTemplate, null, 2)}
        </pre>
      ) : (
        <SectionPlaceholder text="Exported template JSON will appear here." />
      )}
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
  </>
);
