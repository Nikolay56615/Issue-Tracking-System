import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { cn } from '@/lib/utils.ts';
import { RowToggleButton } from './row-toggle-button.tsx';
import { SortableSettingsRow } from './sortable-settings-row.tsx';
import type { StatusRowProps } from './types.ts';

export const StatusRow = ({
  status,
  isOpen,
  issueCount,
  onToggle,
  onDelete,
  onSetInitial,
  updateStatus,
}: StatusRowProps) => (
  <SortableSettingsRow id={status.id}>
    {({ draggable, isDragging }) => (
      <div
        className={cn(
          'bg-background rounded-lg border',
          isDragging && 'shadow-sm'
        )}
      >
        <RowToggleButton
          title={status.name}
          subtitle={status.isInitial ? 'Initial status' : 'Lifecycle status'}
          meta={`${issueCount} issues`}
          open={isOpen}
          onClick={onToggle}
          accent={
            <span
              className="h-3 w-3 shrink-0 rounded-full border"
              style={{ backgroundColor: status.color }}
            />
          }
          draggable={draggable}
        />
        {isOpen && (
          <div className="border-t px-3 py-3">
            <div
              className="grid gap-3
                md:grid-cols-[1fr_140px_auto]"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={status.name}
                  onChange={(event) =>
                    updateStatus(status.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={status.color}
                  onChange={(event) =>
                    updateStatus(status.id, (current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end justify-end">
                <Button size="sm" variant="ghost" onClick={() => onDelete(status.id)}>
                  <Trash data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={Boolean(status.isInitial)}
                onChange={() => onSetInitial(status.id)}
              />
              <span>Initial status</span>
            </label>
          </div>
        )}
      </div>
    )}
  </SortableSettingsRow>
);
