import { Eye, EyeOff } from 'lucide-react';
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
  shownOnBoardCard,
  toggleBoardCardField,
}: FieldRowProps) => {
  const isCustomField = fieldEntry.kind === 'custom';
  const field = fieldEntry.customField;
  const isOpen = field != null && expandedFieldId === field.id;
  const canToggleBoardCard = fieldEntry.id !== 'name';

  return (
    <SortableSettingsRow id={fieldEntry.id}>
      {({ draggable, isDragging }) => (
        <div
          className={cn(
            'bg-background rounded-lg border',
            isDragging && 'shadow-sm'
          )}
        >
          <div className="flex items-center pr-2">
            <div className="min-w-0 flex-1">
              <RowToggleButton
                title={fieldEntry.label}
                subtitle={
                  isCustomField && field
                    ? formatFieldTypeLabel(field.type)
                    : undefined
                }
                meta={getFieldEntryMeta(fieldEntry, issues)}
                open={isOpen}
                onClick={
                  field
                    ? () => setExpandedFieldId(isOpen ? null : field.id)
                    : undefined
                }
                draggable={draggable}
                expandable={Boolean(field)}
                compact
              />
            </div>
            {canToggleBoardCard && (
              <button
                type="button"
                className="text-muted-foreground hover:bg-muted hover:text-foreground
                  inline-flex size-8 shrink-0 items-center justify-center
                  rounded-md transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleBoardCardField(fieldEntry.id);
                }}
                aria-label={
                  shownOnBoardCard
                    ? 'Hide field from board cards'
                    : 'Show field on board cards'
                }
              >
                {shownOnBoardCard ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </button>
            )}
          </div>
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
