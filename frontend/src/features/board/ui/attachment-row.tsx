import { useAppDispatch, useAppSelector } from '@/store';
import {
  downloadAttachment,
  deleteAttachment,
} from '@/features/board/model/board.actions.ts';
import { Button } from '@/components/ui/button.tsx';
import { Download, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface AttachmentRowProps {
  filename: string;
  issueId: number;
  originalFileName?: string;
  className?: string;
}

export const AttachmentRow = ({
  filename,
  issueId,
  originalFileName,
  className,
}: AttachmentRowProps) => {
  console.log('fn ' + filename);
  console.log('og ' + originalFileName);
  const dispatch = useAppDispatch();
  const { downloading, deleting, downloadingError, deletingError } =
    useAppSelector((s) => s.boardReducer);

  const isDownloading = !!downloading[filename];
  const isDeleting = !!deleting[filename];

  const handleDownload = async () => {
    const action = await dispatch(downloadAttachment(filename));
    if (downloadAttachment.fulfilled.match(action)) {
      const { blob, filename: realName } = action.payload;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = realName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = () => {
    dispatch(deleteAttachment({ id: issueId, url: filename }));
  };

  const label = originalFileName || filename;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded border px-3 py-2 text-sm',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="text-muted-foreground h-4 w-4" />
        <span className="max-w-60 truncate" title={label}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={isDownloading}
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {(downloadingError[filename] || deletingError[filename]) && (
        <div className="mt-1 w-full text-xs text-red-500">
          {downloadingError[filename] || deletingError[filename]}
        </div>
      )}
    </div>
  );
};
