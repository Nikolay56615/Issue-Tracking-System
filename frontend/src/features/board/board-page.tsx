import { Board } from './ui/board';
import { useParams } from 'react-router';

export const BoardPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  return (
    <div>
      <Board projectId={projectId} />
    </div>
  );
};
