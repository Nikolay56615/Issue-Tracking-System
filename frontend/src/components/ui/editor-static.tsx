import type { VariantProps } from 'class-variance-authority';

import { type PlateStaticProps, PlateStatic } from 'platejs/static';

import { editorStaticVariants } from '@/components/ui/editor-static-variants.ts';
import { cn } from '@/lib/utils';

export function EditorStatic({
  className,
  variant,
  ...props
}: PlateStaticProps & VariantProps<typeof editorStaticVariants>) {
  return (
    <PlateStatic
      className={cn(editorStaticVariants({ variant }), className)}
      {...props}
    />
  );
}
