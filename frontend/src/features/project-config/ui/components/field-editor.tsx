import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  FIELD_TYPE_OPTIONS,
  formatFieldTypeLabel,
  type CustomFieldType,
} from '@/features/project-config/model';
import type { FieldEditorProps } from './types.ts';

export const FieldEditor = ({
  field,
  roles,
  updateField,
  switchFieldType,
  deleteField,
}: FieldEditorProps) => (
  <div className="border-t px-3 py-3">
    <div
      className="grid gap-3
        md:grid-cols-[1fr_220px_auto]"
    >
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={field.name}
          onChange={(event) =>
            updateField(field.id, (current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={field.type}
          onValueChange={(value) =>
            updateField(field.id, (current) =>
              switchFieldType(current, value as CustomFieldType, roles)
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {formatFieldTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end justify-end">
        <Button size="sm" variant="ghost" onClick={() => deleteField(field.id)}>
          <Trash data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>

    <label className="mt-4 flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={field.required}
        onChange={(event) =>
          updateField(field.id, (current) => ({
            ...current,
            required: event.target.checked,
          }))
        }
      />
      <span>Required field</span>
    </label>

    <div className="mt-4">
      {field.type === 'text' && (
        <div className="space-y-2">
          <Label>Max length</Label>
          <Input
            type="number"
            value={field.config.maxLength ?? ''}
            onChange={(event) =>
              updateField(field.id, (current) =>
                current.type === 'text'
                  ? {
                      ...current,
                      config: {
                        maxLength:
                          event.target.value === ''
                            ? undefined
                            : Number(event.target.value),
                      },
                    }
                  : current
              )
            }
          />
        </div>
      )}

      {field.type === 'number' && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Min</Label>
            <Input
              type="number"
              value={field.config.min ?? ''}
              onChange={(event) =>
                updateField(field.id, (current) =>
                  current.type === 'number'
                    ? {
                        ...current,
                        config: {
                          ...current.config,
                          min:
                            event.target.value === ''
                              ? undefined
                              : Number(event.target.value),
                        },
                      }
                    : current
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Max</Label>
            <Input
              type="number"
              value={field.config.max ?? ''}
              onChange={(event) =>
                updateField(field.id, (current) =>
                  current.type === 'number'
                    ? {
                        ...current,
                        config: {
                          ...current.config,
                          max:
                            event.target.value === ''
                              ? undefined
                              : Number(event.target.value),
                        },
                      }
                    : current
                )
              }
            />
          </div>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(field.config.isInteger)}
              onChange={(event) =>
                updateField(field.id, (current) =>
                  current.type === 'number'
                    ? {
                        ...current,
                        config: {
                          ...current.config,
                          isInteger: event.target.checked,
                        },
                      }
                    : current
                )
              }
            />
            <span>Integer only</span>
          </label>
        </div>
      )}

      {field.type === 'user_reference' && (
        <div className="space-y-2">
          <Label>Allowed roles</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {roles.map((projectRole) => (
              <label key={projectRole.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.config.allowedRoleIds.includes(projectRole.id)}
                  onChange={(event) =>
                    updateField(field.id, (current) =>
                      current.type === 'user_reference'
                        ? {
                            ...current,
                            config: {
                              allowedRoleIds: event.target.checked
                                ? [...current.config.allowedRoleIds, projectRole.id]
                                : current.config.allowedRoleIds.filter(
                                    (item) => item !== projectRole.id
                                  ),
                            },
                          }
                        : current
                    )
                  }
                />
                <span>{projectRole.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {field.type === 'date' && (
        <div className="text-muted-foreground text-sm">
          This field stores a calendar date.
        </div>
      )}

      {field.type === 'issue_reference' && (
        <div className="text-muted-foreground text-sm">
          This field can reference only issues from the same project.
        </div>
      )}
    </div>
  </div>
);
