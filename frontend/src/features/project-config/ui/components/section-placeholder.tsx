import type { SectionPlaceholderProps } from './types.ts';

export const SectionPlaceholder = ({ text }: SectionPlaceholderProps) => (
  <div
    className="text-muted-foreground bg-muted/20 rounded-lg border border-dashed
      px-3 py-4 text-sm"
  >
    {text}
  </div>
);
