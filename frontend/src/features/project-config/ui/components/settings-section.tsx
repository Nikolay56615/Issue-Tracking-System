import { Info } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import type { SettingsSectionProps } from './types.ts';

export const SettingsSection = ({
  title,
  description,
  helpText,
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
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground
                    inline-flex size-5 items-center justify-center rounded-sm
                    transition-colors"
                  aria-label={`${title} help`}
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{helpText}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="space-y-2 p-3">{children}</div>
  </section>
);
