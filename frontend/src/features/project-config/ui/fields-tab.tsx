import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardCardFieldRow, FieldRow, SettingsSection } from './components';
import type { FieldsTabProps } from './types.ts';

export const FieldsTab = ({
  draft,
  fieldEntries,
  boardCardFieldIds,
  expandedFieldId,
  setExpandedFieldId,
  addField,
  deleteField,
  updateField,
  switchFieldType,
  handleFieldDragEnd,
  toggleBoardCardField,
  issues,
}: FieldsTabProps) => {
  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const configurableCardFields = fieldEntries.filter(
    (fieldEntry) => fieldEntry.id !== 'name'
  );
  const visibleCardFieldIds = new Set(boardCardFieldIds);

  return (
    <>
      <SettingsSection
        title="Issue Fields"
        helpText="Fields define which system and custom fields appear on issues and in what order."
        action={
          <Button size="sm" onClick={addField}>
            <Plus data-icon="inline-start" />
            Add field
          </Button>
        }
      >
        <DndContext
          sensors={fieldSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFieldDragEnd}
        >
          <SortableContext
            items={fieldEntries.map((fieldEntry) => fieldEntry.id)}
            strategy={verticalListSortingStrategy}
          >
            {fieldEntries.map((fieldEntry) => (
              <FieldRow
                key={fieldEntry.id}
                fieldEntry={fieldEntry}
                draft={draft}
                issues={issues}
                expandedFieldId={expandedFieldId}
                setExpandedFieldId={setExpandedFieldId}
                updateField={updateField}
                switchFieldType={switchFieldType}
                deleteField={deleteField}
              />
            ))}
          </SortableContext>
        </DndContext>
      </SettingsSection>

      <SettingsSection
        title="Board Card Fields"
        description={`${visibleCardFieldIds.size} fields shown`}
        helpText="Choose which issue fields are shown on board cards. Field order follows Issue Fields."
      >
        {configurableCardFields.map((fieldEntry) => (
          <BoardCardFieldRow
            key={fieldEntry.id}
            fieldEntry={fieldEntry}
            checked={visibleCardFieldIds.has(fieldEntry.id)}
            onToggle={toggleBoardCardField}
          />
        ))}
      </SettingsSection>
    </>
  );
};
