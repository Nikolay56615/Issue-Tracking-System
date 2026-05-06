import { cn } from '@/lib/utils.ts';
import {
  formatFieldTypeLabel,
  getFieldEntryMeta,
} from '@/features/project-config/model';
import { FieldEditor } from './field-editor.tsx';
import { RowToggleButton } from './row-toggle-button.tsx';
import { SortableSettingsRow } from './sortable-settings-row.tsx';
import type { FieldRowProps } from './types.ts';

export const FieldRow = ({
  fieldEntry,
  draft,
  issues,
  expandedFieldId,
  setExpandedFieldId,
  updateField,
  switchFieldType,
  deleteField,
}: FieldRowProps) => {
  const isCustomField = fieldEntry.kind === 'custom';
  const field = fieldEntry.customField;
  const isOpen = field != null && expandedFieldId === field.id;

  return (
    <SortableSettingsRow id={fieldEntry.id}>
      {({ draggable, isDragging }) => (
        <div
          className={cn(
            'bg-background rounded-lg border',
            isDragging && 'shadow-sm'
          )}
        >
          <RowToggleButton
            title={fieldEntry.label}
            subtitle={
              isCustomField && field ? formatFieldTypeLabel(field.type) : undefined
            }
            meta={getFieldEntryMeta(fieldEntry, issues)}
            open={isOpen}
            onClick={field ? () => setExpandedFieldId(isOpen ? null : field.id) : undefined}
            draggable={draggable}
            expandable={Boolean(field)}
          />
          {field && isOpen && (
            <FieldEditor
              field={field}
              roles={draft.roles}
              updateField={updateField}
              switchFieldType={switchFieldType}
              deleteField={deleteField}
            />
          )}
        </div>
      )}
    </SortableSettingsRow>
  );
};
