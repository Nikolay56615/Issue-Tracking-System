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
import { FieldRow, SettingsSection } from './components';
import type { FieldsTabProps } from './types.ts';

export const FieldsTab = ({
  draft,
  fieldEntries,
  expandedFieldId,
  setExpandedFieldId,
  addField,
  deleteField,
  updateField,
  switchFieldType,
  handleFieldDragEnd,
  issues,
}: FieldsTabProps) => {
  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  return (
    <SettingsSection
      title="Issue Fields"
      className="w-full max-w-3xl"
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
  );
};
