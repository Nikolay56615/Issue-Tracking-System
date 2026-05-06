import { cn } from '@/lib/utils.ts';
import type { SettingsSectionProps } from './types.ts';

export const SettingsSection = ({
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) => (
  <section className={cn('bg-background rounded-xl border', className)}>
    <div
      className="flex min-h-15 flex-wrap justify-between gap-3 border-b px-4
        py-3"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="space-y-2 p-3">{children}</div>
  </section>
);
