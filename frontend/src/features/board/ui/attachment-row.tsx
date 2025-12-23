import { useAppDispatch, useAppSelector } from '@/store';
import {
  downloadAttachment,
  deleteAttachment,
} from '@/features/board/model/board.actions.ts';

export const AttachmentRow = ({ filename }: { filename: string }) => {
  const dispatch = useAppDispatch();
  const { downloading, deleting, downloadingError, deletingError } =
    useAppSelector((s) => s.boardReducer);

  const isDownloading = !!downloading[filename];
  const isDeleting = !!deleting[filename];

  const handleDownload = async () => {
    const { payload } = await dispatch(downloadAttachment(filename));
    if (
      downloadAttachment.fulfilled.match({
        type: downloadAttachment.fulfilled.type,
        payload,
      })
    ) {
      const { blob, filename: realName } = payload as {
        blob: Blob;
        filename: string;
      };

      const url = window.URL.createObjectURL(blob); // [web:86][web:89]
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
    dispatch(deleteAttachment(filename));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-60 truncate">{filename}</span>
      <button disabled={isDownloading} onClick={handleDownload}>
        {isDownloading ? 'Downloading...' : 'Download'}
      </button>
      <button disabled={isDeleting} onClick={handleDelete}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      {downloadingError[filename] && <span>{downloadingError[filename]}</span>}
      {deletingError[filename] && <span>{deletingError[filename]}</span>}
    </div>
  );
};
