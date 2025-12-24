import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  downloadAttachment,
  deleteAttachment,
} from '@/features/board/model/board.actions';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentImageProps {
  filename: string;
  issueId: number;
  originalFileName?: string;
  className?: string;
  onDelete?: (issueId: number, filename: string) => void;
}

export const AttachmentImage = ({
  filename,
  originalFileName,
  issueId,
  className,
  onDelete,
}: AttachmentImageProps) => {
  const dispatch = useAppDispatch();
  const { downloading, downloadingError, deleting, deletingError } =
    useAppSelector((state) => state.boardReducer);

  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    const load = async () => {
      const action = await dispatch(downloadAttachment(filename));

      if (downloadAttachment.fulfilled.match(action)) {
        const { blob } = action.payload;
        url = URL.createObjectURL(blob);
        setSrc(url);
      }
    };

    load();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [dispatch, filename]);

  const isLoading = !!downloading[filename];
  const isDeleting = !!deleting[filename];
  const error = downloadingError[filename] || deletingError[filename];

  const handleDelete = () => {
    if (onDelete) {
      onDelete(issueId, filename);
    } else {
      dispatch(deleteAttachment({ id: issueId, url: filename }));
    }
  };

  if (isLoading && !src) {
    return (
      <div
        className="bg-muted flex h-40 items-center justify-center rounded
          border"
      >
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !src) {
    return (
      <div
        className="bg-destructive/10 text-destructive rounded border p-3
          text-sm"
      >
        Failed to load: {error}
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <div className="group relative">
      <img
        src={src}
        alt={originalFileName || filename}
        className={className ?? 'max-h-80 w-full rounded border object-contain'}
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity
          group-hover:opacity-100"
        disabled={isDeleting}
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
};
